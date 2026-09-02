import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GuichetApiService } from '../../../core/services/guichet-api.service';
import { ServiceApiService } from '../../../core/services/service-api.service';
import { GuichetModel } from '../../../core/models/service.model';
import { GuichetFormDialogComponent } from './guichet-form-dialog/guichet-form-dialog.component';

@Component({
  selector: 'app-guichets-management',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatDialogModule
  ],
  template: `
    <div class="entete-page">
      <h1>Gestion des guichets</h1>
      <button mat-raised-button color="primary" (click)="ouvrirFormulaire()">
        <mat-icon>add</mat-icon> Nouveau guichet
      </button>
    </div>

    <table mat-table [dataSource]="guichets()" class="mat-elevation-z2 full-width">
      <ng-container matColumnDef="nom">
        <th mat-header-cell *matHeaderCellDef>Nom</th>
        <td mat-cell *matCellDef="let g">{{ g.nom }}</td>
      </ng-container>

      <ng-container matColumnDef="services">
        <th mat-header-cell *matHeaderCellDef>Services affectés</th>
        <td mat-cell *matCellDef="let g">{{ nomsServices(g) }}</td>
      </ng-container>

      <ng-container matColumnDef="agent">
        <th mat-header-cell *matHeaderCellDef>Agent connecté</th>
        <td mat-cell *matCellDef="let g">{{ g.agentNomComplet ?? '—' }}</td>
      </ng-container>

      <ng-container matColumnDef="statut">
        <th mat-header-cell *matHeaderCellDef>Statut</th>
        <td mat-cell *matCellDef="let g">
          <mat-chip [class]="'chip-' + g.statut">{{ g.statut }}</mat-chip>
        </td>
      </ng-container>

      <ng-container matColumnDef="actif">
        <th mat-header-cell *matHeaderCellDef>Actif</th>
        <td mat-cell *matCellDef="let g">
          <mat-slide-toggle [checked]="g.estActif" (change)="toggle(g)"></mat-slide-toggle>
        </td>
      </ng-container>

      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>Actions</th>
        <td mat-cell *matCellDef="let g">
          <button mat-icon-button (click)="ouvrirFormulaire(g)"><mat-icon>edit</mat-icon></button>
          <button mat-icon-button color="warn" (click)="supprimer(g)"><mat-icon>delete</mat-icon></button>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="colonnes"></tr>
      <tr mat-row *matRowDef="let row; columns: colonnes;"></tr>
    </table>
  `,
  styles: [`
    .entete-page { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .full-width { width: 100%; }
    .chip-Actif { background: #d4edda; }
    .chip-EnPause { background: #fff3cd; }
    .chip-Inactif { background: #f1f1f1; }
  `]
})
export class GuichetsManagementComponent implements OnInit {
  guichets = signal<GuichetModel[]>([]);
  colonnes = ['nom', 'services', 'agent', 'statut', 'actif', 'actions'];
  private servicesDisponibles: any[] = [];

  constructor(
    private guichetApi: GuichetApiService,
    private serviceApi: ServiceApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.serviceApi.getAll(false).subscribe((services) => (this.servicesDisponibles = services));
    this.charger();
  }

  charger(): void {
    this.guichetApi.getAll().subscribe((g) => this.guichets.set(g));
  }

  nomsServices(g: GuichetModel): string {
    return g.services.map((s) => s.nom).join(', ') || '—';
  }

  ouvrirFormulaire(guichet?: GuichetModel): void {
    const ref = this.dialog.open(GuichetFormDialogComponent, {
      data: { guichet: guichet ?? null, servicesDisponibles: this.servicesDisponibles }
    });

    ref.afterClosed().subscribe((resultat) => {
      if (!resultat) return;

      if (guichet) {
        this.guichetApi.update(guichet.id, { nom: resultat.nom }).subscribe(() => {
          this.guichetApi.affecterServices(guichet.id, resultat.serviceIds).subscribe(() => {
            this.snackBar.open('Guichet mis à jour.', 'OK', { duration: 2500 });
            this.charger();
          });
        });
      } else {
        this.guichetApi.create({ nom: resultat.nom, serviceIds: resultat.serviceIds }).subscribe(() => {
          this.snackBar.open('Guichet créé.', 'OK', { duration: 2500 });
          this.charger();
        });
      }
    });
  }

  toggle(guichet: GuichetModel): void {
    this.guichetApi.toggleActivation(guichet.id).subscribe(() => this.charger());
  }

  supprimer(guichet: GuichetModel): void {
    if (!confirm(`Supprimer le guichet "${guichet.nom}" ?`)) return;
    this.guichetApi.delete(guichet.id).subscribe({
      next: () => {
        this.snackBar.open('Guichet supprimé.', 'OK', { duration: 2500 });
        this.charger();
      },
      error: (err) => this.snackBar.open(err?.error?.message ?? 'Erreur.', 'OK', { duration: 3000 })
    });
  }
}
