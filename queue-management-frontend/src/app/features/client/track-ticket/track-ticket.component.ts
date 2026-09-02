import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Subscription, interval, switchMap, startWith } from 'rxjs';
import { TicketApiService } from '../../../core/services/ticket-api.service';
import { SignalrService } from '../../../core/services/signalr.service';
import { TicketPublicStatus } from '../../../core/models/ticket.model';

@Component({
  selector: 'app-track-ticket',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule, MatButtonModule, MatProgressBarModule],
  template: `
    <div class="page-centree">
      @if (statut()) {
        <mat-card class="carte-suivi" [class.alerte]="statut()!.positionDansFile <= 1 && statut()!.statut === 'EnAttente'">
          <mat-card-content>
            <p class="numero">{{ statut()!.numeroTicket }}</p>
            <p class="statut-libelle">{{ libelleStatut(statut()!.statut) }}</p>

            @if (statut()!.statut === 'EnAttente') {
              <div class="stat-bloc">
                <mat-icon>groups</mat-icon>
                <span>Position dans la file : <strong>{{ statut()!.positionDansFile }}</strong></span>
              </div>
              <div class="stat-bloc">
                <mat-icon>schedule</mat-icon>
                <span>Temps d'attente estimé : <strong>{{ statut()!.tempsAttenteEstimeMinutes }} min</strong></span>
              </div>

              @if (statut()!.positionDansFile <= 1) {
                <p class="alerte-texte">
                  <mat-icon>notifications_active</mat-icon>
                  Votre tour approche, tenez-vous prêt !
                </p>
              }
            }

            <div class="infos-complementaires">
              @if (statut()!.ticketEnCours) {
                <p>Ticket en cours de traitement : <strong>{{ statut()!.ticketEnCours }}</strong></p>
              }
              @if (statut()!.dernierTicketAppele) {
                <p>Dernier ticket appelé : <strong>{{ statut()!.dernierTicketAppele }}</strong></p>
              }
            </div>
          </mat-card-content>
        </mat-card>
        <a mat-button routerLink="/client/prendre-ticket">Retour</a>
      }
    </div>
  `,
  styles: [`
    .page-centree { display: flex; flex-direction: column; align-items: center; padding-top: 32px; gap: 12px; }
    .carte-suivi { width: 100%; max-width: 480px; text-align: center; padding: 24px; transition: background-color .3s; }
    .carte-suivi.alerte { background-color: #fff8e1; }
    .numero { font-size: 42px; font-weight: 700; margin: 0; }
    .statut-libelle { font-size: 18px; color: #555; margin-bottom: 16px; }
    .stat-bloc { display: flex; align-items: center; justify-content: center; gap: 8px; margin: 8px 0; }
    .alerte-texte { display: flex; align-items: center; justify-content: center; gap: 8px; color: #e65100; font-weight: 600; margin-top: 12px; }
    .infos-complementaires { margin-top: 16px; border-top: 1px solid #eee; padding-top: 12px; color: #666; }
  `]
})
export class TrackTicketComponent implements OnInit, OnDestroy {
  statut = signal<TicketPublicStatus | null>(null);
  private ticketId!: number;
  private pollingSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private ticketApi: TicketApiService,
    private signalrService: SignalrService
  ) {}

  ngOnInit(): void {
    this.ticketId = Number(this.route.snapshot.paramMap.get('id'));

    // Rafraîchissement périodique (toutes les 5s) en complément du temps réel SignalR
    this.pollingSub = interval(5000)
      .pipe(
        startWith(0),
        switchMap(() => this.ticketApi.getStatutPublic(this.ticketId))
      )
      .subscribe((statut) => this.statut.set(statut));

    this.signalrService.connecter().then(() => {
      this.signalrService.ticketAppele$.subscribe(() => this.rafraichir());
      this.signalrService.ticketMisAJour$.subscribe(() => this.rafraichir());
    });
  }

  private rafraichir(): void {
    this.ticketApi.getStatutPublic(this.ticketId).subscribe((statut) => this.statut.set(statut));
  }

  libelleStatut(statut: string): string {
    const libelles: Record<string, string> = {
      EnAttente: 'En attente',
      Appele: 'Vous êtes appelé(e) !',
      EnCours: 'En cours de traitement',
      Traite: 'Traitement terminé',
      Annule: 'Ticket annulé',
      Rappele: 'Rappel en cours',
      EnAttenteGuichet: 'Mis en attente par l\'agent'
    };
    return libelles[statut] ?? statut;
  }

  ngOnDestroy(): void {
    this.pollingSub?.unsubscribe();
  }
}
