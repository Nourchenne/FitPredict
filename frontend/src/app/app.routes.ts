import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout.component';
import { HomePageComponent } from './features/home/pages/home-page.component';
import { PredictionPageComponent } from './features/prediction/pages/prediction-page.component';
import { WorkoutsPageComponent } from './features/workouts/pages/workouts-page.component';
import { RecipesPageComponent } from './features/recipes/pages/recipes-page.component';
import { FavoritesPageComponent } from './features/recipes/pages/favorites-page.component';
import { AuthPageComponent } from './features/auth/pages/auth-page.component';
import { authGuard } from './core/guards';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', component: HomePageComponent, pathMatch: 'full' },
      { path: 'auth', component: AuthPageComponent },
      { path: 'prediction', component: PredictionPageComponent, canActivate: [authGuard] },
      { path: 'workouts', component: WorkoutsPageComponent, canActivate: [authGuard] },
      { path: 'recipes', component: RecipesPageComponent, canActivate: [authGuard] },
      { path: 'favorites', component: FavoritesPageComponent, canActivate: [authGuard] },
      { path: '**', redirectTo: '' }
    ]
  }
];
