namespace QueueManagementAPI.Models
{
    public class Guichet
    {
        public int Id { get; set; }
        public string Nom { get; set; } = string.Empty; // ex: "Guichet 1"
        public GuichetStatut Statut { get; set; } = GuichetStatut.Inactif;
        public bool EstActif { get; set; } = true;
        public DateTime DateCreation { get; set; } = DateTime.UtcNow;

        // Agent actuellement connecté au guichet (relation 1-1 optionnelle)
        public string? AgentId { get; set; }
        public ApplicationUser? Agent { get; set; }

        public ICollection<GuichetService> GuichetServices { get; set; } = new List<GuichetService>();
        public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    }

    // Table de jonction Many-to-Many entre Guichet et Service
    public class GuichetService
    {
        public int GuichetId { get; set; }
        public Guichet Guichet { get; set; } = null!;

        public int ServiceId { get; set; }
        public Service Service { get; set; } = null!;
    }
}
