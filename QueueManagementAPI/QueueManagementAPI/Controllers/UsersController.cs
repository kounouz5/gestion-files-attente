using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using QueueManagementAPI.DTOs;
using QueueManagementAPI.Models;

namespace QueueManagementAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = Roles.Admin)]
    public class UsersController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;

        public UsersController(UserManager<ApplicationUser> userManager)
        {
            _userManager = userManager;
        }

        [HttpGet]
        public async Task<ActionResult<List<UserDto>>> GetAll([FromQuery] string? role = null)
        {
            var users = role is null
                ? _userManager.Users.ToList()
                : (await _userManager.GetUsersInRoleAsync(role)).ToList();

            var result = new List<UserDto>();
            foreach (var u in users)
            {
                var roles = await _userManager.GetRolesAsync(u);
                result.Add(new UserDto
                {
                    Id = u.Id,
                    Email = u.Email!,
                    Nom = u.Nom,
                    Prenom = u.Prenom,
                    EstActif = u.EstActif,
                    Roles = roles,
                    GuichetId = u.GuichetId
                });
            }

            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<UserDto>> GetById(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
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

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, UpdateUserDto dto)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user is null) return NotFound();

            if (dto.Nom is not null) user.Nom = dto.Nom;
            if (dto.Prenom is not null) user.Prenom = dto.Prenom;
            if (dto.EstActif.HasValue) user.EstActif = dto.EstActif.Value;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

            return NoContent();
        }

        [HttpPost("{id}/roles")]
        public async Task<IActionResult> AssignRole(string id, AssignRoleDto dto)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user is null) return NotFound();

            if (dto.Role != Roles.Admin && dto.Role != Roles.Agent && dto.Role != Roles.Client)
                return BadRequest(new { message = "Rôle invalide." });

            var currentRoles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, currentRoles);
            await _userManager.AddToRoleAsync(user, dto.Role);

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user is null) return NotFound();

            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
                return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

            return NoContent();
        }
    }
}
