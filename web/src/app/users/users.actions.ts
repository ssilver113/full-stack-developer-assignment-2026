import { createActionGroup, emptyProps, props } from '@ngrx/store';

import { User, UserDraft } from './user';

export const UsersActions = createActionGroup({
  source: 'Users',
  events: {
    'Form Opened': emptyProps(),
    'Load Users': emptyProps(),
    'Load Users Success': props<{ users: User[] }>(),
    'Load Users Failure': props<{ error: string }>(),
    'Create User': props<{ draft: UserDraft }>(),
    'Create User Success': props<{ user: User }>(),
    'Create User Failure': props<{ error: string }>(),
    'Update User': props<{ id: number; draft: UserDraft }>(),
    'Update User Success': props<{ user: User }>(),
    'Update User Failure': props<{ error: string }>(),
  },
});
