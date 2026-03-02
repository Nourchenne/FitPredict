import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RecipeService } from '../../../core/services/recipe.service';

interface Recipe {
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
  selector: 'app-recipes-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="recipes-container">
      <div class="recipes-header">
        <h1>🍽️ Healthy Recipes - FitPredict</h1>
        <p>Delicious and nutritious recipes for your wellness</p>
        <a routerLink="/favorites" class="favorites-link">❤️ View my favorites</a>
      </div>

      <div class="recipes-grid">
        <div *ngFor="let recipe of recipes" class="recipe-card">
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

          <button class="btn-success" [class.active]="isFavorite(recipe.id)" (click)="saveFavorite(recipe)">
            {{ isFavorite(recipe.id) ? '💔 Remove from favorites' : '❤️ Add to favorites' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .recipes-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 1.25rem 2rem 2rem;
    }

    .recipes-header {
      margin-bottom: 2rem;
      border-radius: 14px;
      padding: 1.4rem 1.6rem;
      background: linear-gradient(140deg, #efd56f 0%, #f0cf59 65%, #e9bf3f 100%);
      border: 1px solid #e4cf77;
      box-shadow: var(--shadow-soft);
    }

    .recipes-header h1 {
      font-size: clamp(1.7rem, 4vw, 2.4rem);
      color: #1a2333;
      margin-bottom: 0.5rem;
    }

    .recipes-header p {
      color: rgba(24, 33, 48, 0.72);
      font-size: 1rem;
      margin: 0;
    }

    .favorites-link {
      margin-top: 0.85rem;
      display: inline-flex;
      text-decoration: none;
      color: #1a2333;
      font-weight: 700;
      background: rgba(255, 255, 255, 0.55);
      border: 1px solid rgba(255, 255, 255, 0.7);
      border-radius: 999px;
      padding: 0.45rem 0.9rem;
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

    .btn-success {
      width: 100%;
      padding: 0.75rem;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-top: 1rem;
    }

    .btn-success:hover {
      background: var(--primary-dark);
      transform: translateY(-1px);
    }

    .btn-success.active {
      background: #991b1b;
    }

    @media (max-width: 768px) {
      .recipes-grid {
        grid-template-columns: 1fr;
      }

      .nutrition-info {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class RecipesPageComponent implements OnInit {
  private readonly favoritesStorageKey: string;
  private favoriteRecipeIds = new Set<number>();
  likesMap: Record<number, number> = {};

  constructor(private authService: AuthService, private recipeService: RecipeService) {
    this.favoritesStorageKey = this.authService.getUserScopedStorageKey('favoriteRecipes');
  }

  ngOnInit(): void {
    this.loadFavorites();
    this.loadLikes();
  }

  recipes: Recipe[] = [
    {
      id: 1,
      name: 'Quinoa & Vegetable Salad',
      calories: 280,
      protein: 12,
      carbs: 35,
      fat: 10,
      difficulty: 'Easy',
      prepTime: 10,
      description: 'Complete protein salad packed with antioxidants. Quinoa provides all 9 amino acids making it perfect for muscle recovery!',
      ingredients: ['150g cooked quinoa', '1 cucumber', '2 tomatoes', '1/4 avocado', '2 tbsp olive oil', '1 lemon juice'],
      instructions: ['Cook quinoa and let cool', 'Dice vegetables', 'Mix everything', 'Season and serve']
    },
    {
      id: 2,
      name: 'Grilled Protein Chicken',
      calories: 320,
      protein: 45,
      carbs: 15,
      fat: 8,
      difficulty: 'Easy',
      prepTime: 20,
      description: 'High-protein grilled chicken with nutrient-dense vegetables. Excellent post-workout meal for muscle building!',
      ingredients: ['200g chicken breast', 'broccoli', 'carrots', 'olive oil', 'garlic', 'herbs'],
      instructions: ['Season chicken', 'Sear both sides', 'Bake with vegetables', 'Serve hot']
    },
    {
      id: 3,
      name: 'Acai Health Bowls',
      calories: 350,
      protein: 15,
      carbs: 50,
      fat: 12,
      difficulty: 'Easy',
      prepTime: 5,
      description: 'Antioxidant superpower breakfast loaded with superfoods and energy-boosting ingredients!',
      ingredients: ['acai puree', 'almond milk', 'banana', 'granola', 'blueberries', 'coconut'],
      instructions: ['Blend acai base', 'Pour in bowl', 'Top with fruits and granola', 'Serve immediately']
    },
    {
      id: 4,
      name: 'Light Whole Wheat Pasta',
      calories: 400,
      protein: 18,
      carbs: 55,
      fat: 10,
      difficulty: 'Easy',
      prepTime: 15,
      description: 'Wholesome pasta loaded with vegetables and rich tomato flavor. Fiber-packed for sustained energy!',
      ingredients: ['whole wheat pasta', 'tomato sauce', 'onion', 'garlic', 'peppers', 'mushrooms'],
      instructions: ['Cook pasta al dente', 'Prepare vegetable sauce', 'Combine and finish with basil']
    },
    {
      id: 5,
      name: 'Protein Fried Eggs',
      calories: 180,
      protein: 16,
      carbs: 8,
      fat: 10,
      difficulty: 'Easy',
      prepTime: 8,
      description: 'Classic high-protein breakfast that takes 8 minutes. Perfect for quick morning nutrition!',
      ingredients: ['2 eggs', 'whole grain bread', 'spinach', 'tomato', 'olive oil'],
      instructions: ['Sauté veggies', 'Cook eggs', 'Toast bread', 'Assemble and serve']
    },
    {
      id: 6,
      name: 'Green Detox Smoothie',
      calories: 220,
      protein: 8,
      carbs: 35,
      fat: 5,
      difficulty: 'Easy',
      prepTime: 3,
      description: 'Nutrient-dense green smoothie packed with vitamins and minerals for energy and detoxification!',
      ingredients: ['almond milk', 'spinach', 'banana', 'green apple', 'spirulina', 'honey'],
      instructions: ['Blend greens first', 'Add fruits and spirulina', 'Blend smooth and serve chilled']
    },
    {
      id: 7,
      name: 'Salmon Avocado Bowl',
      calories: 430,
      protein: 34,
      carbs: 22,
      fat: 22,
      difficulty: 'Easy',
      prepTime: 18,
      description: 'Omega-3 rich bowl perfect for heart health and satiety with balanced macros.',
      ingredients: ['salmon fillet', 'avocado', 'brown rice', 'cucumber', 'sesame seeds', 'lemon'],
      instructions: ['Cook rice', 'Sear salmon', 'Prepare toppings', 'Assemble bowl and serve']
    },
    {
      id: 8,
      name: 'Turkey Wrap Power',
      calories: 360,
      protein: 30,
      carbs: 32,
      fat: 12,
      difficulty: 'Easy',
      prepTime: 12,
      description: 'A quick high-protein wrap ideal for lunch with crunchy veggies and yogurt sauce.',
      ingredients: ['whole wheat tortilla', 'turkey slices', 'yogurt sauce', 'lettuce', 'tomato', 'onion'],
      instructions: ['Warm tortilla', 'Add sauce and filling', 'Wrap tightly', 'Slice and enjoy']
    },
    {
      id: 9,
      name: 'Overnight Oats Deluxe',
      calories: 310,
      protein: 14,
      carbs: 42,
      fat: 9,
      difficulty: 'Easy',
      prepTime: 6,
      description: 'Creamy breakfast prep loaded with fiber and stable energy for the morning.',
      ingredients: ['rolled oats', 'milk', 'chia seeds', 'cinnamon', 'berries', 'honey'],
      instructions: ['Mix ingredients in jar', 'Refrigerate overnight', 'Add berries and serve']
    },
    {
      id: 10,
      name: 'Mediterranean Chickpea Bowl',
      calories: 390,
      protein: 17,
      carbs: 44,
      fat: 14,
      difficulty: 'Easy',
      prepTime: 14,
      description: 'Fiber-rich vegetarian bowl with chickpeas, crisp vegetables, and lemon-herb dressing.',
      ingredients: ['chickpeas', 'cucumber', 'tomato', 'red onion', 'olive oil', 'lemon juice', 'parsley'],
      instructions: ['Rinse chickpeas', 'Chop vegetables', 'Prepare dressing', 'Mix and serve chilled']
    },
    {
      id: 11,
      name: 'Tuna Sweet Potato Plate',
      calories: 410,
      protein: 33,
      carbs: 38,
      fat: 13,
      difficulty: 'Easy',
      prepTime: 20,
      description: 'Balanced plate with lean tuna protein and complex carbs from roasted sweet potatoes.',
      ingredients: ['tuna steak', 'sweet potato', 'green beans', 'olive oil', 'pepper', 'garlic powder'],
      instructions: ['Roast sweet potato cubes', 'Sear tuna', 'Steam green beans', 'Plate with seasoning']
    },
    {
      id: 12,
      name: 'Lentil Protein Soup',
      calories: 330,
      protein: 20,
      carbs: 42,
      fat: 8,
      difficulty: 'Easy',
      prepTime: 25,
      description: 'Comforting lentil soup high in protein and minerals, perfect for recovery dinners.',
      ingredients: ['red lentils', 'carrot', 'celery', 'onion', 'tomato paste', 'vegetable broth'],
      instructions: ['Sauté aromatics', 'Add lentils and broth', 'Simmer 20 minutes', 'Blend lightly and serve']
    },
    {
      id: 13,
      name: 'Greek Yogurt Berry Parfait',
      calories: 260,
      protein: 19,
      carbs: 28,
      fat: 7,
      difficulty: 'Easy',
      prepTime: 6,
      description: 'High-protein snack layered with fresh berries and crunchy seeds for satiety.',
      ingredients: ['greek yogurt', 'strawberries', 'blueberries', 'chia seeds', 'pumpkin seeds', 'honey'],
      instructions: ['Layer yogurt and fruits', 'Add seeds between layers', 'Finish with a little honey']
    },
    {
      id: 14,
      name: 'Shrimp Veggie Stir-Fry',
      calories: 370,
      protein: 31,
      carbs: 30,
      fat: 12,
      difficulty: 'Easy',
      prepTime: 16,
      description: 'Fast stir-fry with shrimp and colorful veggies for a light but filling dinner.',
      ingredients: ['shrimp', 'broccoli', 'bell peppers', 'zucchini', 'soy sauce', 'ginger', 'garlic'],
      instructions: ['Sauté shrimp quickly', 'Cook vegetables on high heat', 'Add sauce', 'Serve immediately']
    }
  ];

  async saveFavorite(recipe: Recipe): Promise<void> {
    const user = this.authService.currentUser();
    const favorites = this.readFavorites();
    const existing = favorites.find((item: Recipe) => item.id === recipe.id);

    if (existing) {
      const updated = favorites.filter((item: Recipe) => item.id !== recipe.id);
      this.persistFavorites(updated);
      this.likesMap[recipe.id] = Math.max((this.likesMap[recipe.id] || 1) - 1, 0);

      if (user) {
        try {
          await this.recipeService.removeFavorite(user.id, recipe.id);
          await this.loadLikes();
        } catch {
          // fallback already persisted locally
        }
      }

      alert(`${recipe.name} removed from favorites.`);
      return;
    }

    const updated = [recipe, ...favorites];
    this.persistFavorites(updated);
    this.likesMap[recipe.id] = (this.likesMap[recipe.id] || 0) + 1;

    if (user) {
      try {
        await this.recipeService.addFavorite(user.id, {
          recipe_id: recipe.id,
          recipe
        });
        await this.loadLikes();
      } catch {
        // fallback already persisted locally
      }
    }

    alert(`${recipe.name} added to favorites! ❤️`);
  }

  isFavorite(recipeId: number): boolean {
    return this.favoriteRecipeIds.has(recipeId);
  }

  getLikes(recipeId: number): number {
    return this.likesMap[recipeId] || 0;
  }

  private async loadFavorites(): Promise<void> {
    const user = this.authService.currentUser();
    if (user) {
      try {
        const apiFavorites = await this.recipeService.getFavorites(user.id);
        this.favoriteRecipeIds = new Set(apiFavorites.map((item: Recipe) => item.id));
        localStorage.setItem(this.favoritesStorageKey, JSON.stringify(apiFavorites));
        return;
      } catch {
        // fallback to local
      }
    }

    const favorites = this.readFavorites();
    this.favoriteRecipeIds = new Set(favorites.map((item: Recipe) => item.id));
  }

  private async loadLikes(): Promise<void> {
    try {
      this.likesMap = await this.recipeService.getLikesMap();
    } catch {
      this.likesMap = {};
    }
  }

  private readFavorites(): Recipe[] {
    const raw = localStorage.getItem(this.favoritesStorageKey);
    return raw ? JSON.parse(raw) : [];
  }

  private persistFavorites(favorites: Recipe[]): void {
    localStorage.setItem(this.favoritesStorageKey, JSON.stringify(favorites));
    this.favoriteRecipeIds = new Set(favorites.map((item) => item.id));
  }
}
