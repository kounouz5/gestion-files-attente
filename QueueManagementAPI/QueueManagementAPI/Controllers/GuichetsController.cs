using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using QueueManagementAPI.Data;
using QueueManagementAPI.DTOs;
using QueueManagementAPI.Hubs;
using QueueManagementAPI.Models;
using System.Security.Claims;

namespace QueueManagementAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class GuichetsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<QueueHub> _hub;

        public GuichetsController(ApplicationDbContext context, IHubContext<QueueHub> hub)
        {
            _context = context;
            _hub = hub;
        }

        [HttpGet]
        public async Task<ActionResult<List<GuichetDto>>> GetAll()
        {
            var guichets = await _context.Guichets
                .Include(g => g.Agent)
                .Include(g => g.GuichetServices).ThenInclude(gs => gs.Service)
                .ToListAsync();

            return Ok(guichets.Select(MapToDto));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<GuichetDto>> GetById(int id)
        {
            var guichet = await _context.Guichets
                .Include(g => g.Agent)
                .Include(g => g.GuichetServices).ThenInclude(gs => gs.Service)
                .FirstOrDefaultAsync(g => g.Id == id);

            if (guichet is null) return NotFound();
            return Ok(MapToDto(guichet));
        }

        // Consultation de la file d'attente associée à un guichet (services affectés)
        [HttpGet("{id}/file-attente")]
        public async Task<ActionResult<List<TicketDto>>> GetFileAttente(int id)
        {
            var guichet = await _context.Guichets
                .Include(g => g.GuichetServices)
                .FirstOrDefaultAsync(g => g.Id == id);

            if (guichet is null) return NotFound();

            var serviceIds = guichet.GuichetServices.Select(gs => gs.ServiceId).ToList();

            var tickets = await _context.Tickets
                .Include(t => t.Service)
                .Where(t => serviceIds.Contains(t.ServiceId) && t.Statut == TicketStatut.EnAttente)
                .OrderBy(t => t.DateCreation)
                .Select(t => new TicketDto
                {
                    Id = t.Id,
                    NumeroTicket = t.NumeroTicket,
                    ServiceId = t.ServiceId,
                    ServiceNom = t.Service.Nom,
                    Statut = t.Statut.ToString(),
                    DateCreation = t.DateCreation
                })
                .ToListAsync();

            return Ok(tickets);
        }

        [HttpPost]
        [Authorize(Roles = Roles.Admin)]
        public async Task<ActionResult<GuichetDto>> Create(CreateGuichetDto dto)
        {
            var guichet = new Guichet { Nom = dto.Nom, Statut = GuichetStatut.Inactif, EstActif = true };
            _context.Guichets.Add(guichet);
            await _context.SaveChangesAsync();

            foreach (var serviceId in dto.ServiceIds.Distinct())
            {
                if (await _context.Services.AnyAsync(s => s.Id == serviceId))
                    _context.GuichetServices.Add(new GuichetService { GuichetId = guichet.Id, ServiceId = serviceId });
            }
            await _context.SaveChangesAsync();

            var created = await _context.Guichets
                .Include(g => g.Agent)
                .Include(g => g.GuichetServices).ThenInclude(gs => gs.Service)
                .FirstAsync(g => g.Id == guichet.Id);

            return CreatedAtAction(nameof(GetById), new { id = guichet.Id }, MapToDto(created));
        }

        [HttpPut("{id}")]
        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> Update(int id, UpdateGuichetDto dto)
        {
            var guichet = await _context.Guichets.FindAsync(id);
            if (guichet is null) return NotFound();

            if (dto.Nom is not null) guichet.Nom = dto.Nom;
            if (dto.EstActif.HasValue) guichet.EstActif = dto.EstActif.Value;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // Affectation (réaffectation dynamique) des services à un guichet
        [HttpPost("{id}/services")]
        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> AffecterServices(int id, AffecterServicesDto dto)
        {
            var guichet = await _context.Guichets
                .Include(g => g.GuichetServices)
                .FirstOrDefaultAsync(g => g.Id == id);

            if (guichet is null) return NotFound();

            // On remplace entièrement la liste des services affectés (réaffectation dynamique)
            _context.GuichetServices.RemoveRange(guichet.GuichetServices);

            foreach (var serviceId in dto.ServiceIds.Distinct())
            {
                if (await _context.Services.AnyAsync(s => s.Id == serviceId))
                    _context.GuichetServices.Add(new GuichetService { GuichetId = id, ServiceId = serviceId });
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPatch("{id}/toggle")]
        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> ToggleActivation(int id)
        {
            var guichet = await _context.Guichets.FindAsync(id);
            if (guichet is null) return NotFound();

            guichet.EstActif = !guichet.EstActif;
            if (!guichet.EstActif) guichet.Statut = GuichetStatut.Inactif;

            await _context.SaveChangesAsync();
            await NotifierChangementStatut(guichet);

            return Ok(new { estActif = guichet.EstActif, statut = guichet.Statut.ToString() });
        }

        // Changement de statut (Actif / EnPause / Inactif) — accessible à l'Agent connecté ou à l'Admin
        [HttpPatch("{id}/statut")]
        [Authorize(Roles = Roles.Admin + "," + Roles.Agent)]
        public async Task<IActionResult> ChangerStatut(int id, ChangerStatutGuichetDto dto)
        {
            var guichet = await _context.Guichets.FindAsync(id);
            if (guichet is null) return NotFound();

            if (!await VerifierAccesGuichet(id)) return Forbid();

            guichet.Statut = dto.Statut;
            await _context.SaveChangesAsync();
            await NotifierChangementStatut(guichet);

            return Ok(new { statut = guichet.Statut.ToString() });
        }

        // Connexion de l'agent au guichet
        [HttpPost("{id}/connect")]
        [Authorize(Roles = Roles.Agent)]
        public async Task<IActionResult> Connect(int id, [FromServices] Microsoft.AspNetCore.Identity.UserManager<ApplicationUser> userManager)
        {
            var guichet = await _context.Guichets.Include(g => g.Agent).FirstOrDefaultAsync(g => g.Id == id);
            if (guichet is null) return NotFound();
            if (!guichet.EstActif) return BadRequest(new { message = "Ce guichet est désactivé." });
            if (guichet.AgentId is not null) return BadRequest(new { message = "Un agent est déjà connecté à ce guichet." });

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)!.Value;
            var user = await userManager.FindByIdAsync(userId);
            if (user is null) return Unauthorized();

            user.GuichetId = id;
            guichet.Statut = GuichetStatut.Actif;

            await userManager.UpdateAsync(user);
            await _context.SaveChangesAsync();
            await NotifierChangementStatut(guichet);

            return Ok(new { message = "Connecté au guichet.", guichetId = id });
        }

        // Déconnexion de l'agent du guichet
        [HttpPost("{id}/disconnect")]
        [Authorize(Roles = Roles.Agent)]
        public async Task<IActionResult> Disconnect(int id, [FromServices] Microsoft.AspNetCore.Identity.UserManager<ApplicationUser> userManager)
        {
            var guichet = await _context.Guichets.FindAsync(id);
            if (guichet is null) return NotFound();

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)!.Value;
            var user = await userManager.FindByIdAsync(userId);
            if (user is null || user.GuichetId != id) return Forbid();

            user.GuichetId = null;
            guichet.Statut = GuichetStatut.Inactif;

            await userManager.UpdateAsync(user);
            await _context.SaveChangesAsync();
            await NotifierChangementStatut(guichet);

            return Ok(new { message = "Déconnecté du guichet." });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> Delete(int id)
        {
            var guichet = await _context.Guichets.FindAsync(id);
            if (guichet is null) return NotFound();

            var aDesTickets = await _context.Tickets.AnyAsync(t => t.GuichetId == id);
            if (aDesTickets)
                return BadRequest(new { message = "Impossible de supprimer un guichet ayant un historique de tickets. Désactivez-le plutôt." });

            _context.Guichets.Remove(guichet);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // -------- Helpers --------

        private async Task<bool> VerifierAccesGuichet(int guichetId)
        {
            if (User.IsInRole(Roles.Admin)) return true;

            var claim = User.FindFirst("guichetId")?.Value;
            return claim is not null && int.TryParse(claim, out var gId) && gId == guichetId;
        }

        private async Task NotifierChangementStatut(Guichet guichet)
        {
            await _hub.Clients.Group("admin-dashboard").SendAsync(QueueHubEvents.GuichetStatutChange, new
            {
                guichetId = guichet.Id,
                statut = guichet.Statut.ToString()
            });
        }

        private static GuichetDto MapToDto(Guichet g) => new()
        {
            Id = g.Id,
            Nom = g.Nom,
            Statut = g.Statut.ToString(),
            EstActif = g.EstActif,
            AgentId = g.AgentId,
            AgentNomComplet = g.Agent is null ? null : $"{g.Agent.Prenom} {g.Agent.Nom}",
            Services = g.GuichetServices.Select(gs => new ServiceDto
            {
                Id = gs.Service.Id,
                Nom = gs.Service.Nom,
                PrefixeTicket = gs.Service.PrefixeTicket,
                DureeMoyenneMinutes = gs.Service.DureeMoyenneMinutes,
                EstActif = gs.Service.EstActif
            }).ToList()
        };
    }
}
