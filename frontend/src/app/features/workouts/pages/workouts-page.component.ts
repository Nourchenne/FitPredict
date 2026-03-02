import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { WorkoutService } from '../../../core/services/workout.service';

interface ExerciseStep {
  name: string;
  durationSec: number;
  imageUrl?: string;
  series?: string;
}

interface Workout {
  id: number;
  name: string;
  duration: number;
  difficulty: string;
  calories: number;
  description: string;
  seriesPlan: string;
  exercises: ExerciseStep[];
}

interface CompletedWorkout {
  workoutId: number;
  name: string;
  completedAt: string;
  exercises: string[];
}

@Component({
  selector: 'app-workouts-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="workouts-container">
      <div class="workouts-header">
        <div class="header-brand">
          <img src="assets/branding/fitpredict-logo.png" alt="FitPredict logo" class="page-logo" />
          <div>
            <h1>💪 FitPredict Training Programs</h1>
            <p>Discover our personalized programs tailored to your level</p>
          </div>
        </div>
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
          <p><strong>Series:</strong> {{ workout.seriesPlan }}</p>

          <div class="exercises">
            <h4>Included exercises:</h4>
            <ul>
              <li *ngFor="let exercise of workout.exercises">
                ✓ {{ exercise.name }} <span *ngIf="exercise.series">({{ exercise.series }})</span>
              </li>
            </ul>
          </div>

          <button class="btn-primary" (click)="startWorkout(workout)">
            {{ isWorkoutCompleted(workout.id) ? 'Start again' : 'Start' }}
          </button>
        </div>
      </div>

      <section class="history" *ngIf="completedWorkouts.length > 0">
        <h2>✅ Exercises you already did</h2>
        <p class="history-subtitle">Great consistency! Here are your completed workout sessions.</p>

        <div class="history-list">
          <article class="history-item" *ngFor="let done of completedWorkouts">
            <div class="history-head">
              <h3>{{ done.name }}</h3>
              <span>{{ formatDate(done.completedAt) }}</span>
            </div>
            <ul>
              <li *ngFor="let exercise of done.exercises">✓ {{ exercise }}</li>
            </ul>
          </article>
        </div>
      </section>

      <section *ngIf="activeWorkout" class="player-overlay" (click)="closePlayer()">
        <article class="player-card" (click)="$event.stopPropagation()">
          <div class="player-head">
            <h2>🏋️ {{ activeWorkout.name }}</h2>
            <button type="button" class="close-btn" (click)="closePlayer()">✕</button>
          </div>

          <p class="player-progress">
            Exercise {{ currentExerciseIndex + 1 }} / {{ activeWorkout.exercises.length }}
          </p>

          <div class="progress-track">
            <span class="progress-value" [style.width.%]="getWorkoutProgressPercent()"></span>
          </div>

          <div *ngIf="currentExercise as exercise" class="exercise-card" [class.is-transitioning]="isExerciseTransitioning">
            <img
              [src]="currentExerciseImageUrl"
              [alt]="exercise.name"
              [attr.data-exercise-key]="currentExerciseKey"
              loading="eager"
              (error)="onImgError($event)"
            />
            <h3>{{ exercise.name }}</h3>
            <p class="timer">⏱️ {{ remainingSeconds }}s</p>
            <p *ngIf="exercise.series"><strong>Series:</strong> {{ exercise.series }}</p>
          </div>

          <div class="player-actions">
            <button type="button" class="btn-skip" (click)="skipExercise()">Skip</button>
            <button type="button" class="btn-next" (click)="nextExercise()">
              {{ isLastExercise() ? 'Finish workout' : 'Next' }}
            </button>
          </div>
        </article>
      </section>
    </div>
  `,
  styles: [`
    .workouts-container { max-width: 1400px; margin: 0 auto; padding: 1.25rem 2rem 2rem; }
    .workouts-header { margin-bottom: 2rem; border-radius: 14px; padding: 1.4rem 1.6rem;
      background: linear-gradient(140deg, #efd56f 0%, #f0cf59 65%, #e9bf3f 100%);
      border: 1px solid #e4cf77; box-shadow: var(--shadow-soft);
    }
    .workouts-header h1 { font-size: clamp(1.7rem, 4vw, 2.4rem); color: #1a2333; margin-bottom: 0.5rem; }
    .workouts-header p { color: rgba(24, 33, 48, 0.72); font-size: 1rem; margin: 0; }
    .header-brand { display: flex; align-items: center; gap: 0.9rem; }
    .page-logo { width: 164px; height: auto; object-fit: contain; }

    .workouts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.2rem; }
    .workout-card { background: var(--surface); border: 1px solid var(--border-color); border-radius: 14px;
      padding: 1.5rem; box-shadow: var(--shadow-soft); position: relative;
    }
    .workout-badge { position: absolute; top: 1rem; right: 1rem; padding: 0.4rem 0.8rem; border-radius: 999px;
      font-size: 0.8rem; font-weight: 600; text-transform: uppercase;
    }
    .difficulty-beginner { background: #edf7e7; color: #2f5f1f; }
    .difficulty-intermediate { background: #fff3d2; color: #7a4f16; }
    .difficulty-advanced { background: #fde7d9; color: #991b1b; }

    .workout-card h3 { margin-top: 0; margin-bottom: 1rem; color: var(--text-primary); font-size: 1.3rem; }
    .workout-stats { display: flex; gap: 1.5rem; margin-bottom: 1rem; padding-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
    }
    .stat { display: flex; align-items: center; gap: 0.5rem; color: var(--text-secondary); font-size: 0.9rem; }
    .stat-icon { font-size: 1.2rem; }
    .workout-description { color: var(--text-secondary); margin-bottom: 1rem; line-height: 1.5; }

    .exercises { margin: 1rem 0; padding: 1rem; background: var(--surface-light); border-radius: 8px; }
    .exercises h4 { margin-top: 0; margin-bottom: 0.5rem; color: var(--text-primary); font-size: 0.9rem; }
    .exercises ul { list-style: none; padding: 0; margin: 0; }
    .exercises li { color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 0.3rem; }

    .btn-primary { width: 100%; padding: 0.75rem; background: var(--primary-color); color: white; border: none;
      border-radius: 10px; font-weight: 600; cursor: pointer;
    }
    .btn-primary:hover { background: var(--primary-dark); }

    .history { margin-top: 1.8rem; background: var(--surface); border: 1px solid var(--border-color);
      border-radius: 14px; padding: 1.25rem; box-shadow: var(--shadow-soft);
    }
    .history h2 { margin: 0; color: var(--text-primary); }
    .history-subtitle { margin: 0.4rem 0 1rem; }
    .history-list { display: grid; gap: 0.8rem; }
    .history-item { padding: 0.85rem; background: var(--surface-light); border-radius: 10px; }
    .history-head { display: flex; justify-content: space-between; margin-bottom: 0.6rem; }
    .history-item ul { margin: 0; padding-left: 1rem; color: var(--text-secondary); }

    .player-overlay { position: fixed; inset: 0; background: rgba(9, 16, 23, 0.58);
      display: grid; place-items: center; z-index: 1200; padding: 1rem;
    }
    .player-card { width: min(760px, 100%); border-radius: 16px; background: var(--surface);
      border: 1px solid var(--border-color); padding: 1rem;
    }
    .player-head { display: flex; justify-content: space-between; align-items: center; gap: 0.7rem; }
    .player-head h2 { margin: 0; color: var(--text-primary); font-size: 1.2rem; }
    .close-btn { border: 1px solid var(--border-color); background: #fff; border-radius: 8px; padding: 0.35rem 0.55rem; cursor: pointer; }

    .progress-track { height: 10px; border-radius: 999px; background: #eef4e5; overflow: hidden; }
    .progress-value { height: 100%; display: block; background: linear-gradient(90deg, #6bb252, #8dcc70); transition: width 0.3s ease; }

    .exercise-card { background: var(--surface-light); border: 1px solid var(--border-color);
      border-radius: 12px; padding: 0.8rem; margin-top: 0.7rem;
      transition: opacity 0.22s ease, transform 0.22s ease;
    }
    .exercise-card.is-transitioning { opacity: 0.1; transform: translateX(8px) scale(0.99); }
    .exercise-card img { width: 100%; height: 270px; object-fit: cover; border-radius: 10px; background: #f2f2f2; }
    .exercise-card h3 { margin: 0.6rem 0 0.25rem; font-size: 1.15rem; }
    .timer { margin: 0; color: var(--primary-dark); }

    .player-actions { margin-top: 0.7rem; display: flex; justify-content: flex-end; gap: 0.6rem; }
    .btn-skip, .btn-next { border: none; padding: 0.65rem 0.95rem; font-weight: 700; cursor: pointer; border-radius: 10px; }
    .btn-skip { background: #fee2e2; color: #991b1b; }
    .btn-next { background: var(--primary-color); color: #fff; }

    @media (max-width: 768px) {
      .workouts-grid { grid-template-columns: 1fr; }
      .workouts-container { padding: 1rem; }
    }
  `]
})
export class WorkoutsPageComponent implements OnDestroy {
  completedWorkouts: CompletedWorkout[] = [];
  activeWorkout: Workout | null = null;
  currentExerciseIndex = 0;
  currentExerciseImageUrl = 'assets/images/workout-fallback.svg';
  currentExerciseKey = '';
  remainingSeconds = 0;
  isExerciseTransitioning = false;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private isAdvancingExercise = false;
  private readonly EXERCISE_TRANSITION_MS = 220;

  private readonly FALLBACK_IMG = 'assets/images/workout-fallback.svg';

  // Image URLs (grouped by exercise type)
  private readonly IMG = {
    // Cardio / HIIT
    running: 'https://images.pexels.com/photos/3764538/pexels-photo-3764538.jpeg?auto=compress&cs=tinysrgb&w=1200',
    hiit: 'https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg?auto=compress&cs=tinysrgb&w=1200',

    // Upper strength
    push: 'https://images.pexels.com/photos/4162487/pexels-photo-4162487.jpeg?auto=compress&cs=tinysrgb&w=1200',
    dips: 'https://images.pexels.com/photos/4162481/pexels-photo-4162481.jpeg?auto=compress&cs=tinysrgb&w=1200',
    rows: 'https://images.pexels.com/photos/2261477/pexels-photo-2261477.jpeg?auto=compress&cs=tinysrgb&w=1200',
    curls: 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=1200',

    // Lower strength
    squat: 'https://images.pexels.com/photos/4662331/pexels-photo-4662331.jpeg?auto=compress&cs=tinysrgb&w=1200',
    lunge: 'https://images.pexels.com/photos/6456302/pexels-photo-6456302.jpeg?auto=compress&cs=tinysrgb&w=1200',
    glutes: 'https://images.pexels.com/photos/6456298/pexels-photo-6456298.jpeg?auto=compress&cs=tinysrgb&w=1200',

    // Core
    plank: 'https://images.pexels.com/photos/14074802/pexels-photo-14074802.jpeg?auto=compress&cs=tinysrgb&w=1200',
    abs: 'https://images.pexels.com/photos/6456306/pexels-photo-6456306.jpeg?auto=compress&cs=tinysrgb&w=1200',

    // Mobility / Yoga
    yoga: 'https://images.pexels.com/photos/3758056/pexels-photo-3758056.jpeg?auto=compress&cs=tinysrgb&w=1200',

    // Default
    default: 'https://images.pexels.com/photos/20418612/pexels-photo-20418612.jpeg?auto=compress&cs=tinysrgb&w=1200',
  };

  // Exact image per exercise name for consistent and predictable visuals
  private readonly EXERCISE_IMAGE_BY_NAME: Record<string, string> = {
    'high-intensity running in place': this.IMG.running,
    'jumping jacks': this.IMG.hiit,
    'high knees sprints': this.IMG.hiit,
    'burpees': this.IMG.hiit,

    'standard push-ups': this.IMG.push,
    'bodyweight squats': this.IMG.squat,
    'walking lunges': this.IMG.lunge,
    'plank hold': this.IMG.plank,
    'dumbbell curls': this.IMG.curls,

    'burpees burst': this.IMG.hiit,
    'mountain climbers': this.IMG.hiit,
    'sprints max effort': this.IMG.running,
    'explosive jump squats': this.IMG.hiit,
    'high knees top speed': this.IMG.hiit,

    'downward dog': this.IMG.yoga,
    'warrior pose series': this.IMG.yoga,
    'child pose': this.IMG.yoga,
    'cat-cow stretch flow': this.IMG.yoga,
    'pigeon pose': this.IMG.yoga,

    'crunches': this.IMG.abs,
    'leg raises': this.IMG.abs,
    'russian twists': this.IMG.abs,
    'bicycle crunches': this.IMG.abs,
    'side planks': this.IMG.plank,

    'dynamic lunges': this.IMG.lunge,
    'explosive push-ups': this.IMG.push,
    'tricep dips': this.IMG.dips,
    'agility ladder drills': this.IMG.hiit,
    'battle rope training': this.IMG.hiit,

    'neck and shoulder circles': this.IMG.yoga,
    'world greatest stretch': this.IMG.yoga,
    'hip opener flow': this.IMG.yoga,
    'thoracic rotations': this.IMG.yoga,

    'goblet squats': this.IMG.squat,
    'reverse lunges': this.IMG.lunge,
    'glute bridges': this.IMG.glutes,
    'calf raises': this.IMG.glutes,
    'wall sit': this.IMG.glutes,

    'jump rope fast pace': this.IMG.running,
    'thrusters': this.IMG.rows,
    'renegade rows': this.IMG.rows,
    'box jumps': this.IMG.hiit,
    'plank jack finisher': this.IMG.plank,

    'incline push-ups': this.IMG.push,
    'pike push-ups': this.IMG.push,
    'resistance band rows': this.IMG.rows,
    'chair dips': this.IMG.dips,
    'hammer curls': this.IMG.curls,
    'shoulder taps plank': this.IMG.plank,

    'dead bug': this.IMG.abs,
    'bird-dog': this.IMG.abs,
    'hollow body hold': this.IMG.abs,
    'side plank reach-through': this.IMG.plank,
    'flutter kicks': this.IMG.abs,

    'shuttle runs': this.IMG.running,
    'skater jumps': this.IMG.hiit,
    'push-up to knee tuck': this.IMG.push,
    'broad jumps': this.IMG.hiit,
    'bear crawl': this.IMG.hiit,
    'plank sprint finisher': this.IMG.plank
  };

  constructor(private authService: AuthService, private workoutService: WorkoutService) {
    this.loadCompletedWorkouts();
  }

  workouts: Workout[] = [
    {
      id: 1,
      name: 'Cardio Express',
      duration: 20,
      difficulty: 'Beginner',
      calories: 150,
      description: 'Quick, effective cardio session to boost your heart health and burn calories. Perfect for beginners!',
      seriesPlan: '3 rounds • 40 sec work / 20 sec rest',
      exercises: [
        { name: 'High-intensity running in place', durationSec: 40, series: '3 x 40 sec' },
        { name: 'Jumping jacks', durationSec: 45, series: '3 x 20 reps' },
        { name: 'High knees sprints', durationSec: 35, series: '3 x 35 sec' },
        { name: 'Burpees', durationSec: 30, series: '3 x 10 reps' }
      ]
    },
    {
      id: 2,
      name: 'Muscle Strengthening',
      duration: 30,
      difficulty: 'Intermediate',
      calories: 250,
      description: 'Build lean muscle and improve strength. Great for toning and boosting metabolism.',
      seriesPlan: '4 sets strength focus',
      exercises: [
        { name: 'Standard push-ups', durationSec: 45, series: '4 x 12 reps' },
        { name: 'Bodyweight squats', durationSec: 50, series: '4 x 15 reps' },
        { name: 'Walking lunges', durationSec: 50, series: '4 x 12 reps / leg' },
        { name: 'Plank hold', durationSec: 40, series: '4 x 40 sec' },
        { name: 'Dumbbell curls', durationSec: 45, series: '4 x 12 reps' }
      ]
    },
    {
      id: 3,
      name: 'HIIT Supreme',
      duration: 25,
      difficulty: 'Advanced',
      calories: 350,
      description: 'High-intensity interval training with maximum fat burn potential. Increases metabolism for hours after.',
      seriesPlan: '5 rounds HIIT • 30/15 protocol',
      exercises: [
        { name: 'Burpees burst', durationSec: 35, series: '5 x 12 reps' },
        { name: 'Mountain climbers', durationSec: 40, series: '5 x 40 sec' },
        { name: 'Sprints max effort', durationSec: 30, series: '5 x 30 sec' },
        { name: 'Explosive jump squats', durationSec: 35, series: '5 x 15 reps' },
        { name: 'High knees top speed', durationSec: 35, series: '5 x 35 sec' }
      ]
    },
    {
      id: 4,
      name: 'Yoga & Flexibility',
      duration: 40,
      difficulty: 'Beginner',
      calories: 100,
      description: 'Improve flexibility, reduce stress, and enhance mind-body connection. Perfect for recovery days.',
      seriesPlan: '2 gentle rounds',
      exercises: [
        { name: 'Downward dog', durationSec: 50, series: '2 x 50 sec hold' },
        { name: 'Warrior pose series', durationSec: 55, series: '2 x 55 sec / side' },
        { name: 'Child pose', durationSec: 45, series: '2 x 45 sec hold' },
        { name: 'Cat-cow stretch flow', durationSec: 40, series: '2 x 40 sec flow' },
        { name: 'Pigeon pose', durationSec: 45, series: '2 x 45 sec / side' }
      ]
    },
    {
      id: 5,
      name: 'Targeted Abs',
      duration: 15,
      difficulty: 'Intermediate',
      calories: 120,
      description: 'Focused core strengthening for defined abs and improved posture. Consistency is key!',
      seriesPlan: '4 core rounds',
      exercises: [
        { name: 'Crunches', durationSec: 40, series: '4 x 20 reps' },
        { name: 'Leg raises', durationSec: 45, series: '4 x 15 reps' },
        { name: 'Russian twists', durationSec: 45, series: '4 x 30 reps' },
        { name: 'Bicycle crunches', durationSec: 45, series: '4 x 30 reps' },
        { name: 'Side planks', durationSec: 40, series: '4 x 40 sec / side' }
      ]
    },
    {
      id: 6,
      name: 'Boot Camp',
      duration: 45,
      difficulty: 'Advanced',
      calories: 400,
      description: 'Total body challenge combining cardio, strength, and agility. Maximum results through varied intensity.',
      seriesPlan: '5 high-intensity rounds',
      exercises: [
        { name: 'Dynamic lunges', durationSec: 45, series: '5 x 14 reps / leg' },
        { name: 'Explosive push-ups', durationSec: 35, series: '5 x 10 reps' },
        { name: 'Tricep dips', durationSec: 40, series: '5 x 15 reps' },
        { name: 'Agility ladder drills', durationSec: 50, series: '5 x 50 sec' },
        { name: 'Battle rope training', durationSec: 35, series: '5 x 35 sec' }
      ]
    },
    {
      id: 7,
      name: 'Morning Mobility Flow',
      duration: 18,
      difficulty: 'Beginner',
      calories: 95,
      description: 'Wake up your joints and muscles with a soft mobility routine for pain-free movement.',
      seriesPlan: '2 mobility rounds',
      exercises: [
        { name: 'Neck and shoulder circles', durationSec: 35, series: '2 x 12 circles' },
        { name: 'World greatest stretch', durationSec: 45, series: '2 x 45 sec' },
        { name: 'Hip opener flow', durationSec: 50, series: '2 x 10 reps / side' },
        { name: 'Thoracic rotations', durationSec: 40, series: '2 x 12 reps / side' }
      ]
    },
    {
      id: 8,
      name: 'Lower Body Burner',
      duration: 28,
      difficulty: 'Intermediate',
      calories: 260,
      description: 'Focused lower body routine to develop glutes, quads, and hamstrings endurance.',
      seriesPlan: '4 lower-body rounds',
      exercises: [
        { name: 'Goblet squats', durationSec: 50, series: '4 x 15 reps' },
        { name: 'Reverse lunges', durationSec: 45, series: '4 x 12 reps / leg' },
        { name: 'Glute bridges', durationSec: 45, series: '4 x 18 reps' },
        { name: 'Calf raises', durationSec: 40, series: '4 x 25 reps' },
        { name: 'Wall sit', durationSec: 40, series: '4 x 40 sec hold' }
      ]
    },
    {
      id: 9,
      name: 'Full Body Circuit Plus',
      duration: 35,
      difficulty: 'Advanced',
      calories: 370,
      description: 'A complete intense circuit to challenge cardio capacity and muscular endurance together.',
      seriesPlan: '5 full-body rounds',
      exercises: [
        { name: 'Jump rope fast pace', durationSec: 40, series: '5 x 40 sec' },
        { name: 'Thrusters', durationSec: 45, series: '5 x 12 reps' },
        { name: 'Renegade rows', durationSec: 45, series: '5 x 12 reps' },
        { name: 'Box jumps', durationSec: 35, series: '5 x 12 reps' },
        { name: 'Plank jack finisher', durationSec: 35, series: '5 x 35 sec' }
      ]
    },
    {
      id: 10,
      name: 'Upper Body Volume',
      duration: 32,
      difficulty: 'Intermediate',
      calories: 300,
      description: 'Focus on chest, shoulders, back and arms with moderate volume and controlled tempo.',
      seriesPlan: '4 sets per movement',
      exercises: [
        { name: 'Incline push-ups', durationSec: 40, series: '4 x 15 reps' },
        { name: 'Pike push-ups', durationSec: 35, series: '4 x 10 reps' },
        { name: 'Resistance band rows', durationSec: 45, series: '4 x 15 reps' },
        { name: 'Chair dips', durationSec: 40, series: '4 x 12 reps' },
        { name: 'Hammer curls', durationSec: 40, series: '4 x 12 reps' },
        { name: 'Shoulder taps plank', durationSec: 35, series: '4 x 30 sec' }
      ]
    },
    {
      id: 11,
      name: 'Core & Stability Pro',
      duration: 26,
      difficulty: 'Intermediate',
      calories: 210,
      description: 'Improve trunk stability, anti-rotation strength and posture through targeted core series.',
      seriesPlan: '4 rounds core stability',
      exercises: [
        { name: 'Dead bug', durationSec: 40, series: '4 x 16 reps' },
        { name: 'Bird-dog', durationSec: 45, series: '4 x 12 reps / side' },
        { name: 'Hollow body hold', durationSec: 30, series: '4 x 30 sec' },
        { name: 'Side plank reach-through', durationSec: 35, series: '4 x 12 reps / side' },
        { name: 'Flutter kicks', durationSec: 40, series: '4 x 35 sec' }
      ]
    },
    {
      id: 12,
      name: 'Athletic Conditioning',
      duration: 38,
      difficulty: 'Advanced',
      calories: 420,
      description: 'Athletic conditioning block to improve power, speed, and movement quality.',
      seriesPlan: '6 rounds conditioning',
      exercises: [
        { name: 'Shuttle runs', durationSec: 35, series: '6 x 35 sec' },
        { name: 'Skater jumps', durationSec: 35, series: '6 x 16 reps' },
        { name: 'Push-up to knee tuck', durationSec: 40, series: '6 x 12 reps' },
        { name: 'Broad jumps', durationSec: 30, series: '6 x 10 reps' },
        { name: 'Bear crawl', durationSec: 35, series: '6 x 20 meters' },
        { name: 'Plank sprint finisher', durationSec: 30, series: '6 x 30 sec' }
      ]
    }
  ];

  // ---------- Lifecycle ----------
  ngOnDestroy(): void {
    this.stopTimer();
  }

  // ---------- UI helpers ----------
  get currentExercise(): ExerciseStep | null {
    if (!this.activeWorkout) return null;
    return this.activeWorkout.exercises[this.currentExerciseIndex] ?? null;
  }

  getWorkoutProgressPercent(): number {
    if (!this.activeWorkout) return 0;
    return Math.round(((this.currentExerciseIndex + 1) / this.activeWorkout.exercises.length) * 100);
  }

  isLastExercise(): boolean {
    if (!this.activeWorkout) return false;
    return this.currentExerciseIndex >= this.activeWorkout.exercises.length - 1;
  }

  isWorkoutCompleted(workoutId: number): boolean {
    return this.completedWorkouts.some((item) => item.workoutId === workoutId);
  }

  formatDate(raw: string): string {
    return new Date(raw).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // ---------- Player ----------
  startWorkout(workout: Workout): void {
    this.stopTimer();
    this.isExerciseTransitioning = false;
    this.activeWorkout = workout;
    this.currentExerciseIndex = 0;
    this.remainingSeconds = workout.exercises[0]?.durationSec ?? 0;
    this.syncCurrentExerciseImage();
    this.startTimer();
  }

  skipExercise(): void {
    this.advanceExercise();
  }

  nextExercise(): void {
    this.advanceExercise();
  }

  closePlayer(): void {
    this.stopTimer();
    this.isExerciseTransitioning = false;
    this.activeWorkout = null;
    this.currentExerciseIndex = 0;
    this.currentExerciseKey = '';
    this.currentExerciseImageUrl = this.FALLBACK_IMG;
    this.remainingSeconds = 0;
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerId = setInterval(() => {
      if (!this.activeWorkout) {
        this.stopTimer();
        return;
      }
      if (this.remainingSeconds <= 1) {
        this.advanceExercise();
        return;
      }
      this.remainingSeconds--;
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private async advanceExercise(): Promise<void> {
    if (!this.activeWorkout || this.isAdvancingExercise) return;

    this.isAdvancingExercise = true;

    try {
      if (this.isLastExercise()) {
        await this.completeWorkoutSession();
        return;
      }

      this.isExerciseTransitioning = true;
      await this.wait(this.EXERCISE_TRANSITION_MS);

      if (!this.activeWorkout) return;

      this.currentExerciseIndex++;
      this.remainingSeconds = this.activeWorkout.exercises[this.currentExerciseIndex].durationSec;
      this.syncCurrentExerciseImage();
      this.isExerciseTransitioning = false;
    } finally {
      this.isAdvancingExercise = false;
    }
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ---------- Completed workouts ----------
  private async loadCompletedWorkouts(): Promise<void> {
    const user = this.authService.currentUser();
    if (user) {
      try {
        const apiRows = await this.workoutService.getCompletedWorkouts(user.id);
        this.completedWorkouts = apiRows.map((row: any) => ({
          workoutId: row.workout_id,
          name: row.name,
          completedAt: row.completed_at,
          exercises: row.exercises
        }));
        return;
      } catch {
        // fallback to local
      }
    }

    const key = this.authService.getUserScopedStorageKey('completedWorkouts');
    const stored = localStorage.getItem(key);
    this.completedWorkouts = stored ? JSON.parse(stored) : [];
  }

  private saveCompletedWorkouts(): void {
    const key = this.authService.getUserScopedStorageKey('completedWorkouts');
    localStorage.setItem(key, JSON.stringify(this.completedWorkouts));
  }

  private async completeWorkoutSession(): Promise<void> {
    if (!this.activeWorkout) return;

    const completed: CompletedWorkout = {
      workoutId: this.activeWorkout.id,
      name: this.activeWorkout.name,
      completedAt: new Date().toISOString(),
      exercises: this.activeWorkout.exercises.map((exercise) => exercise.name)
    };

    this.completedWorkouts = [completed, ...this.completedWorkouts];
    this.saveCompletedWorkouts();

    const user = this.authService.currentUser();
    if (user) {
      try {
        await this.workoutService.addCompletedWorkout(user.id, {
          workout_id: completed.workoutId,
          name: completed.name,
          completed_at: completed.completedAt,
          exercises: completed.exercises
        });
      } catch {
        // keep UI responsive
      }
    }

    this.closePlayer();
    alert('Workout completed! ✅ Added to your completed sessions.');
  }

  // ---------- Images (FIXED) ----------
  resolveExerciseImage(ex: ExerciseStep | null): string {
    if (!ex) return this.FALLBACK_IMG;

    const direct = (ex.imageUrl || '').trim();
    if (direct) return direct;

    return this.getExerciseImage(ex.name) || this.FALLBACK_IMG;
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const keyOnElement = img.getAttribute('data-exercise-key') || '';
    if (keyOnElement !== this.currentExerciseKey) {
      return;
    }

    img.src = this.FALLBACK_IMG;
    this.currentExerciseImageUrl = this.FALLBACK_IMG;
  }

  private syncCurrentExerciseImage(): void {
    const exercise = this.currentExercise;
    if (!exercise) {
      this.currentExerciseKey = '';
      this.currentExerciseImageUrl = this.FALLBACK_IMG;
      return;
    }

    const normalizedName = exercise.name.toLowerCase().trim().replace(/\s+/g, ' ');
    this.currentExerciseKey = `${this.currentExerciseIndex}-${normalizedName}`;

    const baseUrl = this.resolveExerciseImage(exercise);
    this.currentExerciseImageUrl = this.withExerciseKey(baseUrl, this.currentExerciseKey);
  }

  private withExerciseKey(url: string, key: string): string {
    if (!url || url.startsWith('data:')) {
      return url || this.FALLBACK_IMG;
    }

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}ek=${encodeURIComponent(key)}`;
  }

  getExerciseImage(exerciseName: string): string {
    const n = (exerciseName || '').toLowerCase().trim().replace(/\s+/g, ' ');

    const exact = this.EXERCISE_IMAGE_BY_NAME[n];
    if (exact) return exact;

    const has = (...keys: string[]) => keys.some(k => n.includes(k));

    // CARDIO / HIIT
    if (has('run', 'running', 'sprint', 'shuttle', 'jump rope', 'rope', 'skater')) return this.IMG.running;
    if (has('jump', 'jacks', 'box jump', 'broad jump', 'explosive')) return this.IMG.hiit;
    if (has('burpee', 'mountain climber', 'climber', 'high knee', 'agility', 'ladder', 'battle rope', 'conditioning', 'bear crawl')) {
      return this.IMG.hiit;
    }

    // UPPER STRENGTH
    if (has('push-up', 'push up', 'pushups', 'incline push', 'pike push', 'explosive push')) return this.IMG.push;
    if (has('dip', 'tricep dip', 'chair dip')) return this.IMG.dips;
    if (has('row', 'rows', 'renegade row', 'band row')) return this.IMG.rows;
    if (has('curl', 'curls', 'hammer curl', 'bicep')) return this.IMG.curls;
    if (has('thruster', 'thrusters')) return this.IMG.rows; // same “strength” vibe

    // LOWER STRENGTH
    if (has('squat', 'squats', 'goblet squat')) return this.IMG.squat;
    if (has('lunge', 'lunges', 'reverse lunge', 'walking lunge', 'dynamic lunge')) return this.IMG.lunge;
    if (has('glute', 'bridge', 'calf', 'wall sit')) return this.IMG.glutes;

    // CORE
    if (has('plank', 'side plank', 'plank jack', 'shoulder taps')) return this.IMG.plank;
    if (has('crunch', 'bicycle', 'twist', 'russian', 'leg raise', 'flutter', 'dead bug', 'bird-dog', 'hollow')) return this.IMG.abs;

    // YOGA / MOBILITY
    if (has('yoga', 'pose', 'stretch', 'mobility', 'downward dog', 'warrior', 'child pose', 'cat-cow', 'pigeon', 'rotation', 'opener')) {
      return this.IMG.yoga;
    }

    return this.IMG.default;
  }
}