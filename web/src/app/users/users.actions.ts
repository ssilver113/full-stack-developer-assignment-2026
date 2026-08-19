import { createActionGroup, emptyProps, props } from '@ngrx/store';

import { User, UserDraft } from './user';

export const UsersActions = createActionGroup({
  source: 'Users',
  events: {
    'Form Opened': emptyProps(),
    'Load Users': emptyProps(),
    'Load Users Success': props<{ users: User[] }>(),
    'Load Users Failure': props<{ error: string }>(),
    'Load User': props<{ id: number }>(),
    'Load User Success': props<{ user: User }>(),
    'Load User Failure': props<{ error: string }>(),
    'User Not Found': props<{ id: number }>(),
    'Create User': props<{ draft: UserDraft }>(),
    'Create User Success': props<{ user: User }>(),
    'Create User Failure': props<{ error: string }>(),
    'Update User': props<{ id: number; draft: UserDraft }>(),
    'Update User Success': props<{ user: User }>(),
    'Update User Failure': props<{ error: string }>(),
  },
});
