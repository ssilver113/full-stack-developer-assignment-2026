import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import { UsersActions } from '../users.actions';
import { usersFeature } from '../users.reducer';

@Component({
  selector: 'app-user-list',
  imports: [RouterLink],
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss',
})
export class UserList {
  private readonly store = inject(Store);

  protected readonly users = this.store.selectSignal(usersFeature.selectUsers);
  protected readonly loading = this.store.selectSignal(usersFeature.selectLoading);
  protected readonly error = this.store.selectSignal(usersFeature.selectError);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.store.dispatch(UsersActions.loadUsers());
  }
}
