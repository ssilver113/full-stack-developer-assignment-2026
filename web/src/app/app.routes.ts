import { Routes } from '@angular/router';

import { Home } from './home/home';

export const routes: Routes = [
  { path: '', component: Home, title: 'User Management' },
  {
    path: 'users',
    loadChildren: () => import('./users/users.routes').then((m) => m.userRoutes),
  },
  { path: '**', redirectTo: '' },
];
