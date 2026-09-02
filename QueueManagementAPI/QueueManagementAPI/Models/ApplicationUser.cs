using Microsoft.AspNetCore.Identity;

namespace QueueManagementAPI.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string Nom { get; set; } = string.Empty;
        public string Prenom { get; set; } = string.Empty;
        public bool EstActif { get; set; } = true;
        public DateTime DateCreation { get; set; } = DateTime.UtcNow;

        // Un agent peut être connecté à un guichet
        public int? GuichetId { get; set; }
        public Guichet? Guichet { get; set; }

        public ICollection<Ticket> TicketsClient { get; set; } = new List<Ticket>();
    }
}
