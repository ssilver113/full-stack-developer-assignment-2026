import { Routes } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';

import { UserForm } from './user-form/user-form';
import { UserList } from './user-list/user-list';
import { UsersEffects } from './users.effects';
import { usersFeature } from './users.reducer';

export const userRoutes: Routes = [
  {
    path: '',
    // Feature state is registered here rather than at the root, so it arrives
    // with the lazy chunk that uses it.
    providers: [provideState(usersFeature), provideEffects(UsersEffects)],
    children: [
      { path: '', component: UserList, title: 'Users' },
      { path: 'new', component: UserForm, title: 'Create user' },
      { path: ':id/edit', component: UserForm, title: 'Edit user' },
    ],
  },
];
