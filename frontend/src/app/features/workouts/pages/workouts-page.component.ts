import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Workout {
  id: number;
  name: string;
  duration: number;
  difficulty: string;
  calories: number;
  description: string;
  exercises: string[];
}

@Component({
  selector: 'app-workouts-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="workouts-container">
      <div class="workouts-header">
        <h1>💪 FitPredict Training Programs</h1>
        <p>Discover our personalized programs tailored to your level</p>
      </div>

      <div class="workouts-grid">
        <div *ngFor="let workout of workouts" class="workout-card">
          <div class="workout-badge" [ngClass]="'difficulty-' + workout.difficulty.toLowerCase()">
            {{ workout.difficulty }}
          </div>
          <h3>{{ workout.name }}</h3>
          <div class="workout-stats">
            <div class="stat">
              <span class="stat-icon">⏱️</span>
              <span>{{ workout.duration }} min</span>
            </div>
            <div class="stat">
              <span class="stat-icon">🔥</span>
              <span>~{{ workout.calories }} kcal</span>
            </div>
          </div>
          <p class="workout-description">{{ workout.description }}</p>
          <div class="exercises">
            <h4>Included exercises:</h4>
            <ul>
              <li *ngFor="let exercise of workout.exercises">✓ {{ exercise }}</li>
            </ul>
          </div>
          <button class="btn-primary" (click)="startWorkout(workout)">Start</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .workouts-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 1.25rem 2rem 2rem;
    }

    .workouts-header {
      margin-bottom: 2rem;
      border-radius: 14px;
      padding: 1.4rem 1.6rem;
      background: linear-gradient(140deg, #efd56f 0%, #f0cf59 65%, #e9bf3f 100%);
      border: 1px solid #e4cf77;
      box-shadow: var(--shadow-soft);
    }

    .workouts-header h1 {
      font-size: clamp(1.7rem, 4vw, 2.4rem);
      color: #1a2333;
      margin-bottom: 0.5rem;
    }

    .workouts-header p {
      color: rgba(24, 33, 48, 0.72);
      font-size: 1rem;
      margin: 0;
    }

    .workouts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.2rem;
    }

    .workout-card {
      background: var(--surface);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 1.5rem;
      box-shadow: var(--shadow-soft);
      position: relative;
      transition: all 0.3s ease;
    }

    .workout-card:hover {
      box-shadow: var(--shadow-hover);
      transform: translateY(-2px);
    }

    .workout-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      padding: 0.4rem 0.8rem;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .difficulty-débutant {
      background: #edf7e7;
      color: #2f5f1f;
    }

    .difficulty-intermédiaire {
      background: #fff3d2;
      color: #7a4f16;
    }

    .difficulty-avancé {
      background: #fde7d9;
      color: #991b1b;
    }

    .workout-card h3 {
      margin-top: 0;
      margin-bottom: 1rem;
      color: var(--text-primary);
      font-size: 1.3rem;
    }

    .workout-stats {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .stat-icon {
      font-size: 1.2rem;
    }

    .workout-description {
      color: var(--text-secondary);
      margin-bottom: 1rem;
      line-height: 1.5;
    }

    .exercises {
      margin: 1rem 0;
      padding: 1rem;
      background: var(--surface-light);
      border-radius: 8px;
    }

    .exercises h4 {
      margin-top: 0;
      margin-bottom: 0.5rem;
      color: var(--text-primary);
      font-size: 0.9rem;
    }

    .exercises ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .exercises li {
      color: var(--text-secondary);
      font-size: 0.85rem;
      margin-bottom: 0.3rem;
    }

    .btn-primary {
      width: 100%;
      padding: 0.75rem;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary:hover {
      background: var(--primary-dark);
      transform: translateY(-1px);
    }

    @media (max-width: 768px) {
      .workouts-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class WorkoutsPageComponent {
  workouts: Workout[] = [
    {
      id: 1,
      name: 'Cardio Express',
      duration: 20,
      difficulty: 'Beginner',
      calories: 150,
      description: 'Quick, effective cardio session to boost your heart health and burn calories. Perfect for beginners!',
      exercises: ['High-intensity running in place', 'Jumping jacks (3 sets)', 'High knees sprints', 'Burpees for max effort']
    },
    {
      id: 2,
      name: 'Muscle Strengthening',
      duration: 30,
      difficulty: 'Intermediate',
      calories: 250,
      description: 'Build lean muscle and improve strength. Great for toning and boosting metabolism.',
      exercises: ['Standard push-ups (3x10)', 'Bodyweight squats (3x15)', 'Walking lunges (3x12)', 'Planks (1min hold)', 'Dumbbell curls (3x10)']
    },
    {
      id: 3,
      name: 'HIIT Supreme',
      duration: 25,
      difficulty: 'Advanced',
      calories: 350,
      description: 'High-intensity interval training with maximum fat burn potential. Increases metabolism for hours after.',
      exercises: ['Burpees (30-second burst)', 'Mountain climbers (full speed)', 'Sprints at max effort', 'Explosive jump squats', 'High knees at top speed']
    },
    {
      id: 4,
      name: 'Yoga & Flexibility',
      duration: 40,
      difficulty: 'Beginner',
      calories: 100,
      description: 'Improve flexibility, reduce stress, and enhance mind-body connection. Perfect for recovery days.',
      exercises: ['Downward dog (hold 1min)', 'Warrior pose series', 'Child pose (relaxation)', 'Cat-cow stretch flow', 'Pigeon pose (hip opener)']
    },
    {
      id: 5,
      name: 'Targeted Abs',
      duration: 15,
      difficulty: 'Intermediate',
      calories: 120,
      description: 'Focused core strengthening for defined abs and improved posture. Consistency is key!',
      exercises: ['Crunches (3x15)', 'Leg raises (3x10)', 'Russian twists (3x20)', 'Bicycle crunches (3x20)', 'Side planks (1min each side)']
    },
    {
      id: 6,
      name: 'Boot Camp',
      duration: 45,
      difficulty: 'Advanced',
      calories: 400,
      description: 'Total body challenge combining cardio, strength, and agility. Maximum results through varied intensity.',
      exercises: ['Dynamic lunges (3x12)', 'Explosive push-ups (3x10)', 'Tricep dips (3x12)', 'Agility ladder drills', 'Battle rope training (30sec bursts)']
    }
  ];

  startWorkout(workout: Workout) {
    alert(`You started: ${workout.name}\n\nGreat workout! 💪`);
  }
}
