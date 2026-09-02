using System.ComponentModel.DataAnnotations;

namespace QueueManagementAPI.DTOs
{
    public class ServiceDto
    {
        public int Id { get; set; }
        public string Nom { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string PrefixeTicket { get; set; } = string.Empty;
        public int DureeMoyenneMinutes { get; set; }
        public bool EstActif { get; set; }
        public int NombreEnAttente { get; set; }
    }

    public class CreateServiceDto
    {
        [Required] public string Nom { get; set; } = string.Empty;
        public string? Description { get; set; }
        [Required, MaxLength(3)] public string PrefixeTicket { get; set; } = "A";
        [Range(1, 240)] public int DureeMoyenneMinutes { get; set; } = 5;
    }

    public class UpdateServiceDto
    {
        public string? Nom { get; set; }
        public string? Description { get; set; }
        public string? PrefixeTicket { get; set; }
        public int? DureeMoyenneMinutes { get; set; }
    }
}
