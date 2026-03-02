import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthResult, AuthUser, LoginPayload, RegisterPayload } from '../models/auth.model';
import { ApiService } from './api.service';

interface StoredUser extends AuthUser {
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly usersKey = 'fitpredict_users_v1';
  private readonly sessionKey = 'fitpredict_session_v1';
  private readonly currentUserSignal = signal<AuthUser | null>(this.loadSessionUser());

  readonly currentUser = this.currentUserSignal.asReadonly();

  constructor(private http: HttpClient, private api: ApiService) {}

  async register(payload: RegisterPayload): Promise<AuthResult> {
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResult>(
          this.api.getFullUrl('/auth/register'),
          payload
        )
      );

      if (response.success && response.user) {
        this.setSession(response.user);
      }

      return response;
    } catch {
      return this.registerLocal(payload);
    }
  }

  async login(payload: LoginPayload): Promise<AuthResult> {
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResult>(
          this.api.getFullUrl('/auth/login'),
          payload
        )
      );

      if (response.success && response.user) {
        this.setSession(response.user);
      }

      return response;
    } catch {
      return this.loginLocal(payload);
    }
  }

  private registerLocal(payload: RegisterPayload): AuthResult {
    const users = this.readUsers();
    const normalizedEmail = payload.email.trim().toLowerCase();

    const alreadyExists = users.some((user) => user.email.toLowerCase() === normalizedEmail);
    if (alreadyExists) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    const newUser: StoredUser = {
      id: `u_${Date.now()}`,
      name: payload.name.trim(),
      email: normalizedEmail,
      password: payload.password
    };

    users.push(newUser);
    this.writeUsers(users);

    const user = this.toAuthUser(newUser);
    this.setSession(user);

    return {
      success: true,
      message: 'Account created successfully. Welcome aboard! 🎉',
      user
    };
  }

  private loginLocal(payload: LoginPayload): AuthResult {
    const normalizedEmail = payload.email.trim().toLowerCase();
    const user = this.readUsers().find(
      (entry) => entry.email.toLowerCase() === normalizedEmail && entry.password === payload.password
    );

    if (!user) {
      return {
        success: false,
        message: 'Invalid email or password. Please try again.'
      };
    }

    const authUser = this.toAuthUser(user);
    this.setSession(authUser);

    return {
      success: true,
      message: `Welcome back, ${authUser.name}!`,
      user: authUser
    };
  }

  logout(): void {
    localStorage.removeItem(this.sessionKey);
    this.currentUserSignal.set(null);
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSignal();
  }

  getUserScopedStorageKey(baseKey: string): string {
    const user = this.currentUserSignal();
    return user ? `${baseKey}_${user.id}` : baseKey;
  }

  private readUsers(): StoredUser[] {
    const raw = localStorage.getItem(this.usersKey);
    return raw ? JSON.parse(raw) : [];
  }

  private writeUsers(users: StoredUser[]): void {
    localStorage.setItem(this.usersKey, JSON.stringify(users));
  }

  private loadSessionUser(): AuthUser | null {
    const raw = localStorage.getItem(this.sessionKey);
    return raw ? JSON.parse(raw) : null;
  }

  private setSession(user: AuthUser): void {
    localStorage.setItem(this.sessionKey, JSON.stringify(user));
    this.currentUserSignal.set(user);
  }

  private toAuthUser(user: StoredUser): AuthUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email
    };
  }
}
