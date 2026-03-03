import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {
  readonly isRegister = signal(false);
  readonly error = signal('');
  readonly loading = signal(false);

  email = '';
  password = '';
  name = '';

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  toggle(): void {
    this.isRegister.update(v => !v);
    this.error.set('');
  }

  submit(): void {
    this.error.set('');
    this.loading.set(true);

    const action = this.isRegister()
      ? this.auth.register(this.email, this.password, this.name)
      : this.auth.login(this.email, this.password);

    action.subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/scanner']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'An error occurred');
      },
    });
  }
}
