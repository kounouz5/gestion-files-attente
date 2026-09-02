import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StatsApiService } from '../../../core/services/stats-api.service';
import { StatistiquePeriodeModel } from '../../../core/models/stats.model';

type PeriodeType = 'daily' | 'weekly' | 'monthly';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule
  ],
  template: `
    <h1>Statistiques et rapports</h1>

    <div class="barre-outils">
      <mat-button-toggle-group [(ngModel)]="periode" (change)="charger()">
        <mat-button-toggle value="daily">Journalier</mat-button-toggle>
        <mat-button-toggle value="weekly">Hebdomadaire</mat-button-toggle>
        <mat-button-toggle value="monthly">Mensuel</mat-button-toggle>
      </mat-button-toggle-group>
    </div>

    @if (stats()) {
      <div class="grille-kpi">
        <mat-card class="carte-kpi">
          <span class="valeur">{{ stats()!.totalTickets }}</span>
          <span class="libelle">Total tickets</span>
        </mat-card>
        <mat-card class="carte-kpi">
          <span class="valeur">{{ stats()!.ticketsTraites }}</span>
          <span class="libelle">Tickets traités</span>
        </mat-card>
        <mat-card class="carte-kpi">
          <span class="valeur">{{ stats()!.ticketsAnnules }}</span>
          <span class="libelle">Tickets annulés</span>
        </mat-card>
        <mat-card class="carte-kpi">
          <span class="valeur">{{ stats()!.tempsMoyenAttenteMinutes }} min</span>
          <span class="libelle">Attente moyenne</span>
        </mat-card>
        <mat-card class="carte-kpi">
          <span class="valeur">{{ stats()!.tempsMoyenTraitementMinutes }} min</span>
          <span class="libelle">Traitement moyen</span>
        </mat-card>
      </div>

      <h2>Répartition par service</h2>
      <table mat-table [dataSource]="stats()!.parService" class="mat-elevation-z2 full-width">
        <ng-container matColumnDef="service">
          <th mat-header-cell *matHeaderCellDef>Service</th>
          <td mat-cell *matCellDef="let s">{{ s.serviceNom }}</td>
        </ng-container>
        <ng-container matColumnDef="nombre">
          <th mat-header-cell *matHeaderCellDef>Nombre de tickets</th>
          <td mat-cell *matCellDef="let s">{{ s.nombreTickets }}</td>
        </ng-container>
        <ng-container matColumnDef="attente">
          <th mat-header-cell *matHeaderCellDef>Attente moyenne</th>
          <td mat-cell *matCellDef="let s">{{ s.tempsMoyenAttenteMinutes }} min</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="colonnesService"></tr>
        <tr mat-row *matRowDef="let row; columns: colonnesService;"></tr>
      </table>

      <div class="section-export">
        <h2>Exporter un rapport</h2>
        <div class="ligne-dates">
          <mat-form-field appearance="outline">
            <mat-label>Date de début</mat-label>
            <input matInput type="date" [(ngModel)]="dateDebut" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Date de fin</mat-label>
            <input matInput type="date" [(ngModel)]="dateFin" />
          </mat-form-field>
        </div>
        <div class="boutons-export">
          <button mat-raised-button color="primary" (click)="exporter('pdf')">
            <mat-icon>picture_as_pdf</mat-icon> Export PDF
          </button>
          <button mat-raised-button color="accent" (click)="exporter('excel')">
            <mat-icon>grid_on</mat-icon> Export Excel
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .barre-outils { margin: 16px 0; }
    .grille-kpi { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .carte-kpi { display: flex; flex-direction: column; align-items: center; padding: 20px 8px; }
    .valeur { font-size: 28px; font-weight: 800; }
    .libelle { color: #666; margin-top: 4px; text-align: center; }
    .full-width { width: 100%; }
    .section-export { margin-top: 32px; }
    .ligne-dates { display: flex; gap: 16px; }
    .boutons-export { display: flex; gap: 12px; margin-top: 8px; }
  `]
})
export class StatsComponent implements OnInit {
  periode: PeriodeType = 'daily';
  stats = signal<StatistiquePeriodeModel | null>(null);
  colonnesService = ['service', 'nombre', 'attente'];

  dateDebut = new Date().toISOString().substring(0, 10);
  dateFin = new Date().toISOString().substring(0, 10);

  constructor(private statsApi: StatsApiService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    const obs =
      this.periode === 'daily'
        ? this.statsApi.getDaily()
        : this.periode === 'weekly'
        ? this.statsApi.getWeekly()
        : this.statsApi.getMonthly();

    obs.subscribe((s) => this.stats.set(s));
  }

  exporter(type: 'pdf' | 'excel'): void {
    const obs =
      type === 'pdf'
        ? this.statsApi.exportPdf(this.dateDebut, this.dateFin)
        : this.statsApi.exportExcel(this.dateDebut, this.dateFin);

    obs.subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `statistiques_${this.dateDebut}_${this.dateFin}.${type === 'pdf' ? 'pdf' : 'xlsx'}`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Erreur lors de l\'export.', 'OK', { duration: 3000 })
    });
  }
}
