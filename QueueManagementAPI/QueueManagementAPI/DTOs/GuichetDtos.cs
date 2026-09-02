using System.ComponentModel.DataAnnotations;
using QueueManagementAPI.Models;

namespace QueueManagementAPI.DTOs
{
    public class GuichetDto
    {
        public int Id { get; set; }
        public string Nom { get; set; } = string.Empty;
        public string Statut { get; set; } = string.Empty;
        public bool EstActif { get; set; }
        public string? AgentId { get; set; }
        public string? AgentNomComplet { get; set; }
        public List<ServiceDto> Services { get; set; } = new();
    }

    public class CreateGuichetDto
    {
        [Required] public string Nom { get; set; } = string.Empty;
        public List<int> ServiceIds { get; set; } = new();
    }

    public class UpdateGuichetDto
    {
        public string? Nom { get; set; }
        public bool? EstActif { get; set; }
    }

    public class AffecterServicesDto
    {
        [Required] public List<int> ServiceIds { get; set; } = new();
    }

    public class ChangerStatutGuichetDto
    {
        [Required] public GuichetStatut Statut { get; set; }
    }
}
