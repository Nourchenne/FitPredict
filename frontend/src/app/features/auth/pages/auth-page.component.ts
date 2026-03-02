import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-page">
      <div class="auth-surface">
        <div class="intro">
          <p class="eyebrow">Welcome to FitPredict</p>
          <h1>Health guidance made personal.</h1>
          <p>
            Create an account to unlock prediction history, workout tracking, and your own favorite recipes list.
          </p>
          <ul>
            <li>📈 Keep your weight prediction history</li>
            <li>✅ Track completed exercises</li>
            <li>❤️ Save and revisit favorite recipes</li>
          </ul>
          <a routerLink="/" class="back-link">← Back to home</a>
        </div>

        <div class="card">
          <p class="card-title">🔐 Access your wellness space</p>
          <div class="switcher">
            <button type="button" [class.active]="mode() === 'login'" (click)="setMode('login')">Login</button>
            <button type="button" [class.active]="mode() === 'register'" (click)="setMode('register')">Create account</button>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div *ngIf="mode() === 'register'" class="form-group">
              <label for="name">Full name</label>
              <input id="name" formControlName="name" placeholder="Enter your full name" />
              <small>Use your real name to personalize your dashboard.</small>
            </div>

            <div class="form-group">
              <label for="email">Email</label>
              <input id="email" type="email" formControlName="email" placeholder="you@example.com" />
              <small>We use this to identify your account and save your progress.</small>
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <input id="password" type="password" formControlName="password" placeholder="At least 6 characters" />
              <small>Minimum 6 characters.</small>
            </div>

            <p *ngIf="error()" class="error-box">{{ error() }}</p>
            <p *ngIf="success()" class="success-box">{{ success() }}</p>

            <button type="submit" class="submit-btn" [disabled]="form.invalid">
              {{ mode() === 'login' ? 'Sign in' : 'Create my account' }}
            </button>
          </form>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .auth-page {
      max-width: 1400px;
      margin: 0 auto;
      padding: 1.25rem 2rem 2rem;
    }

    .auth-surface {
      display: grid;
      grid-template-columns: 1.1fr 1fr;
      border-radius: 18px;
      overflow: hidden;
      border: 1px solid #e4cf77;
      box-shadow: var(--shadow-soft);
      background: linear-gradient(140deg, #efd56f 0%, #f0cf59 65%, #e9bf3f 100%);
    }

    .intro {
      padding: 2rem;
      color: #1a2333;
    }

    .eyebrow {
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.75rem;
      color: rgba(26, 35, 51, 0.75);
      font-weight: 700;
    }

    .intro h1 {
      margin: 0.6rem 0;
      font-size: clamp(1.7rem, 4vw, 2.7rem);
      line-height: 1.15;
    }

    .intro p {
      margin: 0;
      color: rgba(26, 35, 51, 0.78);
    }

    .intro ul {
      margin: 1.2rem 0 1.5rem;
      padding-left: 1rem;
      display: grid;
      gap: 0.5rem;
      color: rgba(26, 35, 51, 0.9);
    }

    .back-link {
      text-decoration: none;
      color: #27354d;
      font-weight: 600;
    }

    .card {
      background: rgba(255, 255, 255, 0.92);
      padding: 1.5rem;
      display: grid;
      gap: 1rem;
    }

    .card-title {
      margin: 0;
      color: var(--text-primary);
      font-weight: 700;
      font-size: 1rem;
    }

    .switcher {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.6rem;
      padding: 0.35rem;
      border-radius: 12px;
      background: #f3f6ec;
      border: 1px solid #dce7cd;
    }

    .switcher button {
      border: none;
      background: transparent;
      border-radius: 8px;
      padding: 0.65rem;
      cursor: pointer;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .switcher button.active {
      background: #fff;
      color: var(--primary-dark);
      box-shadow: 0 6px 16px -14px rgba(54, 65, 39, 0.6);
    }

    form {
      display: grid;
      gap: 0.9rem;
    }

    .form-group label {
      font-size: 0.85rem;
      color: var(--text-primary);
      font-weight: 600;
      margin-bottom: 0.35rem;
    }

    .form-group small {
      color: var(--text-muted);
      font-size: 0.78rem;
      margin-top: 0.3rem;
      display: block;
    }

    .error-box,
    .success-box {
      margin: 0;
      border-radius: 10px;
      padding: 0.7rem;
      font-size: 0.9rem;
    }

    .error-box {
      background: #fee2e2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }

    .success-box {
      background: #eef7e6;
      border: 1px solid #d7eac4;
      color: #2f5f1f;
    }

    .submit-btn {
      width: 100%;
      border: none;
      border-radius: 10px;
      padding: 0.8rem;
      background: var(--primary-color);
      color: #fff;
      font-weight: 700;
      cursor: pointer;
    }

    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    @media (max-width: 900px) {
      .auth-surface {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .auth-page {
        padding: 1rem;
      }
    }
  `]
})
export class AuthPageComponent {
  mode = signal<AuthMode>('login');
  error = signal<string>('');
  success = signal<string>('');

  form = this.fb.group({
    name: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  private readonly redirectTo = computed(() => this.route.snapshot.queryParamMap.get('redirect') || '/prediction');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    if (this.authService.isAuthenticated()) {
      this.router.navigateByUrl(this.redirectTo());
    }
  }

  setMode(mode: AuthMode): void {
    this.mode.set(mode);
    this.error.set('');
    this.success.set('');
  }

  async submit(): Promise<void> {
    this.error.set('');
    this.success.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.mode() === 'register') {
      const name = this.form.value.name?.trim();
      if (!name) {
        this.error.set('Please enter your full name.');
        return;
      }

      const result = await this.authService.register({
        name,
        email: this.form.value.email!,
        password: this.form.value.password!
      });

      if (!result.success) {
        this.error.set(result.message);
        return;
      }

      this.success.set(result.message);
      this.router.navigateByUrl(this.redirectTo());
      return;
    }

    const result = await this.authService.login({
      email: this.form.value.email!,
      password: this.form.value.password!
    });

    if (!result.success) {
      this.error.set(result.message);
      return;
    }

    this.success.set(result.message);
    this.router.navigateByUrl(this.redirectTo());
  }
}
