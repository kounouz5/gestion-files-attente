import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TicketModel, TicketPublicStatus } from '../models/ticket.model';

@Injectable({ providedIn: 'root' })
export class TicketApiService {
  private readonly apiUrl = `${environment.apiUrl}/tickets`;

  constructor(private http: HttpClient) {}

  creerTicket(serviceId: number): Observable<TicketModel> {
    return this.http.post<TicketModel>(this.apiUrl, { serviceId });
  }

  getById(id: number): Observable<TicketModel> {
    return this.http.get<TicketModel>(`${this.apiUrl}/${id}`);
  }

  getStatutPublic(id: number): Observable<TicketPublicStatus> {
    return this.http.get<TicketPublicStatus>(`${this.apiUrl}/${id}/statut`);
  }

  getMesTickets(): Observable<TicketModel[]> {
    return this.http.get<TicketModel[]>(`${this.apiUrl}/mes-tickets`);
  }

  getTicketEnCours(serviceId: number): Observable<TicketModel | null> {
    return this.http.get<TicketModel | null>(`${this.apiUrl}/service/${serviceId}/en-cours`);
  }

  getDernierAppele(serviceId: number): Observable<TicketModel | null> {
    return this.http.get<TicketModel | null>(`${this.apiUrl}/service/${serviceId}/dernier-appele`);
  }

  getFileAttenteService(serviceId: number): Observable<TicketModel[]> {
    return this.http.get<TicketModel[]>(`${this.apiUrl}/service/${serviceId}/file-attente`);
  }
}
