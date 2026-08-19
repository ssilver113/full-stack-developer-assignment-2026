import { createFeature, createReducer, createSelector, on } from '@ngrx/store';

import { User } from './user';
import { UsersActions } from './users.actions';

// A plain array rather than @ngrx/entity. The adapter is the idiomatic default and
// would earn its place with a delete endpoint, pagination or several entity types;
// with three endpoints it would reduce this reducer to delegation.
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
