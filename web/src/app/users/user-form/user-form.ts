import { Component, OnInit, computed, effect, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { of, switchMap } from 'rxjs';

import { UsersActions } from '../users.actions';
import { usersFeature } from '../users.reducer';

type FieldName = 'firstName' | 'lastName' | 'email';

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

  protected readonly saving = this.store.selectSignal(usersFeature.selectLoading);
  protected readonly error = this.store.selectSignal(usersFeature.selectError);

  private readonly userId = computed(() => {
    const raw = this.id();
    return raw === undefined ? null : Number(raw);
  });

  protected readonly isEdit = computed(() => this.userId() !== null);

  private readonly existing = toSignal(
    toObservable(this.userId).pipe(
      switchMap((id) =>
        id === null ? of(undefined) : this.store.select(usersFeature.selectUserById(id)),
      ),
    ),
  );

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
    if (this.isEdit()) {
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

    const draft = this.form.getRawValue();
    const id = this.userId();
    if (id === null) {
      this.store.dispatch(UsersActions.createUser({ draft }));
    } else {
      this.store.dispatch(UsersActions.updateUser({ id, draft }));
    }
  }
}
