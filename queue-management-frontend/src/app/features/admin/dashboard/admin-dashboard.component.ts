import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { StatsApiService } from '../../../core/services/stats-api.service';
import { SignalrService } from '../../../core/services/signalr.service';
import { DashboardModel } from '../../../core/models/stats.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <h1>Tableau de bord</h1>

    @if (dashboard()) {
      <div class="grille-kpi">
        <mat-card class="carte-kpi">
          <mat-icon class="icone">confirmation_number</mat-icon>
          <span class="valeur">{{ dashboard()!.ticketsServisAujourdHui }}</span>
          <span class="libelle">Tickets servis aujourd'hui</span>
        </mat-card>

        <mat-card class="carte-kpi">
          <mat-icon class="icone">groups</mat-icon>
          <span class="valeur">{{ dashboard()!.clientsEnAttente }}</span>
          <span class="libelle">Clients en attente</span>
        </mat-card>

        <mat-card class="carte-kpi">
          <mat-icon class="icone">schedule</mat-icon>
          <span class="valeur">{{ dashboard()!.tempsMoyenAttenteMinutes }} min</span>
          <span class="libelle">Temps moyen d'attente</span>
        </mat-card>

        <mat-card class="carte-kpi">
          <mat-icon class="icone">pie_chart</mat-icon>
          <span class="valeur">{{ dashboard()!.tauxOccupationGuichets }}%</span>
          <span class="libelle">Taux d'occupation des guichets</span>
        </mat-card>

        <mat-card class="carte-kpi succes">
          <mat-icon class="icone">check_circle</mat-icon>
          <span class="valeur">{{ dashboard()!.guichetsActifs }}</span>
          <span class="libelle">Guichets actifs</span>
        </mat-card>

        <mat-card class="carte-kpi avertissement">
          <mat-icon class="icone">pause_circle</mat-icon>
          <span class="valeur">{{ dashboard()!.guichetsEnPause }}</span>
          <span class="libelle">Guichets en pause</span>
        </mat-card>

        <mat-card class="carte-kpi neutre">
          <mat-icon class="icone">radio_button_unchecked</mat-icon>
          <span class="valeur">{{ dashboard()!.guichetsInactifs }}</span>
          <span class="libelle">Guichets inactifs</span>
        </mat-card>

        <mat-card class="carte-kpi danger">
          <mat-icon class="icone">cancel</mat-icon>
          <span class="valeur">{{ dashboard()!.ticketsAnnulesAujourdHui }}</span>
          <span class="libelle">Tickets annulés aujourd'hui</span>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .grille-kpi { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 16px; }
    .carte-kpi { display: flex; flex-direction: column; align-items: center; padding: 24px 8px; }
    .icone { font-size: 32px; height: 32px; width: 32px; color: #3f51b5; margin-bottom: 8px; }
    .valeur { font-size: 32px; font-weight: 800; }
    .libelle { color: #666; text-align: center; margin-top: 4px; }
    .succes .icone { color: #2e7d32; }
    .avertissement .icone { color: #f9a825; }
    .danger .icone { color: #c62828; }
    .neutre .icone { color: #9e9e9e; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  dashboard = signal<DashboardModel | null>(null);

  constructor(private statsApi: StatsApiService, private signalrService: SignalrService) {}

  ngOnInit(): void {
    this.charger();
    this.signalrService.connecter().then(() => {
      this.signalrService.rejoindreGroupeAdmin();
      this.signalrService.dashboardMisAJour$.subscribe(() => this.charger());
      this.signalrService.guichetStatutChange$.subscribe(() => this.charger());
    });
  }

  private charger(): void {
    this.statsApi.getDashboard().subscribe((d) => this.dashboard.set(d));
  }
}
