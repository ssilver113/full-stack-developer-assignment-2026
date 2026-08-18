import { Routes } from '@angular/router';

import { UserForm } from './user-form/user-form';
import { UserList } from './user-list/user-list';

export const userRoutes: Routes = [
  { path: '', component: UserList, title: 'Users' },
  { path: 'new', component: UserForm, title: 'Create user' },
  { path: ':id/edit', component: UserForm, title: 'Edit user' },
];
