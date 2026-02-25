import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <div class="navbar-container">
        <div class="navbar-brand">
          <a routerLink="/" class="brand-link" aria-label="Go to home page">
            <span class="brand-emoji">🏠</span>
            <span class="brand-text">FitPredict</span>
          </a>
        </div>

        <ul class="nav-links">
          <li>
            <a 
              routerLink="/" 
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              class="nav-link">
              {{ languageService.t('nav.home') }}
            </a>
          </li>
          <li>
            <a 
              routerLink="/prediction" 
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              class="nav-link">
              {{ languageService.t('nav.prediction') }}
            </a>
          </li>
          <li>
            <a 
              routerLink="/workouts" 
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              class="nav-link">
              {{ languageService.t('nav.workouts') }}
            </a>
          </li>
          <li>
            <a 
              routerLink="/recipes" 
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              class="nav-link">
              {{ languageService.t('nav.recipes') }}
            </a>
          </li>
        </ul>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 6px 20px -18px rgba(54, 65, 39, 0.55);
    }

    .navbar-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 2rem;
    }

    .navbar-brand {
      display: flex;
      align-items: center;
      font-size: 1.25rem;
      font-weight: 700;
      min-width: max-content;
    }

    .brand-link {
      display: inline-flex;
      align-items: center;
      gap: 0.65rem;
      color: var(--primary-color);
      text-decoration: none;
    }

    .brand-link:hover {
      opacity: 0.9;
    }

    .brand-emoji {
      font-size: 1.5rem;
    }

    .nav-links {
      list-style: none;
      display: flex;
      gap: 0.9rem;
      margin: 0;
      padding: 0;
      flex: 1;
      flex-wrap: wrap;
    }

    .nav-link {
      color: var(--text-secondary);
      text-decoration: none;
      font-weight: 500;
      padding: 0.5rem 0.9rem;
      border-radius: 999px;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .nav-link:hover {
      color: var(--primary-color);
      background: var(--surface-light);
    }

    .nav-link.active {
      color: var(--primary-color);
      background: #eef4e5;
      box-shadow: inset 0 0 0 1px #d7e6c8;
    }

    .language-selector {
      min-width: max-content;
    }

    .language-dropdown {
      padding: 0.5rem 1rem;
      background: var(--surface-light);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      color: var(--text-primary);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .language-dropdown:hover {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(107, 178, 82, 0.16);
    }

    .language-dropdown:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(107, 178, 82, 0.16);
    }

    @media (max-width: 768px) {
      .navbar-container {
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
      }

      .nav-links {
        gap: 1rem;
        justify-content: center;
        flex: none;
      }

      .nav-link {
        padding: 0.5rem 0.75rem;
        font-size: 0.9rem;
      }
    }
  `]
})
export class NavbarComponent {
  constructor(public languageService: LanguageService) {}
}
