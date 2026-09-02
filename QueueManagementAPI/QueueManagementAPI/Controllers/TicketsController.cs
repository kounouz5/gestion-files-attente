using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using QueueManagementAPI.Data;
using QueueManagementAPI.DTOs;
using QueueManagementAPI.Hubs;
using QueueManagementAPI.Models;
using QueueManagementAPI.Services;
using System.Security.Claims;

namespace QueueManagementAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TicketsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ITicketQueueService _queueService;
        private readonly IHubContext<QueueHub> _hub;

        public TicketsController(ApplicationDbContext context, ITicketQueueService queueService, IHubContext<QueueHub> hub)
        {
            _context = context;
            _queueService = queueService;
            _hub = hub;
        }

        // Prise de ticket — accessible aux clients anonymes ou authentifiés
        [HttpPost]
        [AllowAnonymous]
        public async Task<ActionResult<TicketDto>> CreateTicket(CreateTicketDto dto)
        {
            var service = await _context.Services.FindAsync(dto.ServiceId);
            if (service is null) return NotFound(new { message = "Service introuvable." });
            if (!service.EstActif) return BadRequest(new { message = "Ce service est actuellement désactivé." });

            string? clientUserId = null;
            if (User.Identity?.IsAuthenticated == true)
            {
                clientUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            }

            var ticket = new Ticket
            {
                NumeroTicket = await _queueService.GenererNumeroTicketAsync(service),
                ServiceId = service.Id,
                ClientUserId = clientUserId,
                Statut = TicketStatut.EnAttente,
                DateCreation = DateTime.UtcNow
            };

            _context.Tickets.Add(ticket);
            await _context.SaveChangesAsync();

            var dtoResult = await BuildTicketDto(ticket, service);

            await _hub.Clients.Group($"service-{service.Id}").SendAsync(QueueHubEvents.TicketCree, dtoResult);
            await _hub.Clients.Group("admin-dashboard").SendAsync(QueueHubEvents.DashboardMisAJour);

            return CreatedAtAction(nameof(GetById), new { id = ticket.Id }, dtoResult);
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<TicketDto>> GetById(int id)
        {
            var ticket = await _context.Tickets.Include(t => t.Service).Include(t => t.Guichet)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (ticket is null) return NotFound();
            return Ok(await BuildTicketDto(ticket, ticket.Service));
        }

        // Suivi léger du statut d'un ticket (pour affichage écran/kiosque)
        [HttpGet("{id}/statut")]
        [AllowAnonymous]
        public async Task<ActionResult<TicketPublicStatusDto>> GetStatutPublic(int id)
        {
            var ticket = await _context.Tickets.Include(t => t.Service).FirstOrDefaultAsync(t => t.Id == id);
            if (ticket is null) return NotFound();

            var enCours = await _context.Tickets
                .Where(t => t.ServiceId == ticket.ServiceId && t.Statut == TicketStatut.EnCours)
                .OrderByDescending(t => t.DateDebutTraitement)
                .Select(t => t.NumeroTicket)
                .FirstOrDefaultAsync();

            var dernierAppele = await _context.Tickets
                .Where(t => t.ServiceId == ticket.ServiceId && t.DateAppel != null)
                .OrderByDescending(t => t.DateAppel)
                .Select(t => t.NumeroTicket)
                .FirstOrDefaultAsync();

            return Ok(new TicketPublicStatusDto
            {
                NumeroTicket = ticket.NumeroTicket,
                Statut = ticket.Statut.ToString(),
                PositionDansFile = await _queueService.CalculerPositionAsync(ticket),
                TempsAttenteEstimeMinutes = await _queueService.EstimerTempsAttenteAsync(ticket),
                TicketEnCours = enCours,
                DernierTicketAppele = dernierAppele
            });
        }

        // Tickets de l'utilisateur authentifié
        [HttpGet("mes-tickets")]
        [Authorize(Roles = Roles.Client)]
        public async Task<ActionResult<List<TicketDto>>> GetMesTickets()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)!.Value;

            var tickets = await _context.Tickets
                .Include(t => t.Service).Include(t => t.Guichet)
                .Where(t => t.ClientUserId == userId)
                .OrderByDescending(t => t.DateCreation)
                .ToListAsync();

            var result = new List<TicketDto>();
            foreach (var t in tickets) result.Add(await BuildTicketDto(t, t.Service));
            return Ok(result);
        }

        // Ticket actuellement en cours de traitement pour un service donné
        [HttpGet("service/{serviceId}/en-cours")]
        [AllowAnonymous]
        public async Task<ActionResult<TicketDto?>> GetTicketEnCours(int serviceId)
        {
            var ticket = await _context.Tickets
                .Include(t => t.Service).Include(t => t.Guichet)
                .Where(t => t.ServiceId == serviceId && t.Statut == TicketStatut.EnCours)
                .OrderByDescending(t => t.DateDebutTraitement)
                .FirstOrDefaultAsync();

            if (ticket is null) return Ok(null);
            return Ok(await BuildTicketDto(ticket, ticket.Service));
        }

        // Dernier ticket appelé pour un service donné
        [HttpGet("service/{serviceId}/dernier-appele")]
        [AllowAnonymous]
        public async Task<ActionResult<TicketDto?>> GetDernierAppele(int serviceId)
        {
            var ticket = await _context.Tickets
                .Include(t => t.Service).Include(t => t.Guichet)
                .Where(t => t.ServiceId == serviceId && t.DateAppel != null)
                .OrderByDescending(t => t.DateAppel)
                .FirstOrDefaultAsync();

            if (ticket is null) return Ok(null);
            return Ok(await BuildTicketDto(ticket, ticket.Service));
        }

        // File d'attente complète d'un service (pour écrans d'affichage)
        [HttpGet("service/{serviceId}/file-attente")]
        [AllowAnonymous]
        public async Task<ActionResult<List<TicketDto>>> GetFileAttenteService(int serviceId)
        {
            var tickets = await _context.Tickets
                .Include(t => t.Service)
                .Where(t => t.ServiceId == serviceId && t.Statut == TicketStatut.EnAttente)
                .OrderBy(t => t.DateCreation)
                .ToListAsync();

            var result = new List<TicketDto>();
            foreach (var t in tickets) result.Add(await BuildTicketDto(t, t.Service));
            return Ok(result);
        }

        private async Task<TicketDto> BuildTicketDto(Ticket ticket, Service? service)
        {
            return new TicketDto
            {
                Id = ticket.Id,
                NumeroTicket = ticket.NumeroTicket,
                ServiceId = ticket.ServiceId,
                ServiceNom = service?.Nom ?? string.Empty,
                GuichetId = ticket.GuichetId,
                GuichetNom = ticket.Guichet?.Nom,
                Statut = ticket.Statut.ToString(),
                DateCreation = ticket.DateCreation,
                DateAppel = ticket.DateAppel,
                DateDebutTraitement = ticket.DateDebutTraitement,
                DateFinTraitement = ticket.DateFinTraitement,
                PositionDansFile = await _queueService.CalculerPositionAsync(ticket),
                TempsAttenteEstimeMinutes = await _queueService.EstimerTempsAttenteAsync(ticket)
            };
        }
    }
}
