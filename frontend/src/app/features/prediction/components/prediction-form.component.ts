import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PredictionApiService } from '../../../core/services/prediction-api.service';
import { LanguageService } from '../../../core/services/language.service';
import { PredictionRequest, PredictionResponse } from '../../../core/models';

@Component({
  selector: 'app-prediction-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './prediction-form.component.html',
  styleUrls: ['./prediction-form.component.css']
})
export class PredictionFormComponent {
  @Output() predictionResult = new EventEmitter<PredictionResponse>();
  
  loading = false;
  error: string | null = null;
  success: string | null = null;
  form: FormGroup;
  submitted = false;
  predictionCount = 0;
  readonly fieldOrder = [
    'Gender', 'Age', 'Height', 'Weight',
    'family_history_with_overweight', 'FAVC', 'FCVC', 'NCP',
    'CAEC', 'SMOKE', 'CH2O', 'SCC',
    'FAF', 'TUE', 'CALC', 'MTRANS'
  ];

  constructor(private fb: FormBuilder, private api: PredictionApiService, public languageService: LanguageService) {
    this.form = this.fb.group({
      Gender: ['Male', Validators.required],
      Age: [30, [Validators.required, Validators.min(1), Validators.max(130)]],
      Height: [175, [Validators.required, Validators.min(50), Validators.max(250)]],
      Weight: [70, [Validators.required, Validators.min(20), Validators.max(500)]],
      family_history_with_overweight: ['no', Validators.required],
      FAVC: ['no', Validators.required],
      FCVC: [2.0, [Validators.required, Validators.min(0), Validators.max(5)]],
      NCP: [3, [Validators.required, Validators.min(1), Validators.max(10)]],
      CAEC: ['Between', Validators.required],
      SMOKE: ['no', Validators.required],
      CH2O: [2.0, [Validators.required, Validators.min(0), Validators.max(10)]],
      SCC: ['no', Validators.required],
      FAF: [0, [Validators.required, Validators.min(0), Validators.max(16)]],
      TUE: [0, [Validators.required, Validators.min(0), Validators.max(24)]],
      CALC: ['Never', Validators.required],
      MTRANS: ['Public_Transportation', Validators.required]
    });
    this.loadPredictionCount();
  }

  private loadPredictionCount() {
    const stored = localStorage.getItem('predictionCount');
    this.predictionCount = stored ? parseInt(stored, 10) : 0;
  }

  private savePredictionCount() {
    this.predictionCount++;
    localStorage.setItem('predictionCount', this.predictionCount.toString());
    const predictions = JSON.parse(localStorage.getItem('predictions') || '[]');
    predictions.push({
      timestamp: new Date().toISOString(),
      data: this.form.value
    });
    localStorage.setItem('predictions', JSON.stringify(predictions));
  }

  onSubmit() {
    this.submitted = true;
    this.error = null;
    this.success = null;
    this.form.markAllAsTouched();
    
    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    const payload: PredictionRequest = this.form.value;
    
    this.api.predict(payload).subscribe({
      next: (response: PredictionResponse) => {
        this.loading = false;
        this.savePredictionCount();
        this.success = `✅ Prediction #${this.predictionCount} completed! Check your result above.`;
        setTimeout(() => this.success = null, 5000);
        this.predictionResult.emit(response);
        this.submitted = false;
      },
      error: (error: any) => {
        this.loading = false;
        this.error = error.message || this.languageService.t('form.error');
        console.error('Prediction error:', error);
      }
    });
  }

  reset() {
    this.form.reset({
      Gender: 'Male',
      Age: 30,
      Height: 175,
      Weight: 70,
      family_history_with_overweight: 'no',
      FAVC: 'no',
      FCVC: 2.0,
      NCP: 3,
      CAEC: 'Between',
      SMOKE: 'no',
      CH2O: 2.0,
      SCC: 'no',
      FAF: 0,
      TUE: 0,
      CALC: 'Never',
      MTRANS: 'Public_Transportation'
    });
    this.submitted = false;
    this.error = null;
    this.success = null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!field && field.invalid && (field.touched || this.submitted);
  }

  get totalFields(): number {
    return this.fieldOrder.length;
  }

  get completedFields(): number {
    return this.fieldOrder.filter((key) => {
      const value = this.form.get(key)?.value;
      return value !== null && value !== undefined && value !== '';
    }).length;
  }

  get completionPercent(): number {
    return Math.round((this.completedFields / this.totalFields) * 100);
  }

  get invalidFieldCount(): number {
    return Object.values(this.form.controls).filter((control) => control.invalid).length;
  }

  getFieldError(fieldName: string): string | null {
    const field = this.form.get(fieldName);
    if (field && field.errors && this.submitted) {
      if (field.errors['required']) return this.languageService.t('form.required');
      if (field.errors['min']) return `Minimum: ${field.errors['min'].min}`;
      if (field.errors['max']) return `Maximum: ${field.errors['max'].max}`;
    }
    return null;
  }
}
