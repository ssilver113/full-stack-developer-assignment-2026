import { User } from './user';
import { UsersActions } from './users.actions';
import { UsersState, usersFeature } from './users.reducer';

const reducer = usersFeature.reducer;

const ada: User = { id: 1, firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' };
const alan: User = { id: 2, firstName: 'Alan', lastName: 'Turing', email: 'alan@example.com' };

const loading: UsersState = { users: [], loading: true, error: null, notFound: false };
const loaded: UsersState = { users: [ada, alan], loading: false, error: null, notFound: false };

describe('users reducer', () => {
  it('populates the list when a load succeeds', () => {
    const state = reducer(loading, UsersActions.loadUsersSuccess({ users: [ada, alan] }));

    expect(state.users).toEqual([ada, alan]);
    expect(state.loading).toBe(false);
  });

  it('appends a created user to the end of the list', () => {
    const grace: User = {
      id: 3,
      firstName: 'Grace',
      lastName: 'Hopper',
      email: 'grace@example.com',
    };

    const state = reducer(loaded, UsersActions.createUserSuccess({ user: grace }));

    expect(state.users).toEqual([ada, alan, grace]);
  });

  it('replaces an updated user without moving its row', () => {
    const renamed: User = { ...ada, lastName: 'Byron' };

    const state = reducer(loaded, UsersActions.updateUserSuccess({ user: renamed }));

    expect(state.users[0]).toEqual(renamed);
    expect(state.users[1]).toEqual(alan);
    // The previous state must survive intact, or time-travel debugging lies.
    expect(loaded.users[0]).toBe(ada);
  });

  it('adds a singly loaded user to an empty list', () => {
    const state = reducer(loading, UsersActions.loadUserSuccess({ user: ada }));

    expect(state.users).toEqual([ada]);
    expect(state.loading).toBe(false);
  });

  it('refreshes a singly loaded user in place rather than duplicating it', () => {
    const renamed: User = { ...ada, lastName: 'Byron' };

    const state = reducer(loaded, UsersActions.loadUserSuccess({ user: renamed }));

    expect(state.users).toEqual([renamed, alan]);
  });

  it('flags a user the API reports as missing', () => {
    const state = reducer(loading, UsersActions.userNotFound({ id: 999 }));

    expect(state.notFound).toBe(true);
    expect(state.loading).toBe(false);
    // A 404 is not a breakdown, so there is no message to show alongside it.
    expect(state.error).toBeNull();
  });

  it('clears a leftover missing flag when the next load starts', () => {
    const missing: UsersState = { ...loaded, notFound: true };

    const state = reducer(missing, UsersActions.loadUser({ id: 1 }));

    expect(state.notFound).toBe(false);
    expect(state.loading).toBe(true);
  });

  it('records the error and stops loading when a load fails', () => {
    const state = reducer(loading, UsersActions.loadUsersFailure({ error: 'Service unavailable' }));

    expect(state.error).toBe('Service unavailable');
    expect(state.loading).toBe(false);
  });

  it('clears a leftover error when a form opens', () => {
    const failed: UsersState = {
      users: [ada],
      loading: false,
      error: 'Email already registered',
      notFound: false,
    };

    const state = reducer(failed, UsersActions.formOpened());

    expect(state.error).toBeNull();
    expect(state.notFound).toBe(false);
    expect(state.users).toEqual([ada]);
  });
});
