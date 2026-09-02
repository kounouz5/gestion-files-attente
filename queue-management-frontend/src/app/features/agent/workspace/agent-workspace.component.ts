import { Component, OnDestroy, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';
import { FormsModule } from '@angular/forms';
import { GuichetApiService } from '../../../core/services/guichet-api.service';
import { AgentApiService } from '../../../core/services/agent-api.service';
import { SignalrService } from '../../../core/services/signalr.service';
import { AuthService } from '../../../core/services/auth.service';
import { GuichetModel } from '../../../core/models/service.model';
import { TicketModel } from '../../../core/models/ticket.model';

@Component({
  selector: 'app-agent-workspace',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatListModule
  ],
  template: `
    <h1>Espace Agent</h1>

    @if (!guichetActuel()) {
      <mat-card class="carte-connexion">
        <mat-card-content>
          <h3>Connexion à un guichet</h3>

          @if (chargementGuichets()) {
            <p>Chargement des guichets...</p>
          } @else if (guichetsDisponibles().length === 0) {
            <p class="aucun-guichet">
              Aucun guichet disponible pour le moment. Un guichet doit être <strong>actif</strong> et
              <strong>libre</strong> (sans agent déjà connecté) pour apparaître ici. Contactez votre
              administrateur.
            </p>
          } @else {
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Choisir un guichet</mat-label>
              <mat-select [(value)]="guichetSelectionne">
                @for (g of guichetsDisponibles(); track g.id) {
                  <mat-option [value]="g.id">{{ g.nom }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <button mat-raised-button color="primary" (click)="connecter()" [disabled]="!guichetSelectionne">
              Se connecter
            </button>
          }
        </mat-card-content>
      </mat-card>
    } @else {
      <div class="grille-agent">
        <mat-card class="carte-guichet">
          <mat-card-content>
            <div class="entete-guichet">
              <h2>{{ guichetActuel()!.nom }}</h2>
              <mat-chip [class]="'chip-' + guichetActuel()!.statut">{{ guichetActuel()!.statut }}</mat-chip>
            </div>

            <div class="services-affectes">
              Services : {{ nomsServices() }}
            </div>

            <div class="actions-guichet">
              @if (guichetActuel()!.statut === 'Actif') {
                <button mat-stroked-button color="warn" (click)="mettreEnPause()">
                  <mat-icon>pause</mat-icon> Pause
                </button>
              } @else if (guichetActuel()!.statut === 'EnPause') {
                <button mat-stroked-button color="primary" (click)="reprendre()">
                  <mat-icon>play_arrow</mat-icon> Reprendre
                </button>
              }
              <button mat-stroked-button (click)="seDeconnecter()">
                <mat-icon>logout</mat-icon> Déconnexion du guichet
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="carte-ticket-actuel">
          <mat-card-content>
            @if (ticketActuel()) {
              <h2>Ticket en traitement</h2>
              <p class="numero">{{ ticketActuel()!.numeroTicket }}</p>
              <mat-chip [class]="'chip-' + ticketActuel()!.statut">{{ ticketActuel()!.statut }}</mat-chip>

              <div class="actions-ticket">
                @if (ticketActuel()!.statut === 'Appele' || ticketActuel()!.statut === 'Rappele') {
                  <button mat-raised-button color="primary" (click)="demarrer()">
                    <mat-icon>play_circle</mat-icon> Démarrer le traitement
                  </button>
                  <button mat-stroked-button (click)="rappeler()">
                    <mat-icon>replay</mat-icon> Rappeler
                  </button>
                  <button mat-stroked-button (click)="mettreEnAttente()">
                    <mat-icon>pause_circle</mat-icon> Mettre en attente
                  </button>
                  <button mat-stroked-button color="warn" (click)="annuler()">
                    <mat-icon>cancel</mat-icon> Annuler
                  </button>
                }
                @if (ticketActuel()!.statut === 'EnCours') {
                  <button mat-raised-button color="primary" (click)="cloturer()">
                    <mat-icon>check_circle</mat-icon> Clôturer
                  </button>
                  <button mat-stroked-button color="warn" (click)="annuler()">
                    <mat-icon>cancel</mat-icon> Annuler
                  </button>
                }
              </div>
            } @else {
              <p class="aucun-ticket">Aucun ticket en cours de traitement.</p>
              <button mat-raised-button color="accent" (click)="appelerProchain()"
                      [disabled]="guichetActuel()!.statut !== 'Actif'">
                <mat-icon>campaign</mat-icon> Appeler le prochain
              </button>
              @if (guichetActuel()!.statut !== 'Actif') {
                <p class="hint">Le guichet doit être actif pour appeler un client.</p>
              }
            }
          </mat-card-content>
        </mat-card>

        <mat-card class="carte-file">
          <mat-card-content>
            <h3>File d'attente ({{ fileAttente().length }})</h3>
            <mat-list>
              @for (t of fileAttente(); track t.id) {
                <mat-list-item>{{ t.numeroTicket }} — {{ t.serviceNom }}</mat-list-item>
              } @empty {
                <p>Aucun client en attente.</p>
              }
            </mat-list>
          </mat-card-content>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .carte-connexion { max-width: 420px; margin: 24px auto; padding: 8px; }
    .full-width { width: 100%; }
    .grille-agent { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
    .carte-file { grid-column: span 2; }
    .entete-guichet { display: flex; justify-content: space-between; align-items: center; }
    .services-affectes { color: #666; margin: 8px 0 16px; }
    .actions-guichet, .actions-ticket { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    .numero { font-size: 40px; font-weight: 800; margin: 8px 0; }
    .aucun-ticket { color: #777; margin-bottom: 16px; }
    .aucun-guichet { color: #e65100; background: #fff3e0; padding: 12px; border-radius: 8px; }
    .hint { color: #e65100; font-size: 13px; }
    .chip-Actif { background: #d4edda; }
    .chip-EnPause { background: #fff3cd; }
    .chip-Inactif { background: #f1f1f1; }
    .chip-Appele, .chip-Rappele { background: #cce5ff; }
    .chip-EnCours { background: #e0d4f7; }
    @media (max-width: 800px) {
      .grille-agent { grid-template-columns: 1fr; }
      .carte-file { grid-column: span 1; }
    }
  `]
})
export class AgentWorkspaceComponent implements OnInit, OnDestroy {
  guichetsDisponibles = signal<GuichetModel[]>([]);
  guichetSelectionne: number | null = null;
  guichetActuel = signal<GuichetModel | null>(null);
  ticketActuel = signal<TicketModel | null>(null);
  fileAttente = signal<TicketModel[]>([]);
  chargementGuichets = signal(true);

  nomsServices = computed(() => this.guichetActuel()?.services.map((s) => s.nom).join(', ') || 'Aucun');

  constructor(
    private guichetApi: GuichetApiService,
    private agentApi: AgentApiService,
    private signalrService: SignalrService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const guichetIdExistant = this.authService.guichetId;

    this.chargementGuichets.set(true);
    this.guichetApi.getAll().subscribe({
      next: (guichets) => {
        this.chargementGuichets.set(false);

        if (guichetIdExistant) {
          const actuel = guichets.find((g) => g.id === guichetIdExistant);
          if (actuel) {
            this.guichetActuel.set(actuel);
            this.demarrerEcouteTempsReel(actuel.id);
            this.rafraichirFileAttente(actuel.id);
            return;
          }
        }
        this.guichetsDisponibles.set(guichets.filter((g) => g.estActif && !g.agentId));
      },
      error: (err) => {
        this.chargementGuichets.set(false);
        this.snackBar.open(
          err?.error?.message ?? 'Erreur lors du chargement des guichets. Vérifiez votre connexion à l\'API.',
          'OK',
          { duration: 4000 }
        );
      }
    });
  }

  connecter(): void {
    if (!this.guichetSelectionne) return;
    this.guichetApi.connect(this.guichetSelectionne).subscribe({
      next: () => {
        this.guichetApi.getById(this.guichetSelectionne!).subscribe((g) => {
          this.guichetActuel.set(g);
          this.demarrerEcouteTempsReel(g.id);
          this.rafraichirFileAttente(g.id);
        });
      },
      error: (err) => this.snackBar.open(err?.error?.message ?? 'Erreur de connexion au guichet.', 'OK', { duration: 3000 })
    });
  }

  seDeconnecter(): void {
    const id = this.guichetActuel()?.id;
    if (!id) return;
    this.guichetApi.disconnect(id).subscribe(() => {
      this.guichetActuel.set(null);
      this.ticketActuel.set(null);
      this.ngOnInit();
    });
  }

  appelerProchain(): void {
    const id = this.guichetActuel()?.id;
    if (!id) return;
    this.agentApi.appelerProchain(id).subscribe({
      next: (res: any) => {
        if (res?.numeroTicket) {
          this.ticketActuel.set(res);
          this.rafraichirFileAttente(id);
        } else {
          this.snackBar.open(res?.message ?? 'Aucun ticket en attente.', 'OK', { duration: 3000 });
        }
      },
      error: (err) => this.snackBar.open(err?.error?.message ?? 'Erreur.', 'OK', { duration: 3000 })
    });
  }

  rappeler(): void {
    this.actionSurTicket((id) => this.agentApi.rappeler(id));
  }

  mettreEnAttente(): void {
    this.actionSurTicket((id) => this.agentApi.mettreEnAttente(id), true);
  }

  annuler(): void {
    this.actionSurTicket((id) => this.agentApi.annuler(id), true);
  }

  demarrer(): void {
    this.actionSurTicket((id) => this.agentApi.demarrerTraitement(id));
  }

  cloturer(): void {
    this.actionSurTicket((id) => this.agentApi.cloturer(id), true);
  }

  mettreEnPause(): void {
    const id = this.guichetActuel()?.id;
    if (!id) return;
    this.agentApi.pauseGuichet(id).subscribe(() => {
      this.guichetActuel.update((g) => (g ? { ...g, statut: 'EnPause' } : g));
    });
  }

  reprendre(): void {
    const id = this.guichetActuel()?.id;
    if (!id) return;
    this.agentApi.resumeGuichet(id).subscribe(() => {
      this.guichetActuel.update((g) => (g ? { ...g, statut: 'Actif' } : g));
    });
  }

  private actionSurTicket(action: (id: number) => any, libereTicket = false): void {
    const ticket = this.ticketActuel();
    if (!ticket) return;
    action(ticket.id).subscribe({
      next: (res: TicketModel) => {
        if (libereTicket) {
          this.ticketActuel.set(null);
          this.rafraichirFileAttente(this.guichetActuel()!.id);
        } else {
          this.ticketActuel.set(res);
        }
      },
      error: (err: any) => this.snackBar.open(err?.error?.message ?? 'Erreur.', 'OK', { duration: 3000 })
    });
  }

  private rafraichirFileAttente(guichetId: number): void {
    this.agentApi.fileAttente(guichetId).subscribe((tickets) => this.fileAttente.set(tickets));
  }

  private demarrerEcouteTempsReel(guichetId: number): void {
    this.signalrService.connecter().then(() => {
      this.signalrService.rejoindreGroupeGuichet(guichetId);
      this.signalrService.ticketCree$.subscribe(() => this.rafraichirFileAttente(guichetId));
      this.signalrService.ticketMisAJour$.subscribe(() => this.rafraichirFileAttente(guichetId));
    });
  }

  ngOnDestroy(): void {
    // La connexion SignalR est conservée au niveau service (réutilisée entre pages).
  }
}
