using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using QueueManagementAPI.DTOs;
using QueueManagementAPI.Models;
using QueueManagementAPI.Services;

namespace QueueManagementAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ITokenService _tokenService;

        public AuthController(UserManager<ApplicationUser> userManager, ITokenService tokenService)
        {
            _userManager = userManager;
            _tokenService = tokenService;
        }

        // Inscription publique : réservée aux clients qui veulent suivre leurs tickets
        [HttpPost("register")]
        public async Task<ActionResult<AuthResponseDto>> RegisterClient(RegisterClientDto dto)
        {
            if (await _userManager.FindByEmailAsync(dto.Email) is not null)
                return Conflict(new { message = "Un compte existe déjà avec cet email." });

            var user = new ApplicationUser
            {
                UserName = dto.Email,
                Email = dto.Email,
                Nom = dto.Nom,
                Prenom = dto.Prenom,
                PhoneNumber = dto.PhoneNumber,
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
                return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

            await _userManager.AddToRoleAsync(user, Roles.Client);

            return await BuildAuthResponse(user);
        }

        // Création de comptes Agent/Admin : réservée aux administrateurs
        [HttpPost("register-agent")]
        [Authorize(Roles = Roles.Admin)]
        public async Task<ActionResult<UserDto>> RegisterAgent(RegisterAgentDto dto)
        {
            if (dto.Role != Roles.Agent && dto.Role != Roles.Admin)
                return BadRequest(new { message = "Le rôle doit être 'Agent' ou 'Admin'." });

            if (await _userManager.FindByEmailAsync(dto.Email) is not null)
                return Conflict(new { message = "Un compte existe déjà avec cet email." });

            var user = new ApplicationUser
            {
                UserName = dto.Email,
                Email = dto.Email,
                Nom = dto.Nom,
                Prenom = dto.Prenom,
                PhoneNumber = dto.PhoneNumber,
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
                return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

            await _userManager.AddToRoleAsync(user, dto.Role);

            return Ok(new UserDto
            {
                Id = user.Id,
                Email = user.Email!,
                Nom = user.Nom,
                Prenom = user.Prenom,
                EstActif = user.EstActif,
                Roles = new List<string> { dto.Role }
            });
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login(LoginDto dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user is null || !await _userManager.CheckPasswordAsync(user, dto.Password))
                return Unauthorized(new { message = "Email ou mot de passe incorrect." });

            if (!user.EstActif)
                return Unauthorized(new { message = "Ce compte est désactivé." });

            return await BuildAuthResponse(user);
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<UserDto>> Me()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var user = await _userManager.FindByIdAsync(userId!);
            if (user is null) return NotFound();

            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new UserDto
            {
                Id = user.Id,
                Email = user.Email!,
                Nom = user.Nom,
                Prenom = user.Prenom,
                EstActif = user.EstActif,
                Roles = roles,
                GuichetId = user.GuichetId
            });
        }

        private async Task<AuthResponseDto> BuildAuthResponse(ApplicationUser user)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var (token, expiration) = _tokenService.GenerateToken(user, roles);

            return new AuthResponseDto
            {
                Token = token,
                Expiration = expiration,
                UserId = user.Id,
                Email = user.Email!,
                Nom = user.Nom,
                Prenom = user.Prenom,
                Roles = roles
            };
        }
    }
}
