import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TicketApiService } from '../../../core/services/ticket-api.service';
import { TicketModel } from '../../../core/models/ticket.model';

@Component({
  selector: 'app-my-tickets',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatChipsModule, MatButtonModule, MatIconModule],
  template: `
    <h1>Mes tickets</h1>

    @if (tickets().length === 0) {
      <p>Vous n'avez pris aucun ticket pour le moment.</p>
    }

    <div class="liste-tickets">
      @for (ticket of tickets(); track ticket.id) {
        <mat-card class="carte-ticket">
          <mat-card-content>
            <div class="entete">
              <span class="numero">{{ ticket.numeroTicket }}</span>
              <mat-chip [class]="'chip-' + ticket.statut">{{ libelle(ticket.statut) }}</mat-chip>
            </div>
            <p>{{ ticket.serviceNom }}</p>
            <p class="date">Pris le {{ ticket.dateCreation | date: 'dd/MM/yyyy HH:mm' }}</p>
            @if (ticket.statut === 'EnAttente') {
              <a mat-button color="primary" [routerLink]="['/client/suivi', ticket.id]">
                <mat-icon>visibility</mat-icon> Suivre
              </a>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .liste-tickets { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; margin-top: 16px; }
    .entete { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .numero { font-size: 22px; font-weight: 700; }
    .date { color: #777; font-size: 13px; }
    .chip-EnAttente { background: #fff3cd; }
    .chip-Traite { background: #d4edda; }
    .chip-Annule { background: #f8d7da; }
  `]
})
export class MyTicketsComponent implements OnInit {
  tickets = signal<TicketModel[]>([]);

  constructor(private ticketApi: TicketApiService) {}

  ngOnInit(): void {
    this.ticketApi.getMesTickets().subscribe((tickets) => this.tickets.set(tickets));
  }

  libelle(statut: string): string {
    const libelles: Record<string, string> = {
      EnAttente: 'En attente',
      Appele: 'Appelé',
      EnCours: 'En cours',
      Traite: 'Traité',
      Annule: 'Annulé',
      Rappele: 'Rappelé',
      EnAttenteGuichet: 'En attente guichet'
    };
    return libelles[statut] ?? statut;
  }
}
