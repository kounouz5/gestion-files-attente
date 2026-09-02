import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ServiceModel } from '../../../../core/models/service.model';

@Component({
  selector: 'app-service-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Modifier le service' : 'Nouveau service' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="formulaire">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nom du service</mat-label>
          <input matInput formControlName="nom" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="2"></textarea>
        </mat-form-field>

        <div class="ligne">
          <mat-form-field appearance="outline">
            <mat-label>Préfixe ticket</mat-label>
            <input matInput formControlName="prefixeTicket" maxlength="3" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Durée moyenne (min)</mat-label>
            <input matInput type="number" formControlName="dureeMoyenneMinutes" />
          </mat-form-field>
        </div>
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
    .ligne { display: flex; gap: 12px; }
  `]
})
export class ServiceFormDialogComponent {
  form = this.fb.group({
    nom: [this.data?.nom ?? '', Validators.required],
    description: [this.data?.description ?? ''],
    prefixeTicket: [this.data?.prefixeTicket ?? 'A', Validators.required],
    dureeMoyenneMinutes: [this.data?.dureeMoyenneMinutes ?? 5, [Validators.required, Validators.min(1)]]
  });

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ServiceFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ServiceModel | null
  ) {}

  valider(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue());
  }
}
