using Microsoft.AspNetCore.Identity;
using QueueManagementAPI.Models;

namespace QueueManagementAPI.Data
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(IServiceProvider services)
        {
            var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
            var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
            var context = services.GetRequiredService<ApplicationDbContext>();

            // 1. Créer les rôles s'ils n'existent pas
            string[] roles = { Roles.Admin, Roles.Agent, Roles.Client };
            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new IdentityRole(role));
                }
            }

            // 2. Créer un compte Admin par défaut
            const string adminEmail = "admin@queuemanagement.tn";
            if (await userManager.FindByEmailAsync(adminEmail) is null)
            {
                var admin = new ApplicationUser
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    Nom = "Admin",
                    Prenom = "Système",
                    EmailConfirmed = true,
                    EstActif = true
                };

                var result = await userManager.CreateAsync(admin, "Admin@123");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(admin, Roles.Admin);
                }
            }

            // 3. Créer quelques services de démonstration si aucun n'existe
            if (!context.Services.Any())
            {
                context.Services.AddRange(
                    new Service { Nom = "Dépôt / Retrait", PrefixeTicket = "D", DureeMoyenneMinutes = 5 },
                    new Service { Nom = "Ouverture de compte", PrefixeTicket = "C", DureeMoyenneMinutes = 15 },
                    new Service { Nom = "Réclamations", PrefixeTicket = "R", DureeMoyenneMinutes = 10 }
                );
                await context.SaveChangesAsync();
            }
        }
    }
}
