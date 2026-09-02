import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateServiceRequest,
  ServiceModel,
  UpdateServiceRequest
} from '../models/service.model';

@Injectable({ providedIn: 'root' })
export class ServiceApiService {
  private readonly apiUrl = `${environment.apiUrl}/services`;

  constructor(private http: HttpClient) {}

  getAll(actifsSeulement = false): Observable<ServiceModel[]> {
    return this.http.get<ServiceModel[]>(this.apiUrl, {
      params: { actifsSeulement }
    });
  }

  getById(id: number): Observable<ServiceModel> {
    return this.http.get<ServiceModel>(`${this.apiUrl}/${id}`);
  }

  create(payload: CreateServiceRequest): Observable<ServiceModel> {
    return this.http.post<ServiceModel>(this.apiUrl, payload);
  }

  update(id: number, payload: UpdateServiceRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, payload);
  }

  toggleActivation(id: number): Observable<{ estActif: boolean }> {
    return this.http.patch<{ estActif: boolean }>(`${this.apiUrl}/${id}/toggle`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
