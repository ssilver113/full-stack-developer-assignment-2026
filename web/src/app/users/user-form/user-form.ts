import { Component, OnInit, computed, effect, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { of, switchMap } from 'rxjs';

import { UsersActions } from '../users.actions';
import { usersFeature } from '../users.reducer';

type FieldName = 'firstName' | 'lastName' | 'email';

// A route parameter is a string, so what it identifies is decided here once
// rather than re-derived at each use. Number('abc') would otherwise reach the
// API as /api/users/NaN.
type Target = { mode: 'create' } | { mode: 'edit'; id: number } | { mode: 'invalid' };

// Worded to match the API's own validation messages, so a user never sees the
// same rule phrased two different ways.
const REQUIRED_MESSAGES: Record<FieldName, string> = {
  firstName: 'First name is required',
  lastName: 'Last name is required',
  email: 'Email is required',
};

const MAX_LENGTH_MESSAGES: Record<FieldName, string> = {
  firstName: 'First name must be at most 100 characters',
  lastName: 'Last name must be at most 100 characters',
  email: 'Email must be at most 320 characters',
};

@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './user-form.html',
  styleUrl: './user-form.scss',
})
export class UserForm implements OnInit {
  private readonly store = inject(Store);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly id = input<string>();

  protected readonly form = this.formBuilder.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(320)]],
  });

  protected readonly busy = this.store.selectSignal(usersFeature.selectLoading);
  protected readonly error = this.store.selectSignal(usersFeature.selectError);

  protected readonly target = computed<Target>(() => {
    const raw = this.id();
    if (raw === undefined) {
      return { mode: 'create' };
    }
    return /^\d+$/.test(raw) ? { mode: 'edit', id: Number(raw) } : { mode: 'invalid' };
  });

  protected readonly isEdit = computed(() => this.target().mode === 'edit');

  private readonly existing = toSignal(
    toObservable(this.target).pipe(
      switchMap((target) =>
        target.mode === 'edit'
          ? this.store.select(usersFeature.selectUserById(target.id))
          : of(undefined),
      ),
    ),
  );

  // Editing a user we have not got yet: either still loading, or the load failed.
  protected readonly awaitingUser = computed(() => this.isEdit() && this.existing() === undefined);

  // Absent only once a load has settled. While it is in flight, or when it
  // failed outright, the user's absence has not actually been established.
  protected readonly notFound = computed(() => {
    const target = this.target();
    if (target.mode === 'invalid') {
      return true;
    }
    return target.mode === 'edit' && this.existing() === undefined && !this.busy() && !this.error();
  });

  constructor() {
    // Only prefill an untouched form, so a store update cannot overwrite typing.
    effect(() => {
      const user = this.existing();
      if (user && this.form.pristine) {
        this.form.setValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        });
      }
    });
  }

  ngOnInit(): void {
    // The edit page can be opened directly, with no list in the store to read.
    // A malformed id matches nothing, so it is not worth a request.
    if (this.target().mode === 'edit') {
      this.store.dispatch(UsersActions.loadUsers());
    }
  }

  protected errorFor(field: FieldName): string | null {
    const control = this.form.controls[field];
    if (control.valid || !control.touched) {
      return null;
    }
    if (control.hasError('required')) {
      return REQUIRED_MESSAGES[field];
    }
    if (control.hasError('email')) {
      return 'Email must be a valid address';
    }
    if (control.hasError('maxlength')) {
      return MAX_LENGTH_MESSAGES[field];
    }
    return null;
  }

  protected submit(): void {
    if (this.form.invalid) {
      // Messages are shown once a field is touched, so reveal them all at once.
      this.form.markAllAsTouched();
      return;
    }

    const target = this.target();
    const draft = this.form.getRawValue();
    if (target.mode === 'create') {
      this.store.dispatch(UsersActions.createUser({ draft }));
    } else if (target.mode === 'edit') {
      this.store.dispatch(UsersActions.updateUser({ id: target.id, draft }));
    }
  }
}
