import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="home-page">
      <div class="hero-surface">
        <div class="hero-content">
          <h1>
            <span class="accent">Healthy</span> Insights at<br />
            your <strong>Doorstep</strong>
          </h1>
          <p class="subtitle">
            FitPredict helps you estimate obesity level, track your progress over time, complete workout sessions, and save favorite healthy recipes.
          </p>

          <p class="public-note" *ngIf="!authService.isAuthenticated()">
            🌍 This page is public for everyone. Create an account or login to start using prediction, workouts, history, and favorites.
          </p>

          <div class="cta-row">
            <a *ngIf="authService.isAuthenticated(); else authCallToAction" routerLink="/prediction" class="cta cta-primary">Start assessment</a>
            <ng-template #authCallToAction>
              <a routerLink="/auth" class="cta cta-primary">Create account / Login</a>
            </ng-template>

            <a *ngIf="authService.isAuthenticated(); else discoverApp" routerLink="/workouts" class="cta cta-dark">View plans</a>
            <ng-template #discoverApp>
              <a routerLink="/auth" class="cta cta-dark">Unlock all features</a>
            </ng-template>
          </div>

          <div class="stats-row">
            <div class="stat-item">
              <span class="stat-value">01</span>
              <span class="stat-label">Prediction engine</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">03</span>
              <span class="stat-label">Main modules</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">24/7</span>
              <span class="stat-label">Self-service access</span>
            </div>
          </div>
        </div>

        <div class="hero-visual" aria-hidden="true">
          <div class="basket">🥕🥦🫑</div>
        </div>
      </div>

      <div class="benefits-strip">
        <article class="benefit-card fresh">
          <h3>Smart prediction</h3>
          <p>Instant obesity-level estimation using your lifestyle and physical profile.</p>
        </article>

        <article class="benefit-card organic">
          <h3>Personalized workouts</h3>
          <p>Practical activity suggestions tailored to your current condition.</p>
        </article>

        <article class="benefit-card delivery">
          <h3>Healthy recipes</h3>
          <p>Nutrition support with easy meal ideas aligned with your goals.</p>
        </article>
      </div>
    </section>
  `,
  styles: [`
    .home-page {
      max-width: 1400px;
      margin: 0 auto;
      padding: 1.25rem 2rem 2rem;
      display: grid;
      gap: 0;
    }

    .hero-surface {
      background: linear-gradient(140deg, #efd56f 0%, #f0cf59 65%, #e9bf3f 100%);
      border-radius: 14px 14px 0 0;
      padding: 2rem 2rem 2.2rem;
      display: grid;
      grid-template-columns: 1.25fr 1fr;
      gap: 1.5rem;
      overflow: hidden;
      position: relative;
      box-shadow: var(--shadow-soft);
    }

    .hero-surface::after {
      content: '';
      position: absolute;
      right: -100px;
      top: -80px;
      width: 380px;
      height: 380px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.32) 0%, rgba(255, 255, 255, 0.04) 65%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
    }

    .hero-content {
      z-index: 2;
    }

    h1 {
      margin: 0;
      color: #182130;
      font-size: clamp(2rem, 5vw, 4rem);
      line-height: 1.08;
      letter-spacing: -0.02em;
    }

    h1 .accent {
      color: #67b050;
      font-weight: 700;
    }

    h1 strong {
      font-weight: 800;
    }

    .subtitle {
      margin: 1rem 0 0;
      max-width: 640px;
      color: rgba(24, 33, 48, 0.68);
      font-size: 1.05rem;
    }

    .public-note {
      margin: 0.9rem 0 0;
      max-width: 700px;
      color: rgba(24, 33, 48, 0.84);
      font-size: 0.95rem;
      font-weight: 600;
    }

    .cta-row {
      margin-top: 1.7rem;
      display: flex;
      gap: 0.8rem;
      flex-wrap: wrap;
    }

    .cta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.82rem 1.5rem;
      border-radius: 999px;
      text-decoration: none;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      transition: transform 0.2s ease, opacity 0.2s ease;
    }

    .cta:hover {
      transform: translateY(-1px);
      opacity: 0.94;
    }

    .cta-primary {
      background: #68b250;
      color: white;
    }

    .cta-dark {
      background: #1b2a3d;
      color: #fff;
    }

    .stats-row {
      margin-top: 2rem;
      display: flex;
      flex-wrap: wrap;
      gap: 1.6rem;
    }

    .stat-item {
      display: flex;
      align-items: baseline;
      gap: 0.6rem;
      color: #192233;
    }

    .stat-value {
      font-size: clamp(1.9rem, 3.5vw, 3rem);
      font-weight: 800;
      line-height: 1;
    }

    .stat-label {
      font-size: 0.9rem;
      font-weight: 600;
      color: rgba(25, 34, 51, 0.82);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .hero-visual {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .basket {
      font-size: clamp(4rem, 10vw, 8rem);
      transform: rotate(-10deg);
      filter: saturate(1.1);
      z-index: 2;
    }

    .benefits-strip {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      border-radius: 0 0 14px 14px;
      overflow: hidden;
      box-shadow: var(--shadow-soft);
    }

    .benefit-card {
      padding: 1.4rem 1.5rem;
      color: #fff;
      min-height: 130px;
    }

    .benefit-card h3 {
      margin: 0 0 0.45rem;
      font-size: 1.05rem;
      color: #fff;
    }

    .benefit-card p {
      margin: 0;
      color: rgba(255, 255, 255, 0.92);
      font-size: 0.98rem;
    }

    .benefit-card.fresh {
      background: #6ab353;
    }

    .benefit-card.organic {
      background: #334427;
    }

    .benefit-card.delivery {
      background: #f86a06;
    }

    @media (max-width: 1024px) {
      .hero-surface {
        grid-template-columns: 1fr;
      }

      .hero-visual {
        justify-content: flex-start;
      }

      .benefits-strip {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .home-page {
        padding: 1rem 1rem 1.5rem;
      }

      .hero-surface {
        padding: 1.5rem;
      }

      .stats-row {
        gap: 1rem;
      }

      .stat-item {
        width: calc(50% - 0.5rem);
      }
    }
  `]
})
export class HomePageComponent {
  constructor(public authService: AuthService) {}
}
