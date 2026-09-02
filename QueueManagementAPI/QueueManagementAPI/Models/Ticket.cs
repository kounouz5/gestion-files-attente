namespace QueueManagementAPI.Models
{
    public class Ticket
    {
        public int Id { get; set; }
        public string NumeroTicket { get; set; } = string.Empty; // ex: A-001

        public int ServiceId { get; set; }
        public Service Service { get; set; } = null!;

        public int? GuichetId { get; set; }
        public Guichet? Guichet { get; set; }

        public string? ClientUserId { get; set; } // null si client anonyme
        public ApplicationUser? ClientUser { get; set; }

        public TicketStatut Statut { get; set; } = TicketStatut.EnAttente;

        public DateTime DateCreation { get; set; } = DateTime.UtcNow;
        public DateTime? DateAppel { get; set; }
        public DateTime? DateDebutTraitement { get; set; }
        public DateTime? DateFinTraitement { get; set; }
        public DateTime? DateAnnulation { get; set; }

        public int NombreRappels { get; set; } = 0;

        public ICollection<TicketHistorique> Historique { get; set; } = new List<TicketHistorique>();
    }

    // Trace chaque changement de statut d'un ticket (utile pour les stats/rapports)
    public class TicketHistorique
    {
        public int Id { get; set; }

        public int TicketId { get; set; }
        public Ticket Ticket { get; set; } = null!;

        public TicketStatut AncienStatut { get; set; }
        public TicketStatut NouveauStatut { get; set; }
        public DateTime DateChangement { get; set; } = DateTime.UtcNow;

        public string? AgentId { get; set; }
    }
}
