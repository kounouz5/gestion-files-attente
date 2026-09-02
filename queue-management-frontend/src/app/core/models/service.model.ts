export interface ServiceModel {
  id: number;
  nom: string;
  description?: string;
  prefixeTicket: string;
  dureeMoyenneMinutes: number;
  estActif: boolean;
  nombreEnAttente?: number;
}

export interface CreateServiceRequest {
  nom: string;
  description?: string;
  prefixeTicket: string;
  dureeMoyenneMinutes: number;
}

export interface UpdateServiceRequest {
  nom?: string;
  description?: string;
  prefixeTicket?: string;
  dureeMoyenneMinutes?: number;
}

export type GuichetStatut = 'Inactif' | 'Actif' | 'EnPause';

export interface GuichetModel {
  id: number;
  nom: string;
  statut: GuichetStatut;
  estActif: boolean;
  agentId?: string | null;
  agentNomComplet?: string | null;
  services: ServiceModel[];
}

export interface CreateGuichetRequest {
  nom: string;
  serviceIds: number[];
}
