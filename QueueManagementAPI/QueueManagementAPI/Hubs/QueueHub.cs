using Microsoft.AspNetCore.SignalR;

namespace QueueManagementAPI.Hubs
{
    // Hub temps réel : les clients rejoignent un groupe par service pour recevoir
    // les mises à jour (nouveau ticket, ticket appelé, statut guichet, etc.)
    public class QueueHub : Hub
    {
        public async Task JoinServiceGroup(int serviceId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"service-{serviceId}");
        }

        public async Task LeaveServiceGroup(int serviceId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"service-{serviceId}");
        }

        public async Task JoinGuichetGroup(int guichetId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"guichet-{guichetId}");
        }

        public async Task JoinAdminGroup()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "admin-dashboard");
        }
    }

    // Constantes des noms d'évènements envoyés aux clients, pour rester cohérent
    // entre le back-end et le front-end Angular.
    public static class QueueHubEvents
    {
        public const string TicketCree = "TicketCree";
        public const string TicketAppele = "TicketAppele";
        public const string TicketMisAJour = "TicketMisAJour";
        public const string GuichetStatutChange = "GuichetStatutChange";
        public const string FileAttenteMiseAJour = "FileAttenteMiseAJour";
        public const string DashboardMisAJour = "DashboardMisAJour";
    }
}
