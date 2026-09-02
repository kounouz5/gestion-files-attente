namespace QueueManagementAPI.Models
{
    public enum GuichetStatut
    {
        Inactif = 0,
        Actif = 1,
        EnPause = 2
    }

    public enum TicketStatut
    {
        EnAttente = 0,
        Appele = 1,
        EnCours = 2,
        Traite = 3,
        Annule = 4,
        Rappele = 5,
        EnAttenteGuichet = 6 // mise en attente par l'agent (hold)
    }

    public static class Roles
    {
        public const string Admin = "Admin";
        public const string Agent = "Agent";
        public const string Client = "Client";
    }
}
