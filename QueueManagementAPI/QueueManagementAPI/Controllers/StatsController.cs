using ClosedXML.Excel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QueueManagementAPI.Data;
using QueueManagementAPI.DTOs;
using QueueManagementAPI.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace QueueManagementAPI.Controllers
{
    [ApiController]
    [Route("api/admin/stats")]
    [Authorize(Roles = Roles.Admin)]
    public class StatsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public StatsController(ApplicationDbContext context)
        {
            _context = context;
            QuestPDF.Settings.License = LicenseType.Community;
        }

        // Tableau de bord temps réel
        [HttpGet("dashboard")]
        public async Task<ActionResult<DashboardDto>> GetDashboard()
        {
            var aujourdHui = DateTime.UtcNow.Date;
            var demain = aujourdHui.AddDays(1);

            var ticketsServis = await _context.Tickets.CountAsync(t =>
                t.Statut == TicketStatut.Traite && t.DateFinTraitement >= aujourdHui && t.DateFinTraitement < demain);

            var clientsEnAttente = await _context.Tickets.CountAsync(t => t.Statut == TicketStatut.EnAttente);

            var ticketsAnnules = await _context.Tickets.CountAsync(t =>
                t.Statut == TicketStatut.Annule && t.DateAnnulation >= aujourdHui && t.DateAnnulation < demain);

            var tempsAttenteTickets = await _context.Tickets
                .Where(t => t.DateAppel != null && t.DateCreation >= aujourdHui && t.DateCreation < demain)
                .Select(t => new { t.DateCreation, t.DateAppel })
                .ToListAsync();

            var tempsMoyenAttente = tempsAttenteTickets.Any()
                ? tempsAttenteTickets.Average(t => (t.DateAppel!.Value - t.DateCreation).TotalMinutes)
                : 0;

            var guichetsActifs = await _context.Guichets.CountAsync(g => g.Statut == GuichetStatut.Actif);
            var guichetsEnPause = await _context.Guichets.CountAsync(g => g.Statut == GuichetStatut.EnPause);
            var guichetsInactifs = await _context.Guichets.CountAsync(g => g.Statut == GuichetStatut.Inactif);
            var totalGuichets = guichetsActifs + guichetsEnPause + guichetsInactifs;

            var tauxOccupation = totalGuichets > 0
                ? Math.Round((double)guichetsActifs / totalGuichets * 100, 1)
                : 0;

            return Ok(new DashboardDto
            {
                TicketsServisAujourdHui = ticketsServis,
                ClientsEnAttente = clientsEnAttente,
                TempsMoyenAttenteMinutes = Math.Round(tempsMoyenAttente, 1),
                TauxOccupationGuichets = tauxOccupation,
                GuichetsActifs = guichetsActifs,
                GuichetsEnPause = guichetsEnPause,
                GuichetsInactifs = guichetsInactifs,
                TicketsAnnulesAujourdHui = ticketsAnnules
            });
        }

        [HttpGet("daily")]
        public async Task<ActionResult<StatistiquePeriodeDto>> GetStatsJournalieres([FromQuery] DateTime? date = null)
        {
            var jour = (date ?? DateTime.UtcNow).Date;
            return Ok(await ConstruireStatistiquePeriode(jour, jour.AddDays(1)));
        }

        [HttpGet("weekly")]
        public async Task<ActionResult<StatistiquePeriodeDto>> GetStatsHebdomadaires([FromQuery] DateTime? date = null)
        {
            var reference = (date ?? DateTime.UtcNow).Date;
            var debutSemaine = reference.AddDays(-(int)reference.DayOfWeek + (reference.DayOfWeek == DayOfWeek.Sunday ? -6 : 1));
            return Ok(await ConstruireStatistiquePeriode(debutSemaine, debutSemaine.AddDays(7)));
        }

        [HttpGet("monthly")]
        public async Task<ActionResult<StatistiquePeriodeDto>> GetStatsMensuelles([FromQuery] int? annee = null, [FromQuery] int? mois = null)
        {
            var now = DateTime.UtcNow;
            var debutMois = new DateTime(annee ?? now.Year, mois ?? now.Month, 1);
            return Ok(await ConstruireStatistiquePeriode(debutMois, debutMois.AddMonths(1)));
        }

        // Export Excel des statistiques d'une période
        [HttpGet("export/excel")]
        public async Task<IActionResult> ExportExcel([FromQuery] DateTime debut, [FromQuery] DateTime fin)
        {
            var stats = await ConstruireStatistiquePeriode(debut, fin.AddDays(1));

            using var workbook = new XLWorkbook();
            var ws = workbook.Worksheets.Add("Statistiques");

            ws.Cell(1, 1).Value = "Rapport de statistiques";
            ws.Cell(2, 1).Value = $"Période : {debut:dd/MM/yyyy} - {fin:dd/MM/yyyy}";

            ws.Cell(4, 1).Value = "Total tickets";
            ws.Cell(4, 2).Value = stats.TotalTickets;
            ws.Cell(5, 1).Value = "Tickets traités";
            ws.Cell(5, 2).Value = stats.TicketsTraites;
            ws.Cell(6, 1).Value = "Tickets annulés";
            ws.Cell(6, 2).Value = stats.TicketsAnnules;
            ws.Cell(7, 1).Value = "Temps moyen d'attente (min)";
            ws.Cell(7, 2).Value = stats.TempsMoyenAttenteMinutes;
            ws.Cell(8, 1).Value = "Temps moyen de traitement (min)";
            ws.Cell(8, 2).Value = stats.TempsMoyenTraitementMinutes;

            ws.Cell(10, 1).Value = "Service";
            ws.Cell(10, 2).Value = "Nombre de tickets";
            ws.Cell(10, 3).Value = "Temps moyen d'attente (min)";
            var row = 11;
            foreach (var s in stats.ParService)
            {
                ws.Cell(row, 1).Value = s.ServiceNom;
                ws.Cell(row, 2).Value = s.NombreTickets;
                ws.Cell(row, 3).Value = s.TempsMoyenAttenteMinutes;
                row++;
            }

            ws.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            var fileName = $"statistiques_{debut:yyyyMMdd}_{fin:yyyyMMdd}.xlsx";

            return File(stream.ToArray(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }

        // Export PDF des statistiques d'une période
        [HttpGet("export/pdf")]
        public async Task<IActionResult> ExportPdf([FromQuery] DateTime debut, [FromQuery] DateTime fin)
        {
            var stats = await ConstruireStatistiquePeriode(debut, fin.AddDays(1));

            var document = QuestPDF.Fluent.Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(30);
                    page.DefaultTextStyle(x => x.FontSize(11));

                    page.Header().Text("Rapport de statistiques - Gestion des files d'attente")
                        .FontSize(16).Bold();

                    page.Content().Column(col =>
                    {
                        col.Item().Text($"Période : {debut:dd/MM/yyyy} au {fin:dd/MM/yyyy}").Italic();
                        col.Item().PaddingTop(10).Text($"Total tickets : {stats.TotalTickets}");
                        col.Item().Text($"Tickets traités : {stats.TicketsTraites}");
                        col.Item().Text($"Tickets annulés : {stats.TicketsAnnules}");
                        col.Item().Text($"Temps moyen d'attente : {stats.TempsMoyenAttenteMinutes} min");
                        col.Item().Text($"Temps moyen de traitement : {stats.TempsMoyenTraitementMinutes} min");

                        col.Item().PaddingTop(15).Text("Statistiques par service").Bold();
                        foreach (var s in stats.ParService)
                        {
                            col.Item().Text($"- {s.ServiceNom} : {s.NombreTickets} tickets, {s.TempsMoyenAttenteMinutes} min d'attente moyenne");
                        }
                    });

                    page.Footer().AlignCenter().Text(x =>
                    {
                        x.Span("Généré le ");
                        x.Span(DateTime.Now.ToString("dd/MM/yyyy HH:mm"));
                    });
                });
            });

            var pdfBytes = document.GeneratePdf();
            var fileName = $"statistiques_{debut:yyyyMMdd}_{fin:yyyyMMdd}.pdf";
            return File(pdfBytes, "application/pdf", fileName);
        }

        private async Task<StatistiquePeriodeDto> ConstruireStatistiquePeriode(DateTime debut, DateTime fin)
        {
            var ticketsPeriode = await _context.Tickets
                .Include(t => t.Service)
                .Where(t => t.DateCreation >= debut && t.DateCreation < fin)
                .ToListAsync();

            var traites = ticketsPeriode.Where(t => t.Statut == TicketStatut.Traite).ToList();
            var annules = ticketsPeriode.Count(t => t.Statut == TicketStatut.Annule);

            var attentesValides = ticketsPeriode.Where(t => t.DateAppel != null).ToList();
            var tempsMoyenAttente = attentesValides.Any()
                ? attentesValides.Average(t => (t.DateAppel!.Value - t.DateCreation).TotalMinutes)
                : 0;

            var traitesAvecDurees = traites.Where(t => t.DateDebutTraitement != null && t.DateFinTraitement != null).ToList();
            var tempsMoyenTraitement = traitesAvecDurees.Any()
                ? traitesAvecDurees.Average(t => (t.DateFinTraitement!.Value - t.DateDebutTraitement!.Value).TotalMinutes)
                : 0;

            var parService = ticketsPeriode
                .GroupBy(t => t.Service.Nom)
                .Select(g => new StatServiceDto
                {
                    ServiceNom = g.Key,
                    NombreTickets = g.Count(),
                    TempsMoyenAttenteMinutes = Math.Round(
                        g.Where(t => t.DateAppel != null).Any()
                            ? g.Where(t => t.DateAppel != null).Average(t => (t.DateAppel!.Value - t.DateCreation).TotalMinutes)
                            : 0, 1)
                })
                .ToList();

            var parJour = ticketsPeriode
                .GroupBy(t => t.DateCreation.Date)
                .Select(g => new StatJourDto { Date = g.Key, NombreTickets = g.Count() })
                .OrderBy(s => s.Date)
                .ToList();

            return new StatistiquePeriodeDto
            {
                DateDebut = debut,
                DateFin = fin,
                TotalTickets = ticketsPeriode.Count,
                TicketsTraites = traites.Count,
                TicketsAnnules = annules,
                TempsMoyenAttenteMinutes = Math.Round(tempsMoyenAttente, 1),
                TempsMoyenTraitementMinutes = Math.Round(tempsMoyenTraitement, 1),
                ParService = parService,
                ParJour = parJour
            };
        }
    }
}
