import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { PredictionApiService } from '../../../core/services/prediction-api.service';

interface PredictionRecord {
  id?: number;
  timestamp: string;
  data: any;
  index: number;
}

@Component({
  selector: 'app-prediction-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="history-container">
      <h2>📈 Your Prediction History</h2>
      
      <div *ngIf="predictions.length === 0" class="empty-state">
        <p>📊 No predictions yet. Start by filling the form to see your prediction history here!</p>
      </div>

      <div *ngIf="predictions.length > 0" class="history-list">
        <div *ngFor="let pred of predictions" class="history-item">
          <div class="history-header">
            <span class="history-number">#{{ pred.index }}</span>
            <span class="history-date">📅 {{ formatDate(pred.timestamp) }}</span>
            <button (click)="deletePrediction(pred.index)" class="btn-delete">🗑️ Delete</button>
          </div>
          <div class="history-data">
            <div class="data-row">
              <span class="label">Age:</span>
              <span class="value">{{ pred.data.Age }} years</span>
            </div>
            <div class="data-row">
              <span class="label">Height:</span>
              <span class="value">{{ pred.data.Height }} cm</span>
            </div>
            <div class="data-row">
              <span class="label">Weight:</span>
              <span class="value">{{ pred.data.Weight }} kg</span>
            </div>
            <div class="data-row">
              <span class="label">Gender:</span>
              <span class="value">{{ pred.data.Gender }}</span>
            </div>
            <div class="data-row">
              <span class="label">Physical Activity:</span>
              <span class="value">{{ pred.data.FAF }} hours/week</span>
            </div>
          </div>
        </div>
      </div>

      <div class="history-stats">
        <h3>📊 Statistics</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-value">{{ predictions.length }}</span>
            <span class="stat-label">Total Predictions</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ getAverageWeight() }}</span>
            <span class="stat-label">Avg Weight (kg)</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ getAverageActivity() }}</span>
            <span class="stat-label">Avg Activity (h/week)</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .history-container {
      background: var(--surface);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 2.5rem;
      box-shadow: var(--shadow-soft);
    }

    h2 {
      margin-top: 0;
      margin-bottom: 2rem;
      color: var(--text-primary);
      font-size: 1.5rem;
      font-weight: 700;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-secondary);
      background: var(--surface-light);
      border-radius: 8px;
      border: 2px dashed var(--border-color);
    }

    .empty-state p {
      margin: 0;
      font-size: 1rem;
    }

    .history-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .history-item {
      background: var(--surface-light);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 1.5rem;
      transition: all 0.2s ease;
    }

    .history-item:hover {
      border-color: var(--primary-color);
      box-shadow: 0 8px 16px -14px rgba(54, 65, 39, 0.45);
    }

    .history-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
    }

    .history-number {
      background: var(--primary-color);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.85rem;
    }

    .history-date {
      color: var(--text-secondary);
      font-size: 0.9rem;
      flex: 1;
    }

    .btn-delete {
      background: #fee2e2;
      border: 1px solid #fecaca;
      color: #991b1b;
      padding: 0.4rem 0.8rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.2s ease;
    }

    .btn-delete:hover {
      background: #fecaca;
      transform: translateY(-1px);
    }

    .history-data {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }

    .data-row {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .label {
      font-size: 0.8rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.3px;
      font-weight: 600;
    }

    .value {
      font-size: 1rem;
      color: var(--text-primary);
      font-weight: 500;
    }

    .history-stats {
      background: var(--surface-light);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 1.5rem;
    }

    .history-stats h3 {
      margin: 0 0 1rem 0;
      color: var(--text-primary);
      font-size: 1.1rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      background: var(--surface);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 1rem;
      text-align: center;
      transition: all 0.2s ease;
    }

    .stat-card:hover {
      border-color: var(--primary-color);
      background: #f1f7e9;
    }

    .stat-value {
      display: block;
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--primary-color);
      margin-bottom: 0.5rem;
    }

    .stat-label {
      display: block;
      font-size: 0.85rem;
      color: var(--text-secondary);
      font-weight: 500;
    }
  `]
})
export class PredictionHistoryComponent implements OnInit {
  predictions: PredictionRecord[] = [];

  constructor(private authService: AuthService, private predictionApi: PredictionApiService) {}

  ngOnInit() {
    this.loadPredictions();
  }

  private loadPredictions() {
    const user = this.authService.currentUser();
    if (user) {
      this.predictionApi.getPredictionHistory(user.id).subscribe({
        next: (records) => {
          this.predictions = records.map((p: any, index: number) => ({
            id: p.id,
            timestamp: p.created_at,
            data: p.data,
            index: index + 1
          }));
        },
        error: () => this.loadLocalPredictions()
      });
      return;
    }

    this.loadLocalPredictions();
  }

  private loadLocalPredictions() {
    const predictionsKey = this.authService.getUserScopedStorageKey('predictions');
    const stored = localStorage.getItem(predictionsKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      this.predictions = parsed.map((p: any, index: number) => ({
        timestamp: p.timestamp,
        data: p.data,
        index: index + 1
      })).reverse(); // Show newest first
    }
  }

  formatDate(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getAverageWeight(): string {
    if (this.predictions.length === 0) return '0';
    const sum = this.predictions.reduce((acc, p) => acc + p.data.Weight, 0);
    return (sum / this.predictions.length).toFixed(1);
  }

  getAverageActivity(): string {
    if (this.predictions.length === 0) return '0';
    const sum = this.predictions.reduce((acc, p) => acc + p.data.FAF, 0);
    return (sum / this.predictions.length).toFixed(1);
  }

  deletePrediction(index: number) {
    const user = this.authService.currentUser();
    const selected = this.predictions.find((p) => p.index === index);

    if (user && selected?.id) {
      this.predictionApi.deletePredictionHistory(user.id, selected.id).subscribe({
        next: () => this.loadPredictions(),
        error: () => this.deleteLocalPrediction(index)
      });
      return;
    }

    this.deleteLocalPrediction(index);
  }

  private deleteLocalPrediction(index: number) {
    const predictionsKey = this.authService.getUserScopedStorageKey('predictions');
    const countKey = this.authService.getUserScopedStorageKey('predictionCount');
    const predictions = JSON.parse(localStorage.getItem(predictionsKey) || '[]');
    predictions.splice(predictions.length - index, 1);
    localStorage.setItem(predictionsKey, JSON.stringify(predictions));
    const count = predictions.length;
    localStorage.setItem(countKey, count.toString());
    this.loadPredictions();
  }
}
