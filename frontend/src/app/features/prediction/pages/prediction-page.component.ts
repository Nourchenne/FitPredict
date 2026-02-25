import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PredictionFormComponent, PredictionResultComponent, PredictionHistoryComponent } from '../components';
import { PredictionResponse } from '../../../core/models';

@Component({
  selector: 'app-prediction-page',
  standalone: true,
  imports: [CommonModule, PredictionFormComponent, PredictionResultComponent, PredictionHistoryComponent],
  template: `
    <div class="prediction-container">
      <div class="header-card">
        <div class="header-content">
          <p class="eyebrow">Health intelligence</p>
          <h1>🎯 Obesity Level Prediction</h1>
          <p class="subtitle">Analyze your obesity status with our advanced machine learning model.</p>
        </div>

        <div class="quick-tips" aria-label="Quick tips">
          <h3>✨ Quick tips for better predictions</h3>
          <ul>
            <li>Use your current measurements (not old estimates)</li>
            <li>Be honest for nutrition and activity habits</li>
            <li>Interpret results as guidance, not diagnosis</li>
          </ul>
        </div>
      </div>

      <div class="content-grid">
        <div class="form-section">
          <app-prediction-form 
            (predictionResult)="onPredictionSubmitted($event)">
          </app-prediction-form>
        </div>

        <div *ngIf="currentResult(); else waitingResult" class="result-section" id="prediction-result">
          <app-prediction-result 
            [result]="currentResult()">
          </app-prediction-result>
        </div>

        <ng-template #waitingResult>
          <aside class="result-placeholder">
            <h3>📊 Your result will appear here</h3>
            <p>
              Submit the form to generate your personalized prediction confidence and recommendations.
            </p>
            <div class="placeholder-points">
              <span>• Prediction label</span>
              <span>• Confidence score</span>
              <span>• Actionable guidance</span>
            </div>
          </aside>
        </ng-template>
      </div>

      <div class="history-section">
        <app-prediction-history></app-prediction-history>
      </div>
    </div>
  `,
  styles: [`
    .prediction-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 1.25rem 2rem 2rem;
    }

    .header-card {
      margin-bottom: 2rem;
      border: 1px solid #e4cf77;
      border-radius: 14px;
      padding: 1.5rem;
      background: linear-gradient(140deg, #efd56f 0%, #f0cf59 65%, #e9bf3f 100%);
      display: grid;
      grid-template-columns: 1.3fr 1fr;
      gap: 1rem;
      align-items: stretch;
      box-shadow: var(--shadow-soft);
    }

    .header-content {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 0.5rem 0.5rem 0.5rem 0.75rem;
    }

    .eyebrow {
      margin: 0;
      color: #4f5f37;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .header-content h1 {
      font-size: 2rem;
      line-height: 1.2;
      margin-bottom: 0.5rem;
      color: #1a2333;
    }

    .quick-tips {
      background: rgba(255, 255, 255, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.55);
      border-radius: 14px;
      padding: 1rem;
      box-shadow: 0 6px 18px -16px rgba(54, 65, 39, 0.35);
    }

    .quick-tips h3 {
      margin: 0 0 0.6rem;
      font-size: 0.95rem;
      color: var(--text-primary);
    }

    .quick-tips ul {
      margin: 0;
      padding-left: 1.1rem;
      color: var(--text-secondary);
      font-size: 0.9rem;
      display: grid;
      gap: 0.35rem;
    }

    .history-section {
      margin-top: 2rem;
    }

    .subtitle {
      color: rgba(24, 33, 48, 0.72);
      font-size: 1rem;
      margin: 0;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      align-items: start;
    }

    .form-section,
    .result-section {
    }

    .result-placeholder {
      border: 1px dashed #b8c3aa;
      border-radius: 14px;
      padding: 1.4rem;
      background: #f6f8f1;
      color: var(--text-secondary);
      min-height: 260px;
      display: grid;
      align-content: center;
      gap: 0.65rem;
    }

    .result-placeholder h3 {
      margin: 0;
      color: var(--text-primary);
    }

    .result-placeholder p {
      margin: 0;
    }

    .placeholder-points {
      display: grid;
      gap: 0.35rem;
      font-size: 0.9rem;
      color: var(--text-muted);
    }

    @media (max-width: 1024px) {
      .header-card {
        grid-template-columns: 1fr;
      }

      .content-grid {
        grid-template-columns: 1fr;
      }

      .header-content h1 {
        font-size: 1.5rem;
      }
    }

    @media (max-width: 640px) {
      .prediction-container {
        padding: 1rem;
      }

      .header-card {
        margin-bottom: 2rem;
      }
    }
  `]
})
export class PredictionPageComponent {
  currentResult = signal<PredictionResponse | null>(null);

  onPredictionSubmitted(result: PredictionResponse) {
    this.currentResult.set(result);
    // Scroll to result
    setTimeout(() => {
      const resultSection = document.querySelector('.result-section');
      if (resultSection) {
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }
}
