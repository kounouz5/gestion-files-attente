import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateGuichetRequest, GuichetModel, GuichetStatut } from '../models/service.model';
import { TicketModel } from '../models/ticket.model';

@Injectable({ providedIn: 'root' })
export class GuichetApiService {
  private readonly apiUrl = `${environment.apiUrl}/guichets`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<GuichetModel[]> {
    return this.http.get<GuichetModel[]>(this.apiUrl);
  }

  getById(id: number): Observable<GuichetModel> {
    return this.http.get<GuichetModel>(`${this.apiUrl}/${id}`);
  }

  getFileAttente(id: number): Observable<TicketModel[]> {
    return this.http.get<TicketModel[]>(`${this.apiUrl}/${id}/file-attente`);
  }

  create(payload: CreateGuichetRequest): Observable<GuichetModel> {
    return this.http.post<GuichetModel>(this.apiUrl, payload);
  }

  update(id: number, payload: { nom?: string; estActif?: boolean }): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, payload);
  }

  affecterServices(id: number, serviceIds: number[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/services`, { serviceIds });
  }

  toggleActivation(id: number): Observable<{ estActif: boolean; statut: string }> {
    return this.http.patch<{ estActif: boolean; statut: string }>(`${this.apiUrl}/${id}/toggle`, {});
  }

  changerStatut(id: number, statut: GuichetStatut): Observable<{ statut: string }> {
    const statutMap: Record<GuichetStatut, number> = { Inactif: 0, Actif: 1, EnPause: 2 };
    return this.http.patch<{ statut: string }>(`${this.apiUrl}/${id}/statut`, {
      statut: statutMap[statut]
    });
  }

  connect(id: number): Observable<{ message: string; guichetId: number }> {
    return this.http.post<{ message: string; guichetId: number }>(`${this.apiUrl}/${id}/connect`, {});
  }

  disconnect(id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/${id}/disconnect`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
