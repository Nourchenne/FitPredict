import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';

export interface FavoriteRecipePayload {
  recipe_id: number;
  recipe: any;
}

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  constructor(private http: HttpClient, private api: ApiService) {}

  async getFavorites(userId: string): Promise<any[]> {
    return await firstValueFrom(
      this.http.get<any[]>(this.api.getFullUrl(`/users/${userId}/favorite-recipes`))
    );
  }

  async addFavorite(userId: string, payload: FavoriteRecipePayload): Promise<void> {
    await firstValueFrom(
      this.http.post(this.api.getFullUrl(`/users/${userId}/favorite-recipes`), payload)
    );
  }

  async removeFavorite(userId: string, recipeId: number): Promise<void> {
    await firstValueFrom(
      this.http.delete(this.api.getFullUrl(`/users/${userId}/favorite-recipes/${recipeId}`))
    );
  }

  async getLikesMap(): Promise<Record<number, number>> {
    const raw = await firstValueFrom(
      this.http.get<Record<string, number>>(this.api.getFullUrl('/recipes/likes'))
    );

    return Object.entries(raw).reduce((acc, [key, value]) => {
      acc[Number(key)] = value;
      return acc;
    }, {} as Record<number, number>);
  }
}
