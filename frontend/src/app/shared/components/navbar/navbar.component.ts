import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LanguageService } from '../../../core/services/language.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <div class="navbar-container">
        <div class="navbar-brand">
          <a routerLink="/" class="brand-link" aria-label="Go to home page">
            <img src="assets/branding/fitpredict-logo.png" alt="FitPredict logo" class="brand-logo" />
          </a>
        </div>

        <ul class="nav-links">
          <li *ngIf="authService.isAuthenticated()">
            <a 
              routerLink="/prediction" 
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              class="nav-link">
              {{ languageService.t('nav.prediction') }}
            </a>
          </li>

          <li *ngIf="authService.isAuthenticated()">
            <a 
              routerLink="/workouts" 
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              class="nav-link">
              {{ languageService.t('nav.workouts') }}
            </a>
          </li>

          <li *ngIf="authService.isAuthenticated()">
            <a 
              routerLink="/recipes" 
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              class="nav-link">
              {{ languageService.t('nav.recipes') }}
            </a>
          </li>

          <li *ngIf="authService.isAuthenticated()">
            <a
              routerLink="/favorites"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              class="nav-link">
              ❤️ Favorites
            </a>
          </li>

          <li *ngIf="authService.isAuthenticated()">
            <a
              routerLink="/chatbot"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              class="nav-link">
              {{ languageService.t('nav.chatbot') }}
            </a>
          </li>
        </ul>

        <div class="auth-actions">
          <a *ngIf="!authService.isAuthenticated()" routerLink="/auth" class="auth-link">
            🔐 Login / Register
          </a>

          <div *ngIf="authService.isAuthenticated()" class="user-box">
            <span>👋 {{ authService.currentUser()?.name }}</span>
            <button type="button" (click)="logout()">Logout</button>
          </div>
        </div>
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

    .brand-logo {
      width: 172px;
      height: 62px;
      object-fit: contain;
      display: block;
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

    .auth-actions {
      min-width: max-content;
      display: flex;
      align-items: center;
    }

    .auth-link {
      text-decoration: none;
      color: #1f2e42;
      font-weight: 600;
      background: #eef4e5;
      border: 1px solid #d7e6c8;
      border-radius: 999px;
      padding: 0.45rem 0.8rem;
    }

    .user-box {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 0.9rem;
      color: var(--text-primary);
    }

    .user-box button {
      border: 1px solid #f7c3c3;
      background: #fee2e2;
      color: #991b1b;
      border-radius: 999px;
      padding: 0.35rem 0.7rem;
      cursor: pointer;
      font-weight: 600;
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

      .auth-actions {
        width: 100%;
        justify-content: center;
      }

      .nav-link {
        padding: 0.5rem 0.75rem;
        font-size: 0.9rem;
      }
    }
  `]
})
export class NavbarComponent {
  constructor(public languageService: LanguageService, public authService: AuthService) {}

  logout(): void {
    this.authService.logout();
  }
}
