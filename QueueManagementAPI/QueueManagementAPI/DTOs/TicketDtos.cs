using System.ComponentModel.DataAnnotations;

namespace QueueManagementAPI.DTOs
{
    public class CreateTicketDto
    {
        [Required] public int ServiceId { get; set; }
        // Optionnel : si le client est authentifié, son Id est pris du token.
        // Sinon ticket anonyme (impression uniquement).
    }

    public class TicketDto
    {
        public int Id { get; set; }
        public string NumeroTicket { get; set; } = string.Empty;
        public int ServiceId { get; set; }
        public string ServiceNom { get; set; } = string.Empty;
        public int? GuichetId { get; set; }
        public string? GuichetNom { get; set; }
        public string Statut { get; set; } = string.Empty;
        public DateTime DateCreation { get; set; }
        public DateTime? DateAppel { get; set; }
        public DateTime? DateDebutTraitement { get; set; }
        public DateTime? DateFinTraitement { get; set; }
        public int PositionDansFile { get; set; }
        public int TempsAttenteEstimeMinutes { get; set; }
    }

    public class TicketPublicStatusDto
    {
        public string NumeroTicket { get; set; } = string.Empty;
        public string Statut { get; set; } = string.Empty;
        public int PositionDansFile { get; set; }
        public int TempsAttenteEstimeMinutes { get; set; }
        public string? TicketEnCours { get; set; }
        public string? DernierTicketAppele { get; set; }
    }
}
