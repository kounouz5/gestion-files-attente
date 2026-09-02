import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      { path: '', redirectTo: 'client/prendre-ticket', pathMatch: 'full' },

      // ---------- Auth ----------
      {
        path: 'auth/login',
        loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent)
      },
      {
        path: 'auth/register',
        loadComponent: () =>
          import('./features/auth/register/register.component').then((m) => m.RegisterComponent)
      },

      // ---------- Client (public) ----------
      {
        path: 'client/prendre-ticket',
        loadComponent: () =>
          import('./features/client/take-ticket/take-ticket.component').then((m) => m.TakeTicketComponent)
      },
      {
        path: 'client/suivi/:id',
        loadComponent: () =>
          import('./features/client/track-ticket/track-ticket.component').then((m) => m.TrackTicketComponent)
      },
      {
        path: 'client/ecran-public',
        loadComponent: () =>
          import('./features/client/public-display/public-display.component').then(
            (m) => m.PublicDisplayComponent
          )
      },
      {
        path: 'client/mes-tickets',
        canActivate: [roleGuard],
        data: { roles: ['Client'] },
        loadComponent: () =>
          import('./features/client/my-tickets/my-tickets.component').then((m) => m.MyTicketsComponent)
      },

      // ---------- Agent ----------
      {
        path: 'agent/workspace',
        canActivate: [roleGuard],
        data: { roles: ['Agent'] },
        loadComponent: () =>
          import('./features/agent/workspace/agent-workspace.component').then(
            (m) => m.AgentWorkspaceComponent
          )
      },

      // ---------- Admin ----------
      {
        path: 'admin/dashboard',
        canActivate: [roleGuard],
        data: { roles: ['Admin'] },
        loadComponent: () =>
          import('./features/admin/dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          )
      },
      {
        path: 'admin/services',
        canActivate: [roleGuard],
        data: { roles: ['Admin'] },
        loadComponent: () =>
          import('./features/admin/services/services-management.component').then(
            (m) => m.ServicesManagementComponent
          )
      },
      {
        path: 'admin/guichets',
        canActivate: [roleGuard],
        data: { roles: ['Admin'] },
        loadComponent: () =>
          import('./features/admin/guichets/guichets-management.component').then(
            (m) => m.GuichetsManagementComponent
          )
      },
      {
        path: 'admin/users',
        canActivate: [roleGuard],
        data: { roles: ['Admin'] },
        loadComponent: () =>
          import('./features/admin/users/users-management.component').then(
            (m) => m.UsersManagementComponent
          )
      },
      {
        path: 'admin/stats',
        canActivate: [roleGuard],
        data: { roles: ['Admin'] },
        loadComponent: () =>
          import('./features/admin/stats/stats.component').then((m) => m.StatsComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
