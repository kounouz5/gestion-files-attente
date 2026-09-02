namespace QueueManagementAPI.Models
{
    public class Service
    {
        public int Id { get; set; }
        public string Nom { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string PrefixeTicket { get; set; } = "A"; // ex: "A" pour A-001
        public int DureeMoyenneMinutes { get; set; } = 5; // pour estimation du temps d'attente
        public bool EstActif { get; set; } = true;
        public DateTime DateCreation { get; set; } = DateTime.UtcNow;

        public ICollection<GuichetService> GuichetServices { get; set; } = new List<GuichetService>();
        public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    }
}
