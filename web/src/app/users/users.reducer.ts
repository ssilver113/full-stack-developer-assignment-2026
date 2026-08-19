import { createFeature, createReducer, createSelector, on } from '@ngrx/store';

import { User } from './user';
import { UsersActions } from './users.actions';

// A plain array rather than @ngrx/entity. The adapter is the idiomatic default and
// would earn its place with a delete endpoint, pagination or several entity types;
// with four endpoints it would reduce this reducer to delegation.
export interface UsersState {
  users: User[];
  loading: boolean;
  error: string | null;
  // Set only by the API's own 404, so the edit form never has to guess whether a
  // user it cannot see is missing or merely not fetched yet.
  notFound: boolean;
}

const initialState: UsersState = {
  users: [],
  loading: false,
  error: null,
  notFound: false,
};

// Replaces in place, so a user already on the list keeps its row; appends when the
// list has never been loaded, as on a direct visit to the edit page.
function upsert(users: User[], user: User): User[] {
  return users.some((existing) => existing.id === user.id)
    ? users.map((existing) => (existing.id === user.id ? user : existing))
    : [...users, user];
}

export const usersFeature = createFeature({
  name: 'users',
  reducer: createReducer(
    initialState,
    on(UsersActions.formOpened, (state) => ({ ...state, error: null, notFound: false })),
    on(
      UsersActions.loadUsers,
      UsersActions.loadUser,
      UsersActions.createUser,
      UsersActions.updateUser,
      (state) => ({ ...state, loading: true, error: null, notFound: false }),
    ),
    on(UsersActions.loadUsersSuccess, (state, { users }) => ({
      ...state,
      users,
      loading: false,
    })),
    on(UsersActions.loadUserSuccess, (state, { user }) => ({
      ...state,
      users: upsert(state.users, user),
      loading: false,
    })),
    on(UsersActions.userNotFound, (state) => ({ ...state, loading: false, notFound: true })),
    on(UsersActions.createUserSuccess, (state, { user }) => ({
      ...state,
      users: [...state.users, user],
      loading: false,
    })),
    on(UsersActions.updateUserSuccess, (state, { user }) => ({
      ...state,
      users: upsert(state.users, user),
      loading: false,
    })),
    on(
      UsersActions.loadUsersFailure,
      UsersActions.loadUserFailure,
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
