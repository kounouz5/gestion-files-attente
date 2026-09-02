export type TicketStatut =
  | 'EnAttente'
  | 'Appele'
  | 'EnCours'
  | 'Traite'
  | 'Annule'
  | 'Rappele'
  | 'EnAttenteGuichet';

export interface TicketModel {
  id: number;
  numeroTicket: string;
  serviceId: number;
  serviceNom: string;
  guichetId?: number | null;
  guichetNom?: string | null;
  statut: TicketStatut;
  dateCreation: string;
  dateAppel?: string | null;
  dateDebutTraitement?: string | null;
  dateFinTraitement?: string | null;
  positionDansFile: number;
  tempsAttenteEstimeMinutes: number;
}

export interface TicketPublicStatus {
  numeroTicket: string;
  statut: TicketStatut;
  positionDansFile: number;
  tempsAttenteEstimeMinutes: number;
  ticketEnCours?: string | null;
  dernierTicketAppele?: string | null;
}
