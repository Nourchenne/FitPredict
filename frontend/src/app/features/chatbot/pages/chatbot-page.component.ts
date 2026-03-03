import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ChatRagResponse } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { ChatbotService } from '../../../core/services/chatbot.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

@Component({
  selector: 'app-chatbot-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="chatbot-page">
      <header class="hero">
        <p class="eyebrow">FitChat assistant</p>
        <h1>🤖 FitChat</h1>
        <p>
          Ask questions in English about prediction, workouts, recipes, app usage, and your own history.
        </p>
      </header>

      <div class="chat-surface">
        <div class="messages" *ngIf="messages().length; else emptyState">
          <article class="message" *ngFor="let message of messages()" [class.user]="message.role === 'user'">
            <p class="label">{{ message.role === 'user' ? 'You' : 'FitChat' }}</p>
            <pre>{{ message.text }}</pre>

          </article>
        </div>

        <ng-template #emptyState>
          <div class="empty-state">
            <h3>Start the conversation 👋</h3>
            <p>Examples: "How does obesity prediction work in this app?" or "Summarize my latest activity".</p>
          </div>
        </ng-template>

        <form class="composer" (ngSubmit)="sendQuestion()">
          <textarea
            [(ngModel)]="question"
            name="question"
            rows="3"
            maxlength="1000"
            placeholder="Ask your question..."
            [disabled]="isLoading()"></textarea>

          <div class="composer-footer">
            <small>{{ question.length }}/1000</small>
            <button type="submit" [disabled]="isLoading() || !question.trim()">
              {{ isLoading() ? 'Thinking...' : 'Ask chatbot' }}
            </button>
          </div>
        </form>
      </div>
    </section>
  `,
  styles: [`
    .chatbot-page {
      max-width: 1100px;
      margin: 0 auto;
      padding: 1.25rem 2rem 2rem;
      display: grid;
      gap: 1.2rem;
    }

    .hero {
      background: linear-gradient(140deg, #efd56f 0%, #f0cf59 65%, #e9bf3f 100%);
      border-radius: 14px;
      padding: 1.3rem 1.5rem;
      border: 1px solid #e4cf77;
      box-shadow: var(--shadow-soft);
    }

    .hero .eyebrow {
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #4f5f37;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .hero h1 {
      margin: 0.35rem 0;
      color: #1a2333;
    }

    .hero p {
      margin: 0;
      color: rgba(24, 33, 48, 0.74);
    }

    .chat-surface {
      border: 1px solid var(--border-color);
      border-radius: 14px;
      background: #fff;
      box-shadow: var(--shadow-soft);
      padding: 1rem;
      display: grid;
      gap: 1rem;
    }

    .messages {
      display: grid;
      gap: 0.9rem;
      max-height: 62vh;
      overflow: auto;
      padding-right: 0.35rem;
    }

    .message {
      border-radius: 12px;
      border: 1px solid #dfe5d4;
      background: #f8faf5;
      padding: 0.85rem;
    }

    .message.user {
      border-color: #d2dbe9;
      background: #f4f8ff;
    }

    .message .label {
      margin: 0 0 0.45rem;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .message pre {
      white-space: pre-wrap;
      margin: 0;
      font-family: inherit;
      color: var(--text-primary);
      line-height: 1.4;
    }

    .empty-state {
      border: 1px dashed #b8c3aa;
      border-radius: 12px;
      background: #f6f8f1;
      padding: 1rem;
      color: var(--text-secondary);
    }

    .empty-state h3 {
      margin: 0 0 0.35rem;
      color: var(--text-primary);
    }

    .empty-state p {
      margin: 0;
    }

    .composer {
      border-top: 1px solid var(--border-color);
      padding-top: 1rem;
      display: grid;
      gap: 0.55rem;
    }

    .composer textarea {
      width: 100%;
      resize: vertical;
      border: 1px solid #cfd8c2;
      border-radius: 10px;
      padding: 0.7rem 0.8rem;
      font-family: inherit;
      font-size: 0.95rem;
    }

    .composer textarea:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(107, 178, 82, 0.16);
    }

    .composer-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.8rem;
    }

    .composer-footer small {
      color: var(--text-muted);
    }

    .composer-footer button {
      border: none;
      border-radius: 999px;
      padding: 0.55rem 1rem;
      cursor: pointer;
      background: #68b250;
      color: #fff;
      font-weight: 700;
    }

    .composer-footer button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .chatbot-page {
        padding: 1rem;
      }
    }
  `]
})
export class ChatbotPageComponent {
  question = '';
  messages = signal<ChatMessage[]>([]);
  isLoading = signal(false);

  constructor(private chatbotService: ChatbotService, private authService: AuthService) {}

  sendQuestion(): void {
    const trimmed = this.question.trim();
    if (!trimmed || this.isLoading()) {
      return;
    }

    this.messages.update((previous) => [
      ...previous,
      { role: 'user', text: trimmed }
    ]);

    this.question = '';
    this.isLoading.set(true);

    this.chatbotService
      .askRag({
        question: trimmed,
        user_id: this.authService.currentUser()?.id,
        top_k: 4
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.messages.update((previous) => [
            ...previous,
            {
              role: 'assistant',
              text: response.answer
            }
          ]);
        },
        error: (err) => {
          const message = err?.message || 'Chatbot request failed.';
          this.messages.update((previous) => [
            ...previous,
            {
              role: 'assistant',
              text: `⚠️ ${message}`
            }
          ]);
        }
      });
  }
}
