import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserApiService } from '../../../core/services/user-api.service';
import { AppUser } from '../../../core/models/auth.model';
import { AgentFormDialogComponent } from './agent-form-dialog/agent-form-dialog.component';

@Component({
  selector: 'app-users-management',
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
      <h1>Gestion des agents et administrateurs</h1>
      <button mat-raised-button color="primary" (click)="ouvrirFormulaire()">
        <mat-icon>person_add</mat-icon> Nouveau compte
      </button>
    </div>

    <table mat-table [dataSource]="utilisateurs()" class="mat-elevation-z2 full-width">
      <ng-container matColumnDef="nom">
        <th mat-header-cell *matHeaderCellDef>Nom complet</th>
        <td mat-cell *matCellDef="let u">{{ u.prenom }} {{ u.nom }}</td>
      </ng-container>

      <ng-container matColumnDef="email">
        <th mat-header-cell *matHeaderCellDef>Email</th>
        <td mat-cell *matCellDef="let u">{{ u.email }}</td>
      </ng-container>

      <ng-container matColumnDef="roles">
        <th mat-header-cell *matHeaderCellDef>Rôle</th>
        <td mat-cell *matCellDef="let u">
          @for (r of u.roles; track r) {
            <mat-chip>{{ r }}</mat-chip>
          }
        </td>
      </ng-container>

      <ng-container matColumnDef="guichet">
        <th mat-header-cell *matHeaderCellDef>Guichet</th>
        <td mat-cell *matCellDef="let u">{{ u.guichetId ?? '—' }}</td>
      </ng-container>

      <ng-container matColumnDef="actif">
        <th mat-header-cell *matHeaderCellDef>Actif</th>
        <td mat-cell *matCellDef="let u">
          <mat-slide-toggle [checked]="u.estActif" (change)="toggleActif(u)"></mat-slide-toggle>
        </td>
      </ng-container>

      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>Actions</th>
        <td mat-cell *matCellDef="let u">
          <button mat-icon-button color="warn" (click)="supprimer(u)"><mat-icon>delete</mat-icon></button>
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
export class UsersManagementComponent implements OnInit {
  utilisateurs = signal<AppUser[]>([]);
  colonnes = ['nom', 'email', 'roles', 'guichet', 'actif', 'actions'];

  constructor(
    private userApi: UserApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.userApi.getAll().subscribe((users) =>
      this.utilisateurs.set(users.filter((u) => u.roles.includes('Agent') || u.roles.includes('Admin')))
    );
  }

  ouvrirFormulaire(): void {
    const ref = this.dialog.open(AgentFormDialogComponent);
    ref.afterClosed().subscribe((resultat) => {
      if (!resultat) return;
      this.userApi.creerAgent(resultat).subscribe({
        next: () => {
          this.snackBar.open('Compte créé avec succès.', 'OK', { duration: 2500 });
          this.charger();
        },
        error: (err) =>
          this.snackBar.open(err?.error?.message ?? 'Erreur lors de la création.', 'OK', { duration: 3000 })
      });
    });
  }

  toggleActif(user: AppUser): void {
    this.userApi.update(user.id, { estActif: !user.estActif }).subscribe(() => this.charger());
  }

  supprimer(user: AppUser): void {
    if (!confirm(`Supprimer le compte de ${user.prenom} ${user.nom} ?`)) return;
    this.userApi.delete(user.id).subscribe({
      next: () => {
        this.snackBar.open('Compte supprimé.', 'OK', { duration: 2500 });
        this.charger();
      },
      error: (err) => this.snackBar.open(err?.error?.message ?? 'Erreur.', 'OK', { duration: 3000 })
    });
  }
}
