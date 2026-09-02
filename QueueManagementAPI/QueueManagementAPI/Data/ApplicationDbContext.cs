using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using QueueManagementAPI.Models;

namespace QueueManagementAPI.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<Service> Services { get; set; } = null!;
        public DbSet<Guichet> Guichets { get; set; } = null!;
        public DbSet<GuichetService> GuichetServices { get; set; } = null!;
        public DbSet<Ticket> Tickets { get; set; } = null!;
        public DbSet<TicketHistorique> TicketHistoriques { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Clé composite pour la table de jonction Guichet <-> Service
            builder.Entity<GuichetService>()
                .HasKey(gs => new { gs.GuichetId, gs.ServiceId });

            builder.Entity<GuichetService>()
                .HasOne(gs => gs.Guichet)
                .WithMany(g => g.GuichetServices)
                .HasForeignKey(gs => gs.GuichetId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<GuichetService>()
                .HasOne(gs => gs.Service)
                .WithMany(s => s.GuichetServices)
                .HasForeignKey(gs => gs.ServiceId)
                .OnDelete(DeleteBehavior.Cascade);

            // Relation Guichet <-> Agent (1-1 optionnelle)
            builder.Entity<ApplicationUser>()
                .HasOne(u => u.Guichet)
                .WithOne(g => g.Agent)
                .HasForeignKey<ApplicationUser>(u => u.GuichetId)
                .OnDelete(DeleteBehavior.SetNull);

            // Relation Ticket -> Service (obligatoire)
            builder.Entity<Ticket>()
                .HasOne(t => t.Service)
                .WithMany(s => s.Tickets)
                .HasForeignKey(t => t.ServiceId)
                .OnDelete(DeleteBehavior.Restrict);

            // Relation Ticket -> Guichet (optionnelle)
            builder.Entity<Ticket>()
                .HasOne(t => t.Guichet)
                .WithMany(g => g.Tickets)
                .HasForeignKey(t => t.GuichetId)
                .OnDelete(DeleteBehavior.SetNull);

            // Relation Ticket -> ClientUser (optionnelle, client anonyme possible)
            builder.Entity<Ticket>()
                .HasOne(t => t.ClientUser)
                .WithMany(u => u.TicketsClient)
                .HasForeignKey(t => t.ClientUserId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.Entity<Ticket>()
                .HasIndex(t => t.NumeroTicket);

            builder.Entity<Ticket>()
                .HasIndex(t => t.Statut);

            builder.Entity<TicketHistorique>()
                .HasOne(h => h.Ticket)
                .WithMany(t => t.Historique)
                .HasForeignKey(h => h.TicketId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
