import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout.component';
import { HomePageComponent } from './features/home/pages/home-page.component';
import { PredictionPageComponent } from './features/prediction/pages/prediction-page.component';
import { WorkoutsPageComponent } from './features/workouts/pages/workouts-page.component';
import { RecipesPageComponent } from './features/recipes/pages/recipes-page.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', component: HomePageComponent, pathMatch: 'full' },
      { path: 'prediction', component: PredictionPageComponent },
      { path: 'workouts', component: WorkoutsPageComponent },
      { path: 'recipes', component: RecipesPageComponent },
      { path: '**', redirectTo: '' }
    ]
  }
];
