import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginRequest,
  RegisterClientRequest,
  Role
} from '../models/auth.model';

const TOKEN_KEY = 'qm_token';
const USER_KEY = 'qm_user';

interface StoredUser {
  userId: string;
  email: string;
  nom: string;
  prenom: string;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  // État réactif de l'utilisateur connecté
  readonly currentUser = signal<StoredUser | null>(this.lireUtilisateurStocke());
  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly roles = computed(() => this.currentUser()?.roles ?? []);

  constructor(private http: HttpClient, private router: Router) {}

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, payload).pipe(
      tap((res) => this.stockerSession(res))
    );
  }

  registerClient(payload: RegisterClientRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, payload).pipe(
      tap((res) => this.stockerSession(res))
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  hasRole(role: Role): boolean {
    return this.roles().includes(role);
  }

  hasAnyRole(roles: Role[]): boolean {
    return roles.some((r) => this.roles().includes(r));
  }

  get guichetId(): number | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed.guichetId ?? null;
    } catch {
      return null;
    }
  }

  private stockerSession(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    const user: StoredUser = {
      userId: res.userId,
      email: res.email,
      nom: res.nom,
      prenom: res.prenom,
      roles: res.roles
    };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  private lireUtilisateurStocke(): StoredUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredUser;
    } catch {
      return null;
    }
  }
}
