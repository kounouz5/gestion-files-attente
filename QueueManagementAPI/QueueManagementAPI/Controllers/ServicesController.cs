using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using QueueManagementAPI.Data;
using QueueManagementAPI.DTOs;
using QueueManagementAPI.Hubs;
using QueueManagementAPI.Models;

namespace QueueManagementAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ServicesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<QueueHub> _hub;

        public ServicesController(ApplicationDbContext context, IHubContext<QueueHub> hub)
        {
            _context = context;
            _hub = hub;
        }

        // Accessible à tous (le client doit voir la liste des services pour prendre un ticket)
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<List<ServiceDto>>> GetAll([FromQuery] bool actifsSeulement = true)
        {
            var query = _context.Services.AsQueryable();
            if (actifsSeulement) query = query.Where(s => s.EstActif);

            var services = await query
                .Select(s => new ServiceDto
                {
                    Id = s.Id,
                    Nom = s.Nom,
                    Description = s.Description,
                    PrefixeTicket = s.PrefixeTicket,
                    DureeMoyenneMinutes = s.DureeMoyenneMinutes,
                    EstActif = s.EstActif,
                    NombreEnAttente = s.Tickets.Count(t => t.Statut == TicketStatut.EnAttente)
                })
                .ToListAsync();

            return Ok(services);
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<ServiceDto>> GetById(int id)
        {
            var service = await _context.Services.FindAsync(id);
            if (service is null) return NotFound();

            var enAttente = await _context.Tickets
                .CountAsync(t => t.ServiceId == id && t.Statut == TicketStatut.EnAttente);

            return Ok(new ServiceDto
            {
                Id = service.Id,
                Nom = service.Nom,
                Description = service.Description,
                PrefixeTicket = service.PrefixeTicket,
                DureeMoyenneMinutes = service.DureeMoyenneMinutes,
                EstActif = service.EstActif,
                NombreEnAttente = enAttente
            });
        }

        [HttpPost]
        [Authorize(Roles = Roles.Admin)]
        public async Task<ActionResult<ServiceDto>> Create(CreateServiceDto dto)
        {
            var service = new Service
            {
                Nom = dto.Nom,
                Description = dto.Description,
                PrefixeTicket = dto.PrefixeTicket.ToUpper(),
                DureeMoyenneMinutes = dto.DureeMoyenneMinutes,
                EstActif = true
            };

            _context.Services.Add(service);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = service.Id }, new ServiceDto
            {
                Id = service.Id,
                Nom = service.Nom,
                Description = service.Description,
                PrefixeTicket = service.PrefixeTicket,
                DureeMoyenneMinutes = service.DureeMoyenneMinutes,
                EstActif = service.EstActif
            });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> Update(int id, UpdateServiceDto dto)
        {
            var service = await _context.Services.FindAsync(id);
            if (service is null) return NotFound();

            if (dto.Nom is not null) service.Nom = dto.Nom;
            if (dto.Description is not null) service.Description = dto.Description;
            if (dto.PrefixeTicket is not null) service.PrefixeTicket = dto.PrefixeTicket.ToUpper();
            if (dto.DureeMoyenneMinutes.HasValue) service.DureeMoyenneMinutes = dto.DureeMoyenneMinutes.Value;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPatch("{id}/toggle")]
        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> ToggleActivation(int id)
        {
            var service = await _context.Services.FindAsync(id);
            if (service is null) return NotFound();

            service.EstActif = !service.EstActif;
            await _context.SaveChangesAsync();

            return Ok(new { estActif = service.EstActif });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> Delete(int id)
        {
            var service = await _context.Services.FindAsync(id);
            if (service is null) return NotFound();

            var aDesTickets = await _context.Tickets.AnyAsync(t => t.ServiceId == id);
            if (aDesTickets)
                return BadRequest(new { message = "Impossible de supprimer un service ayant des tickets associés. Désactivez-le plutôt." });

            _context.Services.Remove(service);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
