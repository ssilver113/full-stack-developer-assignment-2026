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

  function messages(): string[] {
    const shown = fixture.nativeElement.querySelectorAll('.user-form__error');
    return Array.from(shown, (element) => (element as HTMLElement).textContent!.trim());
  }

  it('shows a message for every field when an empty form is submitted', async () => {
    await createComponent();

    await submit();

    expect(messages()).toEqual([
      'First name is required',
      'Last name is required',
      'Email is required',
    ]);
  });

  it('treats whitespace-only input as missing', async () => {
    await createComponent();
    fill('firstName', '   ');
    fill('lastName', '   ');
    fill('email', '   ');

    await submit();

    expect(messages()).toEqual([
      'First name is required',
      'Last name is required',
      'Email is required',
    ]);
  });

  it('rejects a malformed email address', async () => {
    await createComponent();
    fill('firstName', 'Ada');
    fill('lastName', 'Lovelace');
    fill('email', 'not-an-email');

    await submit();

    expect(messages()).toEqual(['Email must be a valid address']);
  });

  it('clears the message once the email is corrected', async () => {
    await createComponent();
    fill('email', 'not-an-email');
    await submit();
    expect(messages()).toContain('Email must be a valid address');

    fill('email', 'ada@example.com');
    await fixture.whenStable();

    expect(messages()).not.toContain('Email must be a valid address');
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
    const describedBy = email.getAttribute('aria-describedby');
    expect(describedBy).toBe('email-error');

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

    expect(dispatch).toHaveBeenCalledWith({
      type: '[Users] Create User',
      draft: { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' },
    });
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

    expect(dispatch).toHaveBeenCalledWith({ type: '[Users] Load User', id: 1 });
    expect(dispatch).not.toHaveBeenCalledWith({ type: '[Users] Load Users' });
  });

  it('reports a malformed id as not found rather than rendering the form', async () => {
    await createComponent('abc');

    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('could not be found');
  });

  it('does not ask the API for a malformed id', async () => {
    const dispatch = vi.spyOn(TestBed.inject(Store), 'dispatch');

    await createComponent('abc');

    expect(dispatch).not.toHaveBeenCalled();
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
    expect(fixture.nativeElement.querySelector('.alert')!.textContent).toContain(
      'could not be reached',
    );
  });

  it('does not claim a user is missing while the load is still in flight', async () => {
    await createComponent('999');

    // loadUser has been dispatched but nothing has come back yet.
    expect(fixture.nativeElement.textContent).not.toContain('could not be found');
  });
});
