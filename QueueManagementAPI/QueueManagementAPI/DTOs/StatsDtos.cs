namespace QueueManagementAPI.DTOs
{
    public class DashboardDto
    {
        public int TicketsServisAujourdHui { get; set; }
        public int ClientsEnAttente { get; set; }
        public double TempsMoyenAttenteMinutes { get; set; }
        public double TauxOccupationGuichets { get; set; }
        public int GuichetsActifs { get; set; }
        public int GuichetsEnPause { get; set; }
        public int GuichetsInactifs { get; set; }
        public int TicketsAnnulesAujourdHui { get; set; }
    }

    public class StatistiquePeriodeDto
    {
        public DateTime DateDebut { get; set; }
        public DateTime DateFin { get; set; }
        public int TotalTickets { get; set; }
        public int TicketsTraites { get; set; }
        public int TicketsAnnules { get; set; }
        public double TempsMoyenAttenteMinutes { get; set; }
        public double TempsMoyenTraitementMinutes { get; set; }
        public List<StatServiceDto> ParService { get; set; } = new();
        public List<StatJourDto> ParJour { get; set; } = new();
    }

    public class StatServiceDto
    {
        public string ServiceNom { get; set; } = string.Empty;
        public int NombreTickets { get; set; }
        public double TempsMoyenAttenteMinutes { get; set; }
    }

    public class StatJourDto
    {
        public DateTime Date { get; set; }
        public int NombreTickets { get; set; }
    }
}
