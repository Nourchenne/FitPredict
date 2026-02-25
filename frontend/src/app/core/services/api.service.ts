import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  readonly baseUrl = 'http://localhost:8000';
  readonly apiVersion = '/api/v1';

  getFullUrl(endpoint: string): string {
    return `${this.baseUrl}${endpoint}`;
  }
}
