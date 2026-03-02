import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';

export interface CompletedWorkoutPayload {
  workout_id: number;
  name: string;
  completed_at: string;
  exercises: string[];
  plan_type?: 'STANDARD' | 'LOW_IMPACT' | 'NO_EQUIPMENT' | 'DUMBBELLS';
}

@Injectable({
  providedIn: 'root'
})
export class WorkoutService {
  constructor(private http: HttpClient, private api: ApiService) {}

  async getCompletedWorkouts(userId: string): Promise<any[]> {
    return await firstValueFrom(
      this.http.get<any[]>(this.api.getFullUrl(`/users/${userId}/completed-workouts`))
    );
  }

  async addCompletedWorkout(userId: string, payload: CompletedWorkoutPayload): Promise<void> {
    await firstValueFrom(
      this.http.post(this.api.getFullUrl(`/users/${userId}/completed-workouts`), payload)
    );
  }
}
