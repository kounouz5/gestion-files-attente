using System.ComponentModel.DataAnnotations;

namespace QueueManagementAPI.DTOs
{
    public class RegisterClientDto
    {
        [Required] public string Nom { get; set; } = string.Empty;
        [Required] public string Prenom { get; set; } = string.Empty;
        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
        [Required, MinLength(6)] public string Password { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
    }

    public class RegisterAgentDto
    {
        [Required] public string Nom { get; set; } = string.Empty;
        [Required] public string Prenom { get; set; } = string.Empty;
        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
        [Required, MinLength(6)] public string Password { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        [Required] public string Role { get; set; } = "Agent"; // Agent ou Admin
    }

    public class LoginDto
    {
        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
        [Required] public string Password { get; set; } = string.Empty;
    }

    public class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public DateTime Expiration { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Nom { get; set; } = string.Empty;
        public string Prenom { get; set; } = string.Empty;
        public IList<string> Roles { get; set; } = new List<string>();
    }

    public class UserDto
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Nom { get; set; } = string.Empty;
        public string Prenom { get; set; } = string.Empty;
        public bool EstActif { get; set; }
        public IList<string> Roles { get; set; } = new List<string>();
        public int? GuichetId { get; set; }
    }

    public class UpdateUserDto
    {
        public string? Nom { get; set; }
        public string? Prenom { get; set; }
        public bool? EstActif { get; set; }
    }

    public class AssignRoleDto
    {
        [Required] public string Role { get; set; } = string.Empty;
    }
}
