import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/auth.model';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) return true;

  router.navigate(['/auth/login']);
  return false;
};

// Utilisation dans les routes : data: { roles: ['Admin'] }
export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const rolesAutorises = route.data['roles'] as Role[] | undefined;

  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }

  if (!rolesAutorises || rolesAutorises.length === 0) return true;

  if (authService.hasAnyRole(rolesAutorises)) return true;

  router.navigate(['/']);
  return false;
};
