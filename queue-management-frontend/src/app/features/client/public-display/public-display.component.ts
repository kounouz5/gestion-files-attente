import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ServiceApiService } from '../../../core/services/service-api.service';
import { TicketApiService } from '../../../core/services/ticket-api.service';
import { SignalrService } from '../../../core/services/signalr.service';
import { ServiceModel } from '../../../core/models/service.model';
import { TicketModel } from '../../../core/models/ticket.model';

interface LigneAffichage {
  service: ServiceModel;
  enCours: TicketModel | null;
  dernierAppele: TicketModel | null;
}

@Component({
  selector: 'app-public-display',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="ecran-public">
      <h1><mat-icon inline>tv</mat-icon> Affichage de la file d'attente</h1>

      <div class="grille">
        @for (ligne of lignes(); track ligne.service.id) {
          <mat-card class="carte-service">
            <mat-card-header>
              <mat-card-title>{{ ligne.service.nom }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="bloc en-cours">
                <span class="etiquette">En cours</span>
                <span class="numero-ticket">{{ ligne.enCours?.numeroTicket ?? '—' }}</span>
                @if (ligne.enCours?.guichetNom) {
                  <span class="guichet">{{ ligne.enCours?.guichetNom }}</span>
                }
              </div>
              <div class="bloc dernier-appele">
                <span class="etiquette">Dernier appelé</span>
                <span class="numero-ticket-secondaire">{{ ligne.dernierAppele?.numeroTicket ?? '—' }}</span>
              </div>
            </mat-card-content>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: [`
    .ecran-public { text-align: center; }
    .grille { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-top: 24px; }
    .carte-service { padding: 8px; }
    .bloc { display: flex; flex-direction: column; align-items: center; padding: 16px 0; }
    .etiquette { text-transform: uppercase; font-size: 12px; letter-spacing: 1px; color: #888; }
    .numero-ticket { font-size: 56px; font-weight: 800; color: #1a237e; }
    .numero-ticket-secondaire { font-size: 28px; font-weight: 600; color: #777; }
    .guichet { margin-top: 4px; color: #555; font-weight: 600; }
    .dernier-appele { border-top: 1px dashed #ddd; }
  `]
})
export class PublicDisplayComponent implements OnInit {
  lignes = signal<LigneAffichage[]>([]);

  constructor(
    private serviceApi: ServiceApiService,
    private ticketApi: TicketApiService,
    private signalrService: SignalrService
  ) {}

  ngOnInit(): void {
    this.serviceApi.getAll(true).subscribe((services) => {
      const lignes: LigneAffichage[] = services.map((s) => ({ service: s, enCours: null, dernierAppele: null }));
      this.lignes.set(lignes);
      lignes.forEach((ligne) => this.chargerDonneesService(ligne.service.id));

      this.signalrService.connecter().then(() => {
        services.forEach((s) => this.signalrService.rejoindreGroupeService(s.id));
        this.signalrService.ticketAppele$.subscribe((ticket) => this.chargerDonneesService(ticket.serviceId));
        this.signalrService.ticketMisAJour$.subscribe((ticket) => this.chargerDonneesService(ticket.serviceId));
        this.signalrService.ticketCree$.subscribe((ticket) => this.chargerDonneesService(ticket.serviceId));
      });
    });
  }

  private chargerDonneesService(serviceId: number): void {
    this.ticketApi.getTicketEnCours(serviceId).subscribe((enCours) => this.mettreAJourLigne(serviceId, { enCours }));
    this.ticketApi.getDernierAppele(serviceId).subscribe((dernierAppele) =>
      this.mettreAJourLigne(serviceId, { dernierAppele })
    );
  }

  private mettreAJourLigne(serviceId: number, patch: Partial<LigneAffichage>): void {
    this.lignes.update((lignes) =>
      lignes.map((l) => (l.service.id === serviceId ? { ...l, ...patch } : l))
    );
  }
}
