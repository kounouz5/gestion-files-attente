import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="page-centree">
      <mat-card class="carte-form">
        <mat-card-header>
          <mat-card-title>Connexion</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Mot de passe</mat-label>
              <input matInput type="password" formControlName="password" />
            </mat-form-field>

            @if (erreur()) {
              <p class="erreur">{{ erreur() }}</p>
            }

            <button mat-raised-button color="primary" class="full-width" type="submit"
                    [disabled]="form.invalid || chargement()">
              @if (chargement()) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                Se connecter
              }
            </button>
          </form>
        </mat-card-content>
        <mat-card-footer class="footer">
          Pas encore de compte ? <a routerLink="/auth/register">Créer un compte client</a>
        </mat-card-footer>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-centree { display: flex; justify-content: center; padding-top: 48px; }
    .carte-form { width: 100%; max-width: 420px; padding: 8px; }
    .full-width { width: 100%; margin-bottom: 8px; }
    .erreur { color: #c62828; margin: 4px 0 12px; }
    .footer { padding: 16px; text-align: center; }
  `]
})
export class LoginComponent {
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  chargement = signal(false);
  erreur = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  onSubmit(): void {
    if (this.form.invalid) return;
    this.chargement.set(true);
    this.erreur.set(null);

    this.authService.login(this.form.getRawValue() as { email: string; password: string }).subscribe({
      next: (res) => {
        this.chargement.set(false);
        this.snackBar.open(`Bienvenue ${res.prenom} !`, 'OK', { duration: 3000 });
        this.rediriger(res.roles);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(err?.error?.message ?? 'Email ou mot de passe incorrect.');
      }
    });
  }

  private rediriger(roles: string[]): void {
    if (roles.includes('Admin')) this.router.navigate(['/admin/dashboard']);
    else if (roles.includes('Agent')) this.router.navigate(['/agent/workspace']);
    else this.router.navigate(['/client/prendre-ticket']);
  }
}
