# User Management

A small user management application: an Angular front end backed by a Spring Boot
REST API, with users held in NgRx Store and persisted to H2 via Flyway migrations.

The home page offers two actions — **Create User** and **Show User List**. Users are
listed in a table, and each row can be edited. All reads and writes go through the
REST API.

## Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| JDK | 21 | Must be on `JAVA_HOME` or `PATH` to start Gradle |
| Node.js | `^20.19`, `^22.12`, or `>=24` | Required by Angular 21 |

The Gradle build pins its Java toolchain to 21 and includes the Foojay resolver, so
if the JDK it needs is missing it will download a matching one. Gradle's own daemon
still needs a Java 17+ runtime present to start, which is why the JDK is listed as a
prerequisite rather than left entirely to auto-provisioning.

No Gradle or Angular CLI installation is required — the Gradle wrapper is committed,
and the CLI comes from the project's dev dependencies.

## Running it

The API and the web app are two independent builds and run as two processes. Start
the API first, since the web app proxies to it.

### 1. API — <http://localhost:8080>

```bash
cd api
./gradlew bootRun
```

On Windows use `.\gradlew.bat bootRun`.

This starts with the `dev` profile active, which enables the H2 console. Flyway
applies `V1__create_users.sql` on first boot and creates `api/data/usersdb.mv.db`.
The database is file-based, so data survives a restart.

Health check: <http://localhost:8080/actuator/health>

### 2. Web — <http://localhost:4200>

```bash
cd web
npm ci
npm start
```

The dev server proxies `/api` to `http://localhost:8080`, so the browser talks to a
single origin and no CORS configuration is needed. Open <http://localhost:4200>.

## Tests

```bash
cd api && ./gradlew test
```

`UserServiceTest` exercises the service against a real in-memory H2 database —
persistence, listing, updates, and duplicate-email rejection including case
differences. `UserControllerTest` is a `@WebMvcTest` with the service mocked,
covering `201` plus `Location` on create, `400` with per-field messages on invalid
input, and `404` on updating an unknown id.

```bash
cd web && npm test
```

Runs headless via Vitest and exits on completion. The reducer spec asserts that a
successful load populates the list, a create appends, an update replaces a user
**without moving its row**, and a failure records the error while clearing the
loading flag. The form spec drives the rendered DOM, asserting that submitting an
empty form shows a message per field, that a malformed email is rejected, that the
message clears once corrected, and that a valid form dispatches the create action.

## API

Base path `/api/users`.

| Method | Path | Request | Success | Notes |
| --- | --- | --- | --- | --- |
| `GET` | `/api/users` | — | `200 OK` + `UserResponse[]` | |
| `POST` | `/api/users` | `UserRequest` | `201 Created` + `Location` + `UserResponse` | |
| `PUT` | `/api/users/{id}` | `UserRequest` | `200 OK` + `UserResponse` | Full replace |

`UserRequest` is `{ firstName, lastName, email }`; `UserResponse` adds the
server-assigned `id`. All three fields are mandatory, `email` must be a valid
address, and lengths are capped at 100 / 100 / 320 characters to match the schema.

Errors use RFC 7807 problem details:

| Status | Cause |
| --- | --- |
| `400 Bad Request` | Validation failure; the body carries an `errors` map keyed by field |
| `404 Not Found` | Update targets an unknown id |
| `409 Conflict` | Email already registered |

Email addresses are trimmed and lower-cased before any uniqueness check or insert,
so `Bob@example.com` and `bob@example.com` are the same mailbox.

## Data model

```
users
  id          identity primary key
  first_name  varchar(100) not null
  last_name   varchar(100) not null
  email       varchar(320) not null, unique
```

The unique index on `email` is what makes the `409` a database-enforced guarantee
rather than a race-prone application check.

The H2 console is available at <http://localhost:8080/h2-console> while the API runs
under the `dev` profile. Connect with JDBC URL `jdbc:h2:file:./data/usersdb`,
user `sa`, and an empty password.

## Layout

```
.
├── api/   Spring Boot + Gradle project
└── web/   Angular workspace
```

The backend is organised by feature rather than by layer: `UserController`,
`UserService`, `UserRepository`, the `User` entity and its DTOs live together in one
`user` package, so adding a second entity means adding one package instead of
touching five. Application-wide concerns such as the exception handler sit in the
root package.

The front end uses standalone components throughout. A single `UserForm` component
serves both `/users/new` and `/users/:id/edit` — create and edit differ only in which
action is dispatched, not in duplicated markup. The users feature state is registered
on the lazy route rather than at the root, so it ships with the chunk that uses it.
Components read from selectors only and never hold user data in local fields.

## Design notes

**Two builds rather than one bundled jar.** The Angular output could be packaged into
the Spring Boot jar, but that is a packaging concern rather than an architectural one,
and it would obscure the API contract. Keeping them separate also keeps the dev loop
fast.

**A plain array in the reducer rather than `@ngrx/entity`.** The entity adapter is the
idiomatic default and would be the right call with a delete endpoint, pagination, or
several entity types. With three endpoints and no delete it would reduce the reducer to
adapter delegation, which would in turn hollow out the reducer test the brief asks for.
The array keeps the state transitions explicit — the replace-in-place update is real
logic that the test genuinely verifies.

**Java 21 rather than 25.** Nothing in this codebase differs between the two, and
Gradle toolchains require an exact major-version match, so targeting the JDK with the
widest installed base avoids reviewer friction for no code-level cost.

**Angular 21 with NgRx 21.** Angular 22 exists, but pairing it with NgRx would require
a release candidate. This is the newest fully stable, peer-matched combination.

### Deliberate omissions

Left out because the brief does not ask for them, and adding them unasked would be
scope creep rather than diligence:

- **No audit timestamps or optimistic-locking `version` column.** Both would be
  justified in a production system; neither is needed for three endpoints.
- **No delete endpoint**, since the brief specifies create, read and update only.
- **No authentication or authorisation.** The API is open, which is appropriate for
  an assignment and would not be for a deployment.
