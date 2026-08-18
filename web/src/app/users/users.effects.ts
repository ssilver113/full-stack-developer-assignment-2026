import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, concatMap, map, of, switchMap, tap } from 'rxjs';

import { UserApi } from './user-api';
import { UsersActions } from './users.actions';

@Injectable()
export class UsersEffects {
  private readonly actions$ = inject(Actions);
  private readonly userApi = inject(UserApi);
  private readonly router = inject(Router);

  loadUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.loadUsers),
      switchMap(() =>
        this.userApi.findAll().pipe(
          map((users) => UsersActions.loadUsersSuccess({ users })),
          catchError((error) => of(UsersActions.loadUsersFailure({ error: toMessage(error) }))),
        ),
      ),
    ),
  );

  // concatMap rather than switchMap: a write already in flight must not be
  // cancelled by the next one.
  createUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.createUser),
      concatMap(({ draft }) =>
        this.userApi.create(draft).pipe(
          map((user) => UsersActions.createUserSuccess({ user })),
          catchError((error) => of(UsersActions.createUserFailure({ error: toMessage(error) }))),
        ),
      ),
    ),
  );

  updateUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.updateUser),
      concatMap(({ id, draft }) =>
        this.userApi.update(id, draft).pipe(
          map((user) => UsersActions.updateUserSuccess({ user })),
          catchError((error) => of(UsersActions.updateUserFailure({ error: toMessage(error) }))),
        ),
      ),
    ),
  );

  // A saved user is only visible on the list, so send the form there once the
  // write has actually succeeded.
  returnToList$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(UsersActions.createUserSuccess, UsersActions.updateUserSuccess),
        tap(() => this.router.navigate(['/users'])),
      ),
    { dispatch: false },
  );
}

// Status 0 is the only case where no response arrived; anything else was answered
// by the server, so its RFC 7807 detail is the honest message to show.
function toMessage(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'The server could not be reached. Please try again.';
  }
  return error.error?.detail ?? 'Something went wrong. Please try again.';
}
