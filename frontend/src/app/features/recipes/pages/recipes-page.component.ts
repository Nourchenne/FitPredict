import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  imports: [CommonModule],
  template: `
    <div class="recipes-container">
      <div class="recipes-header">
        <h1>🍽️ Healthy Recipes - FitPredict</h1>
        <p>Delicious and nutritious recipes for your wellness</p>
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

          <button class="btn-success" (click)="saveFavorite(recipe)">❤️ Add to favorites</button>
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

    .diff-facile {
      background: #edf7e7;
      color: #2f5f1f;
    }

    .diff-moyen {
      background: #fff3d2;
      color: #7a4f16;
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
      gap: 1rem;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
      font-size: 0.9rem;
      color: var(--text-secondary);
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
export class RecipesPageComponent {
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
      ingredients: [
        '150g cooked quinoa (cooled)',
        '1 cucumber (diced)',
        '2 fresh tomatoes (chopped)',
        '1/4 ripe avocado (sliced)',
        '2 tbsp extra virgin olive oil',
        '1 fresh lemon (juiced)',
        'Sea salt and black pepper to taste',
        'Optional: fresh cilantro or parsley'
      ],
      instructions: [
        'Cook quinoa (1:2 ratio with water) for 15 minutes, then let cool',
        'Finely dice cucumber and tomatoes while grains cool',
        'In large bowl, combine cooled quinoa with vegetables',
        'Whisk olive oil and lemon juice for dressing',
        'Toss salad gently and season to taste',
        'Add avocado just before serving to prevent browning'
      ]
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
      ingredients: [
        '200g boneless chicken breast (6oz)',
        '200g fresh broccoli florets',
        '100g carrots (sliced)',
        '2 teaspoons extra virgin olive oil',
        '3 cloves garlic (minced)',
        'Sea salt and black pepper',
        'Fresh Herbs of Provence to taste'
      ],
      instructions: [
        'Preheat oven to 200°C (400°F)',
        'Season chicken thoroughly with herbs, salt, and pepper',
        'Heat olive oil in pan, sear chicken 3 minutes per side for color',
        'Arrange vegetables on baking sheet with chicken',
        'Bake 20-25 minutes until chicken reaches 75°C internal temp',
        'Drizzle with garlic-infused olive oil and serve hot'
      ]
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
      ingredients: [
        '100g premium acai puree (unsweetened)',
        '100ml unsweetened almond milk',
        '1 ripe banana',
        '50g homemade granola mix',
        '30g fresh blueberries',
        '20g unsweetened coconut flakes',
        '1 tablespoon raw honey'
      ],
      instructions: [
        'Blend acai puree with almond milk until smooth consistency',
        'Pour mixture into bowl and create a thick base',
        'Arrange banana slices artistically on surface',
        'Sprinkle granola, blueberries, and coconut',
        'Drizzle generously with raw honey for natural sweetness',
        'Serve immediately while acai is still frozen-solid'
      ]
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
      ingredients: [
        '150g whole wheat pasta (dry)',
        '300g organic tomato sauce (low sodium)',
        '1 medium onion (diced)',
        '2 cloves fresh garlic (minced)',
        '100g colorful bell peppers (assorted)',
        '50g mushrooms (sliced)',
        '30g grated parmesan cheese',
        'Fresh basil (optional)'
      ],
      instructions: [
        'Bring water to boil and cook pasta until al dente (10-12 min)',
        'Meanwhile, sauté onion and garlic in olive oil for flavor base',
        'Add bell peppers and mushrooms, cook 3-4 minutes',
        'Stir in tomato sauce and simmer for 5 minutes',
        'Drain pasta (reserve 1 cup pasta water)',
        'Combine pasta with sauce, add pasta water if needed',
        'Finish with fresh basil and parmesan cheese'
      ]
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
      ingredients: [
        '2 large organic free-range eggs',
        '1 slice whole grain bread',
        '100g fresh baby spinach',
        '1 medium tomato',
        '1 teaspoon extra virgin olive oil',
        'Sea salt and cracked black pepper',
        'Optional: fresh herbs (oregano, chives)'
      ],
      instructions: [
        'Heat olive oil in non-stick skillet over medium heat',
        'Add spinach and tomato, sauté for 2-3 minutes until wilted',
        'Carefully crack both eggs into the pan with vegetables',
        'Cook on medium heat for 4-5 minutes until whites set completely',
        'Toast bread while eggs cook for structural support',
        'Slide everything onto toast, season generously, and serve hot'
      ]
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
      ingredients: [
        '200ml unsweetened almond milk',
        '150g fresh green spinach (packed)',
        '1 ripe banana',
        '1/2 Granny Smith green apple (cored)',
        '1 tablespoon premium spirulina powder',
        '1 tablespoon raw honey (natural sweetener)',
        '8-10 ice cubes (for thickness)'
      ],
      instructions: [
        'Add almond milk and spinach to blender first',
        'Blend 30 seconds to break down spinach fibers',
        'Add banana, apple, spirulina, and honey',
        'Blend at high speed for 2 minutes until completely smooth',
        'Add ice cubes and blend for additional 30 seconds',
        'Serve immediately in chilled glass for best taste'
      ]
    }
  ];

  saveFavorite(recipe: Recipe) {
    alert(`${recipe.name} added to favorites! \u2764️`);
  }
}
