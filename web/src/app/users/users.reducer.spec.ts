import { User } from './user';
import { UsersActions } from './users.actions';
import { UsersState, usersFeature } from './users.reducer';

const reducer = usersFeature.reducer;

const ada: User = { id: 1, firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' };
const alan: User = { id: 2, firstName: 'Alan', lastName: 'Turing', email: 'alan@example.com' };

const loading: UsersState = { users: [], loading: true, error: null };
const loaded: UsersState = { users: [ada, alan], loading: false, error: null };

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

  it('records the error and stops loading when a load fails', () => {
    const state = reducer(loading, UsersActions.loadUsersFailure({ error: 'Service unavailable' }));

    expect(state.error).toBe('Service unavailable');
    expect(state.loading).toBe(false);
  });

  it('clears a leftover error when a form opens', () => {
    const failed: UsersState = { users: [ada], loading: false, error: 'Email already registered' };

    const state = reducer(failed, UsersActions.formOpened());

    expect(state.error).toBeNull();
    expect(state.users).toEqual([ada]);
  });
});
