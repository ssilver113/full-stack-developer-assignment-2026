import { createFeature, createReducer, createSelector, on } from '@ngrx/store';

import { User } from './user';
import { UsersActions } from './users.actions';

export interface UsersState {
  users: User[];
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  users: [],
  loading: false,
  error: null,
};

export const usersFeature = createFeature({
  name: 'users',
  reducer: createReducer(
    initialState,
    on(UsersActions.loadUsers, UsersActions.createUser, UsersActions.updateUser, (state) => ({
      ...state,
      loading: true,
      error: null,
    })),
    on(UsersActions.loadUsersSuccess, (state, { users }) => ({
      ...state,
      users,
      loading: false,
    })),
    on(UsersActions.createUserSuccess, (state, { user }) => ({
      ...state,
      users: [...state.users, user],
      loading: false,
    })),
    // Replaced in place, so editing a user does not move its row in the table.
    on(UsersActions.updateUserSuccess, (state, { user }) => ({
      ...state,
      users: state.users.map((existing) => (existing.id === user.id ? user : existing)),
      loading: false,
    })),
    on(
      UsersActions.loadUsersFailure,
      UsersActions.createUserFailure,
      UsersActions.updateUserFailure,
      (state, { error }) => ({ ...state, error, loading: false }),
    ),
  ),
  extraSelectors: ({ selectUsers }) => ({
    selectUserById: (id: number) =>
      createSelector(selectUsers, (users) => users.find((user) => user.id === id)),
  }),
});
