using Microsoft.EntityFrameworkCore;
using QueueManagementAPI.Data;
using QueueManagementAPI.Models;

namespace QueueManagementAPI.Services
{
    public interface ITicketQueueService
    {
        Task<string> GenererNumeroTicketAsync(Service service);
        Task<int> CalculerPositionAsync(Ticket ticket);
        Task<int> EstimerTempsAttenteAsync(Ticket ticket);
    }

    // Centralise la logique de numérotation et d'estimation de la file d'attente.
    public class TicketQueueService : ITicketQueueService
    {
        private readonly ApplicationDbContext _context;

        public TicketQueueService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<string> GenererNumeroTicketAsync(Service service)
        {
            var debutJournee = DateTime.UtcNow.Date;

            var dernierNumero = await _context.Tickets
                .Where(t => t.ServiceId == service.Id && t.DateCreation >= debutJournee)
                .CountAsync();

            var prochainNumero = dernierNumero + 1;
            return $"{service.PrefixeTicket}-{prochainNumero:D3}";
        }

        public async Task<int> CalculerPositionAsync(Ticket ticket)
        {
            if (ticket.Statut != TicketStatut.EnAttente)
                return 0;

            var position = await _context.Tickets
                .Where(t => t.ServiceId == ticket.ServiceId
                            && t.Statut == TicketStatut.EnAttente
                            && t.DateCreation < ticket.DateCreation)
                .CountAsync();

            return position + 1;
        }

        public async Task<int> EstimerTempsAttenteAsync(Ticket ticket)
        {
            var position = await CalculerPositionAsync(ticket);
            if (position == 0) return 0;

            var service = ticket.Service ?? await _context.Services.FindAsync(ticket.ServiceId);
            var dureeMoyenne = service?.DureeMoyenneMinutes ?? 5;

            // Nombre de guichets actifs affectés à ce service (au minimum 1 pour éviter division par zéro)
            var guichetsActifs = await _context.GuichetServices
                .Where(gs => gs.ServiceId == ticket.ServiceId
                             && gs.Guichet.Statut == GuichetStatut.Actif
                             && gs.Guichet.EstActif)
                .CountAsync();

            guichetsActifs = Math.Max(guichetsActifs, 1);

            return (int)Math.Ceiling((double)position / guichetsActifs) * dureeMoyenne;
        }
    }
}
