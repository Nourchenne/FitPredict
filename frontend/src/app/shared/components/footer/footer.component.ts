import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <footer class="footer">
      <div class="footer-container">
        <div class="footer-content">
          <div class="footer-section">
            <h3>🏠 FitPredict</h3>
            <p>Predict your obesity level and get personalized fitness recommendations</p>
          </div>

          <div class="footer-section">
            <h4>Navigation</h4>
            <ul>
              <li><a routerLink="/">🏠 Home</a></li>
              <li><a routerLink="/prediction">🎯 Prediction</a></li>
              <li><a routerLink="/workouts">💪 Workouts</a></li>
              <li><a routerLink="/recipes">🍽️ Recipes</a></li>
            </ul>
          </div>

          <div class="footer-section">
            <h4>Technologies</h4>
            <ul>
              <li>Angular 17</li>
              <li>FastAPI</li>
              <li>Machine Learning</li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <p>&copy; 2026 FitPredict. All rights reserved.</p>
          <p>Developed with ❤️ for a healthier life</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background: var(--surface-light);
      border-top: 1px solid var(--border-color);
      margin-top: auto;
    }

    .footer-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
    }

    .footer-content {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .footer-section h3,
    .footer-section h4 {
      color: var(--primary-color);
      margin-top: 0;
      margin-bottom: 1rem;
      font-size: 1rem;
    }

    .footer-section p {
      color: var(--text-secondary);
      margin: 0 0 0.5rem 0;
      line-height: 1.5;
    }

    .footer-section ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .footer-section li {
      color: var(--text-secondary);
      margin-bottom: 0.45rem;
    }

    .footer-section a {
      color: var(--text-secondary);
      text-decoration: none;
      transition: color 0.2s ease, transform 0.2s ease;
      display: inline-flex;
    }

    .footer-section a:hover {
      color: var(--primary-color);
      transform: translateX(2px);
    }

    .footer-bottom {
      border-top: 1px solid var(--border-color);
      padding-top: 1.5rem;
      text-align: center;
    }

    .footer-bottom p {
      color: var(--text-secondary);
      margin: 0.5rem 0;
      font-size: 0.85rem;
    }

    @media (max-width: 640px) {
      .footer-container {
        padding: 1rem;
      }

      .footer-content {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }
    }
  `]
})
export class FooterComponent {}
