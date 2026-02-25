import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PredictionResponse } from '../../../core/models';

@Component({
  selector: 'app-prediction-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './prediction-result.component.html',
  styleUrls: ['./prediction-result.component.css']
})
export class PredictionResultComponent {
  @Input() result: PredictionResponse | null = null;

  getProbabilityClass(): string {
    if (!this.result) return '';
    return this.isHighRisk() ? 'high-risk' : 'low-risk';
  }

  getStatusClass(): string {
    if (!this.result) return '';
    return this.isHighRisk() ? 'status-exited' : 'status-stayed';
  }

  isHighRisk(): boolean {
    if (!this.result) return false;
    const highRiskLabels = ['Obesity Type III', 'Obesity Type II', 'Overweight Level II', 'Overweight Level I'];
    return highRiskLabels.includes(this.result.prediction_label);
  }

  getRecommendationIcon(): string {
    if (!this.result) return '';
    switch (this.result.prediction_label) {
      case 'Insufficient_Weight':
        return '⚠️';
      case 'Normal_Weight':
        return '✅';
      case 'Overweight_Level_I':
      case 'Overweight_Level_II':
        return '⚠️';
      case 'Obesity_Type_I':
      case 'Obesity_Type_II':
      case 'Obesity_Type_III':
        return '🚨';
      default:
        return '📊';
    }
  }

  getRecommendationText(): string {
    if (!this.result) return '';
    switch (this.result.prediction_label) {
      case 'Insufficient_Weight':
        return 'You are below normal weight. Consult a nutritionist to develop a healthy gain plan.';
      case 'Normal_Weight':
        return 'Great! You have a healthy weight. Maintain this with regular exercise and balanced nutrition.';
      case 'Overweight_Level_I':
        return 'You are slightly overweight. Increase physical activity and reduce caloric intake gradually.';
      case 'Overweight_Level_II':
        return 'You are moderately overweight. Adjust your diet and start a consistent exercise program.';
      case 'Obesity_Type_I':
        return 'You have Type I obesity. Consult a healthcare professional for a personalized program.';
      case 'Obesity_Type_II':
        return 'You have Type II obesity. Urgent action recommended. Seek professional medical guidance.';
      case 'Obesity_Type_III':
        return 'You have severe obesity. Please consult a doctor immediately for comprehensive support.';
      default:
        return 'Consult a healthcare professional for personalized guidance based on your results.';
    }
  }
}
