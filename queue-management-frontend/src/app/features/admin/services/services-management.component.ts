import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ServiceApiService } from '../../../core/services/service-api.service';
import { ServiceModel } from '../../../core/models/service.model';
import { ServiceFormDialogComponent } from './service-form-dialog/service-form-dialog.component';

@Component({
  selector: 'app-services-management',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatDialogModule
  ],
  template: `
    <div class="entete-page">
      <h1>Gestion des services</h1>
      <button mat-raised-button color="primary" (click)="ouvrirFormulaire()">
        <mat-icon>add</mat-icon> Nouveau service
      </button>
    </div>

    <table mat-table [dataSource]="services()" class="mat-elevation-z2 full-width">
      <ng-container matColumnDef="nom">
        <th mat-header-cell *matHeaderCellDef>Nom</th>
        <td mat-cell *matCellDef="let s">{{ s.nom }}</td>
      </ng-container>

      <ng-container matColumnDef="prefixe">
        <th mat-header-cell *matHeaderCellDef>Préfixe</th>
        <td mat-cell *matCellDef="let s">{{ s.prefixeTicket }}</td>
      </ng-container>

      <ng-container matColumnDef="duree">
        <th mat-header-cell *matHeaderCellDef>Durée moyenne</th>
        <td mat-cell *matCellDef="let s">{{ s.dureeMoyenneMinutes }} min</td>
      </ng-container>

      <ng-container matColumnDef="enAttente">
        <th mat-header-cell *matHeaderCellDef>En attente</th>
        <td mat-cell *matCellDef="let s">{{ s.nombreEnAttente ?? 0 }}</td>
      </ng-container>

      <ng-container matColumnDef="actif">
        <th mat-header-cell *matHeaderCellDef>Actif</th>
        <td mat-cell *matCellDef="let s">
          <mat-slide-toggle [checked]="s.estActif" (change)="toggle(s)"></mat-slide-toggle>
        </td>
      </ng-container>

      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>Actions</th>
        <td mat-cell *matCellDef="let s">
          <button mat-icon-button (click)="ouvrirFormulaire(s)"><mat-icon>edit</mat-icon></button>
          <button mat-icon-button color="warn" (click)="supprimer(s)"><mat-icon>delete</mat-icon></button>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="colonnes"></tr>
      <tr mat-row *matRowDef="let row; columns: colonnes;"></tr>
    </table>
  `,
  styles: [`
    .entete-page { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .full-width { width: 100%; }
  `]
})
export class ServicesManagementComponent implements OnInit {
  services = signal<ServiceModel[]>([]);
  colonnes = ['nom', 'prefixe', 'duree', 'enAttente', 'actif', 'actions'];

  constructor(
    private serviceApi: ServiceApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.serviceApi.getAll(false).subscribe((s) => this.services.set(s));
  }

  ouvrirFormulaire(service?: ServiceModel): void {
    const ref = this.dialog.open(ServiceFormDialogComponent, { data: service ?? null });
    ref.afterClosed().subscribe((resultat) => {
      if (!resultat) return;

      if (service) {
        this.serviceApi.update(service.id, resultat).subscribe(() => {
          this.snackBar.open('Service mis à jour.', 'OK', { duration: 2500 });
          this.charger();
        });
      } else {
        this.serviceApi.create(resultat).subscribe(() => {
          this.snackBar.open('Service créé.', 'OK', { duration: 2500 });
          this.charger();
        });
      }
    });
  }

  toggle(service: ServiceModel): void {
    this.serviceApi.toggleActivation(service.id).subscribe(() => this.charger());
  }

  supprimer(service: ServiceModel): void {
    if (!confirm(`Supprimer le service "${service.nom}" ?`)) return;
    this.serviceApi.delete(service.id).subscribe({
      next: () => {
        this.snackBar.open('Service supprimé.', 'OK', { duration: 2500 });
        this.charger();
      },
      error: (err) => this.snackBar.open(err?.error?.message ?? 'Erreur.', 'OK', { duration: 3000 })
    });
  }
}
