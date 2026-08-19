import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';

import { appConfig } from '../app.config';
import { UserForm } from './user-form/user-form';
import { UserList } from './user-list/user-list';

const ada = { id: 1, firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' };

describe('user routes', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      // The application's own providers, so this covers the real router
      // configuration rather than a copy of it declared for the test.
      providers: [...appConfig.providers, provideHttpClientTesting()],
    });

    harness = await RouterTestingHarness.create();
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  async function respondWith(users: unknown[]): Promise<void> {
    TestBed.inject(HttpTestingController).expectOne('/api/users').flush(users);
    await harness.fixture.whenStable();
  }

  function text(): string {
    return harness.fixture.nativeElement.textContent ?? '';
  }

  it('binds the route id, so an existing user can be edited', async () => {
    await harness.navigateByUrl('/users/1/edit', UserForm);
    await respondWith([ada]);

    const email: HTMLInputElement = harness.fixture.nativeElement.querySelector('#email');
    expect(email.value).toBe('ada@example.com');
  });

  it('reports a missing user instead of an empty edit form', async () => {
    await harness.navigateByUrl('/users/999/edit', UserForm);
    await respondWith([ada]);

    expect(harness.fixture.nativeElement.querySelector('form')).toBeNull();
    expect(text()).toContain('could not be found');
  });

  it('does not reach the API for a malformed id', async () => {
    await harness.navigateByUrl('/users/abc/edit', UserForm);

    TestBed.inject(HttpTestingController).expectNone('/api/users');
    expect(text()).toContain('could not be found');
  });

  it('routes to a blank form for a new user', async () => {
    await harness.navigateByUrl('/users/new', UserForm);

    const heading: HTMLElement = harness.fixture.nativeElement.querySelector('h1');
    expect(heading.textContent?.trim()).toBe('Create user');
  });

  it('lists the users loaded from the API', async () => {
    await harness.navigateByUrl('/users', UserList);
    await respondWith([ada]);

    expect(text()).toContain('Lovelace');
  });
});
