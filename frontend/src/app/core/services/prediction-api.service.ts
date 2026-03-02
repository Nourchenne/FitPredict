import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { PredictionRequest, PredictionResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class PredictionApiService {
  constructor(private http: HttpClient, private api: ApiService) {}

  predict(payload: PredictionRequest): Observable<PredictionResponse> {
    return this.http.post<PredictionResponse>(
      this.api.getFullUrl('/predict'),
      payload
    ).pipe(
      tap(result => console.log('Prediction result:', result)),
      catchError(this.handleError)
    );
  }

  predictBatch(formData: FormData): Observable<any> {
    return this.http.post<any>(
      this.api.getFullUrl('/predict_batch'),
      formData
    ).pipe(
      tap(result => console.log('Batch prediction result:', result)),
      catchError(this.handleError)
    );
  }

  getPredictionHistory(userId: string): Observable<any[]> {
    return this.http.get<any[]>(
      this.api.getFullUrl(`/users/${userId}/predictions`)
    ).pipe(catchError(this.handleError));
  }

  savePredictionHistory(userId: string, payload: { created_at: string; data: any }): Observable<any> {
    return this.http.post<any>(
      this.api.getFullUrl(`/users/${userId}/predictions`),
      payload
    ).pipe(catchError(this.handleError));
  }

  deletePredictionHistory(userId: string, recordId: number): Observable<any> {
    return this.http.delete<any>(
      this.api.getFullUrl(`/users/${userId}/predictions/${recordId}`)
    ).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    let errorMessage = 'Une erreur est survenue lors de la requête';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.status === 0) {
        errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le backend est en cours d\'exécution.';
      } else {
        errorMessage = `Erreur serveur: ${error.status} - ${error.statusText}`;
      }
    }
    
    return throwError(() => ({
      message: errorMessage,
      status: error.status,
      error: error.error
    }));
  }
}
