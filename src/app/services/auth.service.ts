import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private readonly currentUser = signal<User | null>(null);
  private readonly _accessToken = signal<string | null>(null);
  private readonly _refreshToken = signal<string | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly accessToken = this._accessToken.asReadonly();
  readonly isAuthenticated = computed(() => !!this._accessToken());

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    this.loadFromStorage();
  }

  register(email: string, password: string, name: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, { email, password, name }).pipe(
      tap((res) => this.setSession(res)),
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap((res) => this.setSession(res)),
    );
  }

  refreshToken(): Observable<TokenResponse> {
    return this.http
      .post<TokenResponse>(`${this.apiUrl}/auth/refresh`, { refreshToken: this._refreshToken() })
      .pipe(tap((tokens) => this.setTokens(tokens)));
  }

  logout(): void {
    this.currentUser.set(null);
    this._accessToken.set(null);
    this._refreshToken.set(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  private setSession(res: AuthResponse): void {
    this.currentUser.set(res.user);
    this.setTokens(res);
    localStorage.setItem('user', JSON.stringify(res.user));
  }

  private setTokens(tokens: TokenResponse): void {
    this._accessToken.set(tokens.accessToken);
    this._refreshToken.set(tokens.refreshToken);
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  }

  private loadFromStorage(): void {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const user = localStorage.getItem('user');

    if (accessToken && refreshToken && user) {
      this._accessToken.set(accessToken);
      this._refreshToken.set(refreshToken);
      this.currentUser.set(JSON.parse(user));
    }
  }
}
