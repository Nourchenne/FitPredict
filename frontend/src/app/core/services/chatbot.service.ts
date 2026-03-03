import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ChatRagRequest, ChatRagResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  constructor(private http: HttpClient, private api: ApiService) {}

  askRag(payload: ChatRagRequest): Observable<ChatRagResponse> {
    return this.http.post<ChatRagResponse>(
      this.api.getFullUrl('/chat/rag'),
      payload
    ).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Unable to reach chatbot service.';

    if (error.error?.detail) {
      errorMessage = error.error.detail;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 0) {
      errorMessage = 'Backend unreachable. Please make sure API is running.';
    }

    return throwError(() => ({
      message: errorMessage,
      status: error.status,
      error: error.error
    }));
  }
}
