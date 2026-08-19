import { Component, ElementRef, OnInit, computed, effect, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { of, switchMap } from 'rxjs';

import { UsersActions } from '../users.actions';
import { usersFeature } from '../users.reducer';

// Declaration order, so a failed submit lands on the topmost problem.
const FIELD_NAMES = ['firstName', 'lastName', 'email'] as const;

type FieldName = (typeof FIELD_NAMES)[number];

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

// Validators.required accepts whitespace-only input, which the API's @NotBlank
// then rejects; trimming first keeps the two rules identical.
function nonBlank(control: AbstractControl<string>): ValidationErrors | null {
  return control.value.trim().length === 0 ? { required: true } : null;
}

@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './user-form.html',
  styleUrl: './user-form.scss',
})
export class UserForm implements OnInit {
  private readonly store = inject(Store);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly id = input<string>();

  protected readonly form = this.formBuilder.group({
    firstName: ['', [nonBlank, Validators.maxLength(100)]],
    lastName: ['', [nonBlank, Validators.maxLength(100)]],
    email: ['', [nonBlank, Validators.email, Validators.maxLength(320)]],
  });

  protected readonly busy = this.store.selectSignal(usersFeature.selectLoading);
  protected readonly error = this.store.selectSignal(usersFeature.selectError);
  private readonly missing = this.store.selectSignal(usersFeature.selectNotFound);

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

  // An id that matches nothing is missing without asking; anything else is
  // missing only because the API said so with a 404.
  protected readonly notFound = computed(() => this.target().mode === 'invalid' || this.missing());

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
    // A malformed id matches nothing, so it is not worth any dispatch.
    const target = this.target();
    if (target.mode === 'invalid') {
      return;
    }

    // An error carried over from an earlier attempt does not describe this form.
    this.store.dispatch(UsersActions.formOpened());

    // The edit page can be opened directly, so the user it edits is fetched
    // rather than assumed to be sitting in the store from the list page.
    if (target.mode === 'edit') {
      this.store.dispatch(UsersActions.loadUser({ id: target.id }));
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

  private focusFirstInvalid(): void {
    const field = FIELD_NAMES.find((name) => this.form.controls[name].invalid);
    if (field) {
      this.host.nativeElement.querySelector<HTMLInputElement>(`#${field}`)?.focus();
    }
  }

  protected submit(): void {
    if (this.form.invalid) {
      // Messages are shown once a field is touched, so reveal them all at once.
      this.form.markAllAsTouched();
      // Without this the click is a no-op whenever the messages are already on
      // screen. Focusing carries the screen reader to the field and its message.
      this.focusFirstInvalid();
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
