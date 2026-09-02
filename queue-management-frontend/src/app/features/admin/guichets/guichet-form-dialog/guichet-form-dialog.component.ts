import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { GuichetModel, ServiceModel } from '../../../../core/models/service.model';

export interface GuichetDialogData {
  guichet: GuichetModel | null;
  servicesDisponibles: ServiceModel[];
}

@Component({
  selector: 'app-guichet-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.guichet ? 'Modifier le guichet' : 'Nouveau guichet' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="formulaire">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nom du guichet</mat-label>
          <input matInput formControlName="nom" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Services affectés</mat-label>
          <mat-select formControlName="serviceIds" multiple>
            @for (s of data.servicesDisponibles; track s.id) {
              <mat-option [value]="s.id">{{ s.nom }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="valider()">
        Enregistrer
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .formulaire { display: flex; flex-direction: column; gap: 4px; min-width: 320px; }
    .full-width { width: 100%; }
  `]
})
export class GuichetFormDialogComponent {
  form = this.fb.group({
    nom: [this.data.guichet?.nom ?? '', Validators.required],
    serviceIds: [this.data.guichet?.services.map((s) => s.id) ?? []]
  });

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<GuichetFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GuichetDialogData
  ) {}

  valider(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue());
  }
}
