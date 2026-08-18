import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Store, provideState, provideStore } from '@ngrx/store';

import { usersFeature } from '../users.reducer';
import { UserForm } from './user-form';

describe('UserForm', () => {
  let fixture: ComponentFixture<UserForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserForm],
      providers: [provideRouter([]), provideStore(), provideState(usersFeature)],
    }).compileComponents();

    fixture = TestBed.createComponent(UserForm);
    await fixture.whenStable();
  });

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
    await submit();

    expect(messages()).toEqual([
      'First name is required',
      'Last name is required',
      'Email is required',
    ]);
  });

  it('rejects a malformed email address', async () => {
    fill('firstName', 'Ada');
    fill('lastName', 'Lovelace');
    fill('email', 'not-an-email');

    await submit();

    expect(messages()).toEqual(['Email must be a valid address']);
  });

  it('clears the message once the email is corrected', async () => {
    fill('email', 'not-an-email');
    await submit();
    expect(messages()).toContain('Email must be a valid address');

    fill('email', 'ada@example.com');
    await fixture.whenStable();

    expect(messages()).not.toContain('Email must be a valid address');
  });

  it('dispatches a create action once every field is valid', async () => {
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
});
