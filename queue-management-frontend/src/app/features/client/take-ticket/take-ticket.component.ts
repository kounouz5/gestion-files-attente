import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ServiceApiService } from '../../../core/services/service-api.service';
import { TicketApiService } from '../../../core/services/ticket-api.service';
import { ServiceModel } from '../../../core/models/service.model';
import { TicketModel } from '../../../core/models/ticket.model';

@Component({
  selector: 'app-take-ticket',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <h1>Prendre un ticket</h1>

    @if (ticketPris()) {
      <mat-card class="ticket-genere">
        <mat-card-content>
          <mat-icon class="icone-succes">check_circle</mat-icon>
          <h2>Votre numéro : {{ ticketPris()!.numeroTicket }}</h2>
          <p>Service : {{ ticketPris()!.serviceNom }}</p>
          <p>Position dans la file : {{ ticketPris()!.positionDansFile }}</p>
          <p>Temps d'attente estimé : {{ ticketPris()!.tempsAttenteEstimeMinutes }} min</p>
          <div class="actions">
            <button mat-raised-button color="primary" (click)="imprimer()">
              <mat-icon>print</mat-icon> Imprimer
            </button>
            <button mat-stroked-button (click)="suivreTicket()">
              <mat-icon>visibility</mat-icon> Suivre mon ticket
            </button>
            <button mat-button (click)="ticketPris.set(null)">Prendre un autre ticket</button>
          </div>
        </mat-card-content>
      </mat-card>
    } @else {
      @if (chargement()) {
        <div class="chargement"><mat-spinner></mat-spinner></div>
      } @else {
        <div class="grille-services">
          @for (service of services(); track service.id) {
            <mat-card class="carte-service">
              <mat-card-content>
                <h3>{{ service.nom }}</h3>
                @if (service.description) { <p>{{ service.description }}</p> }
                <p class="info-attente">
                  <mat-icon inline>groups</mat-icon>
                  {{ service.nombreEnAttente ?? 0 }} en attente
                </p>
                <button mat-raised-button color="primary" (click)="prendreTicket(service)"
                        [disabled]="prisEnCours()">
                  Prendre un ticket
                </button>
              </mat-card-content>
            </mat-card>
          } @empty {
            <p>Aucun service disponible pour le moment.</p>
          }
        </div>
      }
    }
  `,
  styles: [`
    .grille-services { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; margin-top: 16px; }
    .carte-service h3 { margin: 0 0 8px; }
    .info-attente { display: flex; align-items: center; gap: 4px; color: #555; }
    .chargement { display: flex; justify-content: center; padding: 48px; }
    .ticket-genere { max-width: 480px; margin: 24px auto; text-align: center; padding: 16px; }
    .icone-succes { color: #2e7d32; font-size: 48px; height: 48px; width: 48px; }
    .actions { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
  `]
})
export class TakeTicketComponent implements OnInit {
  services = signal<ServiceModel[]>([]);
  chargement = signal(true);
  prisEnCours = signal(false);
  ticketPris = signal<TicketModel | null>(null);

  constructor(
    private serviceApi: ServiceApiService,
    private ticketApi: TicketApiService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.serviceApi.getAll(true).subscribe({
      next: (services) => {
        this.services.set(services);
        this.chargement.set(false);
      },
      error: () => this.chargement.set(false)
    });
  }

  prendreTicket(service: ServiceModel): void {
    this.prisEnCours.set(true);
    this.ticketApi.creerTicket(service.id).subscribe({
      next: (ticket) => {
        this.ticketPris.set(ticket);
        this.prisEnCours.set(false);
      },
      error: () => {
        this.snackBar.open('Erreur lors de la prise du ticket.', 'OK', { duration: 3000 });
        this.prisEnCours.set(false);
      }
    });
  }

  imprimer(): void {
    window.print();
  }

  suivreTicket(): void {
    if (this.ticketPris()) {
      this.router.navigate(['/client/suivi', this.ticketPris()!.id]);
    }
  }
}
