# User Management

An Angular front end and a Spring Boot REST API for creating, listing and editing
users. The UI reads its data from an NgRx Store; the API persists users to H2,
with the schema managed by Flyway migrations.

## Prerequisites

- **JDK 21** — on `JAVA_HOME` or `PATH`
- **Node.js** `^20.19`, `^22.12`, or `>=24`

Nothing else needs installing: the Gradle wrapper is committed, and the Angular CLI
comes from the project's dev dependencies.

## Running it

The API and the web app are two independent builds and run as two processes. Start
the API first, since the web app proxies to it.

### API — <http://localhost:8080>

```bash
cd api
./gradlew bootRun
```

On Windows, `.\gradlew.bat bootRun`. Flyway creates the schema on first boot, in a
file-based database at `api/data/usersdb.mv.db`, so data survives a restart.

This starts under the `dev` profile, which enables the H2 console at
<http://localhost:8080/h2-console> — JDBC URL `jdbc:h2:file:./data/usersdb`, user
`sa`, empty password.

### Web — <http://localhost:4200>

```bash
cd web
npm ci
npm start
```

The dev server proxies `/api` to port 8080, so the browser talks to a single origin
and no CORS configuration is needed.

## Tests

```bash
cd api && ./gradlew test
```

```bash
cd web && npm test
```

The backend tests cover the user service against a real H2 database and the
controller with the service mocked. The frontend tests cover the users reducer and
the form's validation, and run headless.

## API

Base path `/api/users`.

| Method | Path | Request | Success |
| --- | --- | --- | --- |
| `GET` | `/api/users` | — | `200` + `UserResponse[]` |
| `GET` | `/api/users/{id}` | — | `200` + `UserResponse` |
| `POST` | `/api/users` | `UserRequest` | `201` + `Location` + `UserResponse` |
| `PUT` | `/api/users/{id}` | `UserRequest` | `200` + `UserResponse` |

`UserRequest` is `{ firstName, lastName, email }`; `UserResponse` adds the
server-assigned `id`. All three fields are mandatory and `email` must be a valid
address. Addresses are trimmed and lower-cased before being stored or compared, so
`Bob@example.com` and `bob@example.com` are the same mailbox.

Errors are RFC 9457 problem details: `400` on validation failure, carrying an
`errors` map keyed by field; `404` for an unknown id; `409` for an email that is
already registered.
