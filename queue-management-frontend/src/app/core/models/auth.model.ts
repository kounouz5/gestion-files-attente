export interface AuthResponse {
  token: string;
  expiration: string;
  userId: string;
  email: string;
  nom: string;
  prenom: string;
  roles: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterClientRequest {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface RegisterAgentRequest {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  phoneNumber?: string;
  role: 'Agent' | 'Admin';
}

export interface AppUser {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  estActif: boolean;
  roles: string[];
  guichetId?: number | null;
}

export type Role = 'Admin' | 'Agent' | 'Client';
