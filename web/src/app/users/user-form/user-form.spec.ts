import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Store, provideState, provideStore } from '@ngrx/store';

import { UsersActions } from '../users.actions';
import { usersFeature } from '../users.reducer';
import { UserForm } from './user-form';

const ada = { id: 1, firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' };

describe('UserForm', () => {
  let fixture: ComponentFixture<UserForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserForm],
      providers: [provideRouter([]), provideStore(), provideState(usersFeature)],
    }).compileComponents();
  });

  // The route parameter has to be set before the first change detection, since
  // the component decides what it is editing during initialisation.
  async function createComponent(id?: string): Promise<void> {
    fixture = TestBed.createComponent(UserForm);
    if (id !== undefined) {
      fixture.componentRef.setInput('id', id);
    }
    await fixture.whenStable();
  }

  function fill(field: string, value: string): void {
    const input: HTMLInputElement = fixture.nativeElement.querySelector(`#${field}`);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
  }

  async function submit(): Promise<void> {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  // Reached through aria-describedby, the way a screen reader reaches it. That
  // keeps these tests indifferent to the order the fields are rendered in and to
  // the class the message is styled with, while still reading the real message.
  function messageFor(field: string): string | null {
    const input: HTMLInputElement = fixture.nativeElement.querySelector(`#${field}`);
    const describedBy = input.getAttribute('aria-describedby');
    if (!describedBy) {
      return null;
    }
    const description: HTMLElement = fixture.nativeElement.querySelector(`#${describedBy}`);
    return description.textContent!.trim();
  }

  // Field messages live inside the form and the store-level alert does not, so
  // this counts validation messages alone.
  function messageCount(): number {
    return fixture.nativeElement.querySelectorAll('form [role="alert"]').length;
  }

  it('shows a message for every field when an empty form is submitted', async () => {
    await createComponent();

    await submit();

    expect(messageFor('firstName')).toBe('First name is required');
    expect(messageFor('lastName')).toBe('Last name is required');
    expect(messageFor('email')).toBe('Email is required');
    expect(messageCount()).toBe(3);
  });

  it('treats whitespace-only input as missing', async () => {
    await createComponent();
    fill('firstName', '   ');
    fill('lastName', '   ');
    fill('email', '   ');

    await submit();

    expect(messageFor('firstName')).toBe('First name is required');
    expect(messageFor('lastName')).toBe('Last name is required');
    expect(messageFor('email')).toBe('Email is required');
    expect(messageCount()).toBe(3);
  });

  it('rejects a malformed email address', async () => {
    await createComponent();
    fill('firstName', 'Ada');
    fill('lastName', 'Lovelace');
    fill('email', 'not-an-email');

    await submit();

    expect(messageFor('email')).toBe('Email must be a valid address');
    // The names are filled in, so nothing else should be complaining.
    expect(messageCount()).toBe(1);
  });

  it('clears the message once the email is corrected', async () => {
    await createComponent();
    fill('email', 'not-an-email');
    await submit();
    expect(messageFor('email')).toBe('Email must be a valid address');

    fill('email', 'ada@example.com');
    await fixture.whenStable();

    expect(messageFor('email')).toBeNull();
  });

  it('moves focus to the first invalid field when a submit is rejected', async () => {
    await createComponent();
    fill('firstName', 'Ada');

    await submit();

    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('#lastName'));
  });

  it('links each message to its own field so it is announced with the input', async () => {
    await createComponent();

    await submit();

    const email: HTMLInputElement = fixture.nativeElement.querySelector('#email');
    expect(email.getAttribute('aria-invalid')).toBe('true');

    const describedBy = email.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();

    const description: HTMLElement = fixture.nativeElement.querySelector(`#${describedBy}`);
    expect(description.textContent!.trim()).toBe('Email is required');
  });

  it('dispatches a create action once every field is valid', async () => {
    await createComponent();
    const dispatch = vi.spyOn(TestBed.inject(Store), 'dispatch');

    fill('firstName', 'Ada');
    fill('lastName', 'Lovelace');
    fill('email', 'ada@example.com');
    await submit();

    expect(dispatch).toHaveBeenCalledWith(
      UsersActions.createUser({
        draft: { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' },
      }),
    );
  });

  it('prefills the form for an existing user', async () => {
    await createComponent('1');

    TestBed.inject(Store).dispatch(UsersActions.loadUserSuccess({ user: ada }));
    await fixture.whenStable();

    const email: HTMLInputElement = fixture.nativeElement.querySelector('#email');
    expect(email.value).toBe('ada@example.com');
  });

  it('asks for the single user being edited rather than the whole list', async () => {
    const dispatch = vi.spyOn(TestBed.inject(Store), 'dispatch');

    await createComponent('1');

    expect(dispatch).toHaveBeenCalledWith(UsersActions.loadUser({ id: 1 }));
    expect(dispatch).not.toHaveBeenCalledWith(UsersActions.loadUsers());
  });

  it('reports a malformed id as not found rather than rendering the form', async () => {
    await createComponent('abc');

    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('could not be found');
  });

  it('does not ask the API for a malformed id', async () => {
    const dispatch = vi.spyOn(TestBed.inject(Store), 'dispatch');

    await createComponent('abc');

    // Narrower than "dispatched nothing at all": the contract is that no fetch is
    // attempted, not that the component may never touch the store.
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: UsersActions.loadUser.type }),
    );
  });

  it('reports a missing user once the API has answered 404', async () => {
    await createComponent('999');

    TestBed.inject(Store).dispatch(UsersActions.userNotFound({ id: 999 }));
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('could not be found');
  });

  it('shows a failed load as an error rather than as a missing user', async () => {
    await createComponent('1');

    TestBed.inject(Store).dispatch(
      UsersActions.loadUserFailure({ error: 'The server could not be reached. Please try again.' }),
    );
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('could not be found');
    expect(fixture.nativeElement.querySelector('[role="alert"]')!.textContent).toContain(
      'could not be reached',
    );
  });

  it('does not claim a user is missing while the load is still in flight', async () => {
    await createComponent('999');

    // loadUser has been dispatched but nothing has come back yet.
    expect(fixture.nativeElement.textContent).not.toContain('could not be found');
  });
});
