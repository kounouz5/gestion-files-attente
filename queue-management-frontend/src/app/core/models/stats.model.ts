export interface DashboardModel {
  ticketsServisAujourdHui: number;
  clientsEnAttente: number;
  tempsMoyenAttenteMinutes: number;
  tauxOccupationGuichets: number;
  guichetsActifs: number;
  guichetsEnPause: number;
  guichetsInactifs: number;
  ticketsAnnulesAujourdHui: number;
}

export interface StatServiceModel {
  serviceNom: string;
  nombreTickets: number;
  tempsMoyenAttenteMinutes: number;
}

export interface StatJourModel {
  date: string;
  nombreTickets: number;
}

export interface StatistiquePeriodeModel {
  dateDebut: string;
  dateFin: string;
  totalTickets: number;
  ticketsTraites: number;
  ticketsAnnules: number;
  tempsMoyenAttenteMinutes: number;
  tempsMoyenTraitementMinutes: number;
  parService: StatServiceModel[];
  parJour: StatJourModel[];
}
