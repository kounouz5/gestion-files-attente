import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { TicketModel } from '../models/ticket.model';

@Injectable({ providedIn: 'root' })
export class SignalrService {
  private hubConnection?: signalR.HubConnection;

  readonly ticketCree$ = new Subject<TicketModel>();
  readonly ticketAppele$ = new Subject<TicketModel>();
  readonly ticketMisAJour$ = new Subject<TicketModel>();
  readonly guichetStatutChange$ = new Subject<{ guichetId: number; statut: string }>();
  readonly dashboardMisAJour$ = new Subject<void>();

  constructor(private authService: AuthService) {}

  async connecter(): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      return;
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.hubUrl, {
        accessTokenFactory: () => this.authService.getToken() ?? ''
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('TicketCree', (ticket: TicketModel) => this.ticketCree$.next(ticket));
    this.hubConnection.on('TicketAppele', (ticket: TicketModel) => this.ticketAppele$.next(ticket));
    this.hubConnection.on('TicketMisAJour', (ticket: TicketModel) => this.ticketMisAJour$.next(ticket));
    this.hubConnection.on('GuichetStatutChange', (data: { guichetId: number; statut: string }) =>
      this.guichetStatutChange$.next(data)
    );
    this.hubConnection.on('DashboardMisAJour', () => this.dashboardMisAJour$.next());

    try {
      await this.hubConnection.start();
    } catch (err) {
      console.error('Erreur de connexion SignalR :', err);
    }
  }

  async rejoindreGroupeService(serviceId: number): Promise<void> {
    await this.hubConnection?.invoke('JoinServiceGroup', serviceId);
  }

  async rejoindreGroupeGuichet(guichetId: number): Promise<void> {
    await this.hubConnection?.invoke('JoinGuichetGroup', guichetId);
  }

  async rejoindreGroupeAdmin(): Promise<void> {
    await this.hubConnection?.invoke('JoinAdminGroup');
  }

  async deconnecter(): Promise<void> {
    await this.hubConnection?.stop();
  }
}
