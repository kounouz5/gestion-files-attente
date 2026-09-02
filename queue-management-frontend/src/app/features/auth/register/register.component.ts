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
  selector: 'app-register',
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
          <mat-card-title>Créer un compte client</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="ligne">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Prénom</mat-label>
                <input matInput formControlName="prenom" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Nom</mat-label>
                <input matInput formControlName="nom" />
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Téléphone (optionnel)</mat-label>
              <input matInput formControlName="phoneNumber" />
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
                Créer mon compte
              }
            </button>
          </form>
        </mat-card-content>
        <mat-card-footer class="footer">
          Déjà un compte ? <a routerLink="/auth/login">Se connecter</a>
        </mat-card-footer>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-centree { display: flex; justify-content: center; padding-top: 48px; padding-bottom: 48px; }
    .carte-form { width: 100%; max-width: 480px; padding: 8px; }
    .full-width { width: 100%; margin-bottom: 8px; }
    .ligne { display: flex; gap: 12px; }
    .erreur { color: #c62828; margin: 4px 0 12px; }
    .footer { padding: 16px; text-align: center; }
  `]
})
export class RegisterComponent {
  form = this.fb.group({
    nom: ['', Validators.required],
    prenom: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
    password: ['', [Validators.required, Validators.minLength(6)]]
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

    this.authService.registerClient(this.form.getRawValue() as any).subscribe({
      next: () => {
        this.chargement.set(false);
        this.snackBar.open('Compte créé avec succès !', 'OK', { duration: 3000 });
        this.router.navigate(['/client/prendre-ticket']);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(err?.error?.message ?? err?.error?.errors?.join(', ') ?? 'Erreur lors de l\'inscription.');
      }
    });
  }
}
