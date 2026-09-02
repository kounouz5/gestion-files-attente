import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TicketModel } from '../models/ticket.model';

@Injectable({ providedIn: 'root' })
export class AgentApiService {
  private readonly apiUrl = `${environment.apiUrl}/agent`;

  constructor(private http: HttpClient) {}

  appelerProchain(guichetId: number): Observable<TicketModel | { message: string }> {
    return this.http.post<TicketModel | { message: string }>(
      `${this.apiUrl}/guichets/${guichetId}/next`,
      {}
    );
  }

  rappeler(ticketId: number): Observable<TicketModel> {
    return this.http.post<TicketModel>(`${this.apiUrl}/tickets/${ticketId}/recall`, {});
  }

  mettreEnAttente(ticketId: number): Observable<TicketModel> {
    return this.http.post<TicketModel>(`${this.apiUrl}/tickets/${ticketId}/hold`, {});
  }

  remettreEnFile(ticketId: number): Observable<TicketModel> {
    return this.http.post<TicketModel>(`${this.apiUrl}/tickets/${ticketId}/requeue`, {});
  }

  annuler(ticketId: number): Observable<TicketModel> {
    return this.http.post<TicketModel>(`${this.apiUrl}/tickets/${ticketId}/cancel`, {});
  }

  demarrerTraitement(ticketId: number): Observable<TicketModel> {
    return this.http.post<TicketModel>(`${this.apiUrl}/tickets/${ticketId}/start`, {});
  }

  cloturer(ticketId: number): Observable<TicketModel> {
    return this.http.post<TicketModel>(`${this.apiUrl}/tickets/${ticketId}/close`, {});
  }

  pauseGuichet(guichetId: number): Observable<{ statut: string }> {
    return this.http.patch<{ statut: string }>(`${this.apiUrl}/guichets/${guichetId}/pause`, {});
  }

  resumeGuichet(guichetId: number): Observable<{ statut: string }> {
    return this.http.patch<{ statut: string }>(`${this.apiUrl}/guichets/${guichetId}/resume`, {});
  }

  fileAttente(guichetId: number): Observable<TicketModel[]> {
    return this.http.get<TicketModel[]>(`${this.apiUrl}/guichets/${guichetId}/file-attente`);
  }
}
