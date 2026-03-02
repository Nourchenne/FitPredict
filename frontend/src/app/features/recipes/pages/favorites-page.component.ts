import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RecipeService } from '../../../core/services/recipe.service';

interface FavoriteRecipe {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  difficulty: string;
  prepTime: number;
  description: string;
  ingredients: string[];
  instructions: string[];
}

@Component({
  selector: 'app-favorites-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="favorites-page">
      <div class="header">
        <h1>❤️ My Favorite Recipes</h1>
        <p>Your liked recipes, in the same clear card view as the recipes page.</p>
      </div>

      <p *ngIf="loading" class="loading">Loading your favorites...</p>

      <div *ngIf="!loading && favorites.length === 0" class="empty">
        <h3>No favorites yet</h3>
        <p>Go to recipes, click “Add to favorites”, and build your personal healthy cookbook.</p>
        <a routerLink="/recipes" class="cta">Browse recipes</a>
      </div>

      <div *ngIf="!loading && favorites.length > 0" class="recipes-grid">
        <div *ngFor="let recipe of favorites" class="recipe-card">
          <div class="recipe-header">
            <h3>{{ recipe.name }}</h3>
            <span class="difficulty-badge" [ngClass]="'diff-' + recipe.difficulty.toLowerCase()">
              {{ recipe.difficulty }}
            </span>
          </div>

          <div class="nutrition-info">
            <div class="nutrition-item">
              <span class="nutrition-label">Calories</span>
              <span class="nutrition-value">{{ recipe.calories }}</span>
            </div>
            <div class="nutrition-item">
              <span class="nutrition-label">Protein</span>
              <span class="nutrition-value">{{ recipe.protein }}g</span>
            </div>
            <div class="nutrition-item">
              <span class="nutrition-label">Carbs</span>
              <span class="nutrition-value">{{ recipe.carbs }}g</span>
            </div>
            <div class="nutrition-item">
              <span class="nutrition-label">Fat</span>
              <span class="nutrition-value">{{ recipe.fat }}g</span>
            </div>
          </div>

          <div class="recipe-meta">
            <span>⏱️ {{ recipe.prepTime }} min</span>
            <span>👥 Portions: 2</span>
            <span class="likes">❤️ {{ getLikes(recipe.id) }} likes</span>
          </div>

          <p class="recipe-description">{{ recipe.description }}</p>

          <div class="ingredients-section">
            <h4>🛒 Ingredients:</h4>
            <ul>
              <li *ngFor="let ingredient of recipe.ingredients">{{ ingredient }}</li>
            </ul>
          </div>

          <div class="instructions-section">
            <h4>👨‍🍳 Instructions:</h4>
            <ol>
              <li *ngFor="let instruction of recipe.instructions">{{ instruction }}</li>
            </ol>
          </div>

          <button (click)="removeFavorite(recipe.id)" class="remove">💔 Remove from favorites</button>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .favorites-page {
      max-width: 1400px;
      margin: 0 auto;
      padding: 1.25rem 2rem 2rem;
    }

    .header {
      margin-bottom: 1.4rem;
      border-radius: 14px;
      padding: 1.4rem 1.6rem;
      background: linear-gradient(140deg, #efd56f 0%, #f0cf59 65%, #e9bf3f 100%);
      border: 1px solid #e4cf77;
      box-shadow: var(--shadow-soft);
    }

    .header h1 {
      margin: 0;
      color: #1a2333;
    }

    .header p {
      margin: 0.4rem 0 0;
      color: rgba(24, 33, 48, 0.72);
    }

    .loading {
      margin: 0 0 1rem;
      color: var(--text-secondary);
      font-weight: 600;
    }

    .empty {
      padding: 2rem;
      border-radius: 14px;
      border: 1px dashed #b8c3aa;
      background: #f6f8f1;
      text-align: center;
    }

    .empty h3 {
      margin-top: 0;
    }

    .cta {
      display: inline-block;
      margin-top: 0.8rem;
      text-decoration: none;
      background: var(--primary-color);
      color: #fff;
      border-radius: 999px;
      padding: 0.6rem 1rem;
      font-weight: 700;
    }

    .recipes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.2rem;
    }

    .recipe-card {
      background: var(--surface);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 1.5rem;
      box-shadow: var(--shadow-soft);
      transition: all 0.3s ease;
    }

    .recipe-card:hover {
      box-shadow: var(--shadow-hover);
      transform: translateY(-2px);
    }

    .recipe-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 1rem;
      gap: 1rem;
    }

    .recipe-card h3 {
      margin: 0;
      color: var(--text-primary);
      font-size: 1.3rem;
      flex: 1;
    }

    .difficulty-badge {
      padding: 0.3rem 0.8rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .diff-easy {
      background: #edf7e7;
      color: #2f5f1f;
    }

    .nutrition-info {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.5rem;
      margin: 1rem 0;
      padding: 1rem;
      background: var(--surface-light);
      border-radius: 8px;
    }

    .nutrition-item {
      text-align: center;
    }

    .nutrition-label {
      display: block;
      font-size: 0.75rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      font-weight: 600;
    }

    .nutrition-value {
      display: block;
      font-size: 1.1rem;
      color: var(--secondary-color);
      font-weight: 700;
    }

    .recipe-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
      font-size: 0.9rem;
      color: var(--text-secondary);
    }

    .likes {
      font-weight: 700;
      color: #b3261e;
    }

    .recipe-description {
      color: var(--text-secondary);
      margin-bottom: 1rem;
      line-height: 1.5;
    }

    .ingredients-section,
    .instructions-section {
      margin: 1rem 0;
    }

    .ingredients-section h4,
    .instructions-section h4 {
      margin: 0 0 0.5rem 0;
      color: var(--text-primary);
      font-size: 0.95rem;
    }

    .ingredients-section ul,
    .instructions-section ol {
      margin: 0;
      padding-left: 1.5rem;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .ingredients-section li,
    .instructions-section li {
      margin-bottom: 0.4rem;
      line-height: 1.4;
    }

    .remove {
      width: 100%;
      border: 1px solid #fecaca;
      background: #fee2e2;
      color: #991b1b;
      border-radius: 10px;
      padding: 0.75rem;
      font-weight: 700;
      cursor: pointer;
    }

    @media (max-width: 768px) {
      .favorites-page {
        padding: 1rem;
      }

      .recipes-grid {
        grid-template-columns: 1fr;
      }

      .nutrition-info {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class FavoritesPageComponent implements OnInit {
  loading = false;
  favorites: FavoriteRecipe[] = [];
  likesMap: Record<number, number> = {};

  constructor(private authService: AuthService, private recipeService: RecipeService) {}

  ngOnInit(): void {
    this.loadFavorites();
    this.loadLikes();
  }

  async removeFavorite(recipeId: number): Promise<void> {
    this.favorites = this.favorites.filter((recipe) => recipe.id !== recipeId);
    const key = this.authService.getUserScopedStorageKey('favoriteRecipes');
    localStorage.setItem(key, JSON.stringify(this.favorites));

    const user = this.authService.currentUser();
    if (user) {
      try {
        await this.recipeService.removeFavorite(user.id, recipeId);
        await this.loadLikes();
      } catch {
        // local data already updated
      }
    }
  }

  getLikes(recipeId: number): number {
    return this.likesMap[recipeId] || 0;
  }

  private async loadFavorites(): Promise<void> {
    this.loading = true;
    const user = this.authService.currentUser();

    if (user) {
      try {
        this.favorites = await this.recipeService.getFavorites(user.id);
        const key = this.authService.getUserScopedStorageKey('favoriteRecipes');
        localStorage.setItem(key, JSON.stringify(this.favorites));
        this.loading = false;
        return;
      } catch {
        // fallback to local
      }
    }

    const key = this.authService.getUserScopedStorageKey('favoriteRecipes');
    const stored = localStorage.getItem(key);
    this.favorites = stored ? JSON.parse(stored) : [];
    this.loading = false;
  }

  private async loadLikes(): Promise<void> {
    try {
      this.likesMap = await this.recipeService.getLikesMap();
    } catch {
      this.likesMap = {};
    }
  }
}
