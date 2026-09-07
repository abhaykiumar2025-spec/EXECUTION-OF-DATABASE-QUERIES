# PillGuard Smart Pill Dispenser

This project uses Node.js, Express, MongoDB, bcrypt, and an HTTP-only JWT cookie. Users authenticate with an email address and password; the browser never stores the session token.

## 1. Install software

Install Node.js 18+ and either MongoDB Community locally or a MongoDB Atlas account. In MongoDB Atlas, create a database user, allow the application IP, and copy the connection string.

## 2. Install dependencies

```powershell
npm install
```

## 3. Configure environment

Copy `.env.example` to `.env` and set:

- `MONGODB_URI` to your MongoDB connection string.
- `JWT_SECRET` to a long random secret.
- `CLIENT_ORIGIN` to the browser origin when deploying separately.

Never commit `.env`.

## 4. Run locally

```powershell
npm start
```

Open <http://localhost:5000>. MongoDB must be connected for authentication.

## Authentication flow

1. `POST /api/auth/register` with `{ "name": "...", "email": "...", "password": "..." }`.
2. `POST /api/auth/login` with `{ "email": "...", "password": "..." }`.
3. The server sets the `pillguard_session` HTTP-only cookie.
4. Complete the patient profile, then access the dashboard.
5. `GET /api/auth/me` returns the authenticated user and `POST /api/auth/logout` clears the cookie.

Helmet, credentialed CORS, bcrypt password hashing, input validation, and secure cookie flags are enabled.

## Testing checklist

- Use an invalid email or weak password; registration must return HTTP 400.
- Register a new account and confirm `users.lastLogin` is set.
- Log in and confirm `/api/auth/me` works with the HTTP-only cookie.
- Log out and confirm `/api/auth/me` returns HTTP 401.
