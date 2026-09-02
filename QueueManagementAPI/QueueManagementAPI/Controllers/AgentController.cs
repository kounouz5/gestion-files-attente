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
    [Route("api/agent")]
    [Authorize(Roles = Roles.Agent)]
    public class AgentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<QueueHub> _hub;

        public AgentController(ApplicationDbContext context, IHubContext<QueueHub> hub)
        {
            _context = context;
            _hub = hub;
        }

        // Appel du prochain numéro dans la file d'attente du guichet de l'agent connecté
        [HttpPost("guichets/{guichetId}/next")]
        public async Task<ActionResult<TicketDto>> AppelerProchain(int guichetId)
        {
            var guichet = await ObtenirGuichetAutorise(guichetId);
            if (guichet is null) return Forbid();
            if (guichet.Statut != GuichetStatut.Actif)
                return BadRequest(new { message = "Le guichet doit être actif pour appeler un client." });

            // Vérifie qu'il n'y a pas déjà un ticket en cours sur ce guichet
            var ticketEnCours = await _context.Tickets
                .AnyAsync(t => t.GuichetId == guichetId && (t.Statut == TicketStatut.EnCours || t.Statut == TicketStatut.Appele));
            if (ticketEnCours)
                return BadRequest(new { message = "Un ticket est déjà en cours de traitement sur ce guichet. Clôturez-le d'abord." });

            var serviceIds = await _context.GuichetServices
                .Where(gs => gs.GuichetId == guichetId)
                .Select(gs => gs.ServiceId)
                .ToListAsync();

            if (!serviceIds.Any())
                return BadRequest(new { message = "Aucun service n'est affecté à ce guichet." });

            var prochainTicket = await _context.Tickets
                .Include(t => t.Service)
                .Where(t => serviceIds.Contains(t.ServiceId) && t.Statut == TicketStatut.EnAttente)
                .OrderBy(t => t.DateCreation)
                .FirstOrDefaultAsync();

            if (prochainTicket is null)
                return Ok(new { message = "Aucun ticket en attente." });

            await ChangerStatutTicket(prochainTicket, TicketStatut.Appele, guichetId);
            prochainTicket.GuichetId = guichetId;
            prochainTicket.DateAppel = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var dto = MapToDto(prochainTicket);
            await NotifierTicket(prochainTicket, QueueHubEvents.TicketAppele);

            return Ok(dto);
        }

        // Rappel du client (le ticket a été appelé mais le client ne s'est pas présenté)
        [HttpPost("tickets/{ticketId}/recall")]
        public async Task<IActionResult> Rappeler(int ticketId)
        {
            var ticket = await _context.Tickets.Include(t => t.Service).FirstOrDefaultAsync(t => t.Id == ticketId);
            if (ticket is null) return NotFound();
            if (!await VerifierAccesTicket(ticket)) return Forbid();

            if (ticket.Statut != TicketStatut.Appele && ticket.Statut != TicketStatut.EnCours)
                return BadRequest(new { message = "Ce ticket n'est pas dans un état permettant un rappel." });

            ticket.NombreRappels++;
            ticket.DateAppel = DateTime.UtcNow;
            await ChangerStatutTicket(ticket, TicketStatut.Rappele);
            await _context.SaveChangesAsync();

            await NotifierTicket(ticket, QueueHubEvents.TicketAppele);
            return Ok(MapToDto(ticket));
        }

        // Mise en attente d'un ticket (le client sera repris plus tard, remis dans la file)
        [HttpPost("tickets/{ticketId}/hold")]
        public async Task<IActionResult> MettreEnAttente(int ticketId)
        {
            var ticket = await _context.Tickets.Include(t => t.Service).FirstOrDefaultAsync(t => t.Id == ticketId);
            if (ticket is null) return NotFound();
            if (!await VerifierAccesTicket(ticket)) return Forbid();

            await ChangerStatutTicket(ticket, TicketStatut.EnAttenteGuichet);
            await _context.SaveChangesAsync();

            await NotifierTicket(ticket, QueueHubEvents.TicketMisAJour);
            return Ok(MapToDto(ticket));
        }

        // Remet un ticket "en attente guichet" dans la file d'attente normale
        [HttpPost("tickets/{ticketId}/requeue")]
        public async Task<IActionResult> RemettreEnFile(int ticketId)
        {
            var ticket = await _context.Tickets.Include(t => t.Service).FirstOrDefaultAsync(t => t.Id == ticketId);
            if (ticket is null) return NotFound();
            if (!await VerifierAccesTicket(ticket)) return Forbid();

            ticket.GuichetId = null;
            await ChangerStatutTicket(ticket, TicketStatut.EnAttente);
            await _context.SaveChangesAsync();

            await NotifierTicket(ticket, QueueHubEvents.TicketMisAJour);
            return Ok(MapToDto(ticket));
        }

        // Annulation d'un appel / ticket
        [HttpPost("tickets/{ticketId}/cancel")]
        public async Task<IActionResult> Annuler(int ticketId)
        {
            var ticket = await _context.Tickets.Include(t => t.Service).FirstOrDefaultAsync(t => t.Id == ticketId);
            if (ticket is null) return NotFound();
            if (!await VerifierAccesTicket(ticket)) return Forbid();

            ticket.DateAnnulation = DateTime.UtcNow;
            await ChangerStatutTicket(ticket, TicketStatut.Annule);
            await _context.SaveChangesAsync();

            await NotifierTicket(ticket, QueueHubEvents.TicketMisAJour);
            await _hub.Clients.Group("admin-dashboard").SendAsync(QueueHubEvents.DashboardMisAJour);
            return Ok(MapToDto(ticket));
        }

        // Début effectif du traitement (le client est arrivé au guichet)
        [HttpPost("tickets/{ticketId}/start")]
        public async Task<IActionResult> DemarrerTraitement(int ticketId)
        {
            var ticket = await _context.Tickets.Include(t => t.Service).FirstOrDefaultAsync(t => t.Id == ticketId);
            if (ticket is null) return NotFound();
            if (!await VerifierAccesTicket(ticket)) return Forbid();

            ticket.DateDebutTraitement = DateTime.UtcNow;
            await ChangerStatutTicket(ticket, TicketStatut.EnCours);
            await _context.SaveChangesAsync();

            await NotifierTicket(ticket, QueueHubEvents.TicketMisAJour);
            return Ok(MapToDto(ticket));
        }

        // Clôture du traitement du ticket
        [HttpPost("tickets/{ticketId}/close")]
        public async Task<IActionResult> Cloturer(int ticketId)
        {
            var ticket = await _context.Tickets.Include(t => t.Service).FirstOrDefaultAsync(t => t.Id == ticketId);
            if (ticket is null) return NotFound();
            if (!await VerifierAccesTicket(ticket)) return Forbid();

            ticket.DateFinTraitement = DateTime.UtcNow;
            await ChangerStatutTicket(ticket, TicketStatut.Traite);
            await _context.SaveChangesAsync();

            await NotifierTicket(ticket, QueueHubEvents.TicketMisAJour);
            await _hub.Clients.Group("admin-dashboard").SendAsync(QueueHubEvents.DashboardMisAJour);
            return Ok(MapToDto(ticket));
        }

        // Mise en pause du guichet de l'agent
        [HttpPatch("guichets/{guichetId}/pause")]
        public async Task<IActionResult> Pause(int guichetId)
        {
            var guichet = await ObtenirGuichetAutorise(guichetId);
            if (guichet is null) return Forbid();

            guichet.Statut = GuichetStatut.EnPause;
            await _context.SaveChangesAsync();

            await _hub.Clients.Group("admin-dashboard").SendAsync(QueueHubEvents.GuichetStatutChange,
                new { guichetId, statut = guichet.Statut.ToString() });

            return Ok(new { statut = guichet.Statut.ToString() });
        }

        // Reprise du guichet après une pause
        [HttpPatch("guichets/{guichetId}/resume")]
        public async Task<IActionResult> Resume(int guichetId)
        {
            var guichet = await ObtenirGuichetAutorise(guichetId);
            if (guichet is null) return Forbid();

            guichet.Statut = GuichetStatut.Actif;
            await _context.SaveChangesAsync();

            await _hub.Clients.Group("admin-dashboard").SendAsync(QueueHubEvents.GuichetStatutChange,
                new { guichetId, statut = guichet.Statut.ToString() });

            return Ok(new { statut = guichet.Statut.ToString() });
        }

        // Consultation de la file d'attente associée au guichet de l'agent
        [HttpGet("guichets/{guichetId}/file-attente")]
        public async Task<ActionResult<List<TicketDto>>> FileAttente(int guichetId)
        {
            if (!await EstGuichetDeLAgent(guichetId) && !User.IsInRole(Roles.Admin)) return Forbid();

            var serviceIds = await _context.GuichetServices
                .Where(gs => gs.GuichetId == guichetId)
                .Select(gs => gs.ServiceId)
                .ToListAsync();

            var tickets = await _context.Tickets
                .Include(t => t.Service)
                .Where(t => serviceIds.Contains(t.ServiceId) && t.Statut == TicketStatut.EnAttente)
                .OrderBy(t => t.DateCreation)
                .ToListAsync();

            return Ok(tickets.Select(MapToDto));
        }

        // -------- Helpers --------

        private async Task<Guichet?> ObtenirGuichetAutorise(int guichetId)
        {
            if (!await EstGuichetDeLAgent(guichetId)) return null;
            return await _context.Guichets.FindAsync(guichetId);
        }

        private async Task<bool> EstGuichetDeLAgent(int guichetId)
        {
            var claim = User.FindFirst("guichetId")?.Value;
            return claim is not null && int.TryParse(claim, out var gId) && gId == guichetId;
        }

        private async Task<bool> VerifierAccesTicket(Ticket ticket)
        {
            if (User.IsInRole(Roles.Admin)) return true;
            if (ticket.GuichetId is null) return false;
            return await EstGuichetDeLAgent(ticket.GuichetId.Value);
        }

        private async Task ChangerStatutTicket(Ticket ticket, TicketStatut nouveauStatut, int? guichetId = null)
        {
            var ancienStatut = ticket.Statut;
            ticket.Statut = nouveauStatut;

            var agentId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            _context.TicketHistoriques.Add(new TicketHistorique
            {
                TicketId = ticket.Id,
                AncienStatut = ancienStatut,
                NouveauStatut = nouveauStatut,
                AgentId = agentId
            });

            await Task.CompletedTask;
        }

        private async Task NotifierTicket(Ticket ticket, string evenement)
        {
            await _hub.Clients.Group($"service-{ticket.ServiceId}").SendAsync(evenement, MapToDto(ticket));
            if (ticket.GuichetId.HasValue)
                await _hub.Clients.Group($"guichet-{ticket.GuichetId}").SendAsync(evenement, MapToDto(ticket));
        }

        private static TicketDto MapToDto(Ticket t) => new()
        {
            Id = t.Id,
            NumeroTicket = t.NumeroTicket,
            ServiceId = t.ServiceId,
            ServiceNom = t.Service?.Nom ?? string.Empty,
            GuichetId = t.GuichetId,
            Statut = t.Statut.ToString(),
            DateCreation = t.DateCreation,
            DateAppel = t.DateAppel,
            DateDebutTraitement = t.DateDebutTraitement,
            DateFinTraitement = t.DateFinTraitement
        };
    }
}
