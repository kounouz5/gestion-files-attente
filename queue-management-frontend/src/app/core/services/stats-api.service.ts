import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardModel, StatistiquePeriodeModel } from '../models/stats.model';

@Injectable({ providedIn: 'root' })
export class StatsApiService {
  private readonly apiUrl = `${environment.apiUrl}/admin/stats`;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<DashboardModel> {
    return this.http.get<DashboardModel>(`${this.apiUrl}/dashboard`);
  }

  getDaily(date?: string): Observable<StatistiquePeriodeModel> {
    return this.http.get<StatistiquePeriodeModel>(`${this.apiUrl}/daily`, {
      params: date ? { date } : {}
    });
  }

  getWeekly(date?: string): Observable<StatistiquePeriodeModel> {
    return this.http.get<StatistiquePeriodeModel>(`${this.apiUrl}/weekly`, {
      params: date ? { date } : {}
    });
  }

  getMonthly(annee?: number, mois?: number): Observable<StatistiquePeriodeModel> {
    const params: Record<string, number> = {};
    if (annee) params['annee'] = annee;
    if (mois) params['mois'] = mois;
    return this.http.get<StatistiquePeriodeModel>(`${this.apiUrl}/monthly`, { params });
  }

  exportExcel(debut: string, fin: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/excel`, {
      params: { debut, fin },
      responseType: 'blob'
    });
  }

  exportPdf(debut: string, fin: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/pdf`, {
      params: { debut, fin },
      responseType: 'blob'
    });
  }
}
