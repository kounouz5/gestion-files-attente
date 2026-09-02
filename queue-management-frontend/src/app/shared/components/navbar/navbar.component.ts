import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule
  ],
  template: `
    <mat-toolbar color="primary" class="navbar">
      <span class="brand">
        <mat-icon>confirmation_number</mat-icon>
        File d'Attente Intelligente
      </span>

      <span class="spacer"></span>

      @if (auth.isAuthenticated()) {
        @if (auth.hasRole('Admin')) {
          <a mat-button routerLink="/admin/dashboard" routerLinkActive="active">Tableau de bord</a>
          <a mat-button routerLink="/admin/services" routerLinkActive="active">Services</a>
          <a mat-button routerLink="/admin/guichets" routerLinkActive="active">Guichets</a>
          <a mat-button routerLink="/admin/users" routerLinkActive="active">Agents</a>
          <a mat-button routerLink="/admin/stats" routerLinkActive="active">Statistiques</a>
        }
        @if (auth.hasRole('Agent')) {
          <a mat-button routerLink="/agent/workspace" routerLinkActive="active">Mon espace</a>
        }
        @if (auth.hasRole('Client')) {
          <a mat-button routerLink="/client/prendre-ticket" routerLinkActive="active">Prendre un ticket</a>
          <a mat-button routerLink="/client/mes-tickets" routerLinkActive="active">Mes tickets</a>
        }

        <button mat-icon-button [matMenuTriggerFor]="menu">
          <mat-icon>account_circle</mat-icon>
        </button>
        <mat-menu #menu="matMenu">
          <div class="user-info" mat-menu-item disabled>
            {{ auth.currentUser()?.prenom }} {{ auth.currentUser()?.nom }}
          </div>
          <button mat-menu-item (click)="auth.logout()">
            <mat-icon>logout</mat-icon>
            Déconnexion
          </button>
        </mat-menu>
      } @else {
        <a mat-button routerLink="/client/ecran-public" routerLinkActive="active">Écran public</a>
        <a mat-button routerLink="/auth/login" routerLinkActive="active">Connexion</a>
        <a mat-raised-button color="accent" routerLink="/auth/register">Créer un compte</a>
      }
    </mat-toolbar>
  `,
  styles: [`
    .navbar { display: flex; gap: 4px; }
    .brand { display: flex; align-items: center; gap: 8px; font-weight: 600; margin-right: 16px; }
    .spacer { flex: 1 1 auto; }
    .active { font-weight: 700; text-decoration: underline; }
    .user-info { font-weight: 600; opacity: 0.8; }
  `]
})
export class NavbarComponent {
  constructor(public auth: AuthService) {}
}
