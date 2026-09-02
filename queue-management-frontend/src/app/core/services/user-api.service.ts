import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppUser, RegisterAgentRequest } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getAll(role?: string): Observable<AppUser[]> {
    return this.http.get<AppUser[]>(this.apiUrl, { params: role ? { role } : {} });
  }

  getById(id: string): Observable<AppUser> {
    return this.http.get<AppUser>(`${this.apiUrl}/${id}`);
  }

  creerAgent(payload: RegisterAgentRequest): Observable<AppUser> {
    return this.http.post<AppUser>(`${environment.apiUrl}/auth/register-agent`, payload);
  }

  update(id: string, payload: { nom?: string; prenom?: string; estActif?: boolean }): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, payload);
  }

  assignerRole(id: string, role: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/roles`, { role });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
