# API Reference

NexusWiki is primarily a server-rendered Next.js application. This document summarizes the main server-side modules and actions that behave like an internal API surface.

> Note: There are currently no documented public REST or route-handlers under `src/app/api`. The modules below are intended for internal use within the app.

---

## Server Actions

### `src/app/actions/invites.ts`

Handles creation and acceptance of organization invites.

#### Responsibilities

- Create invites for users to join an organization.
- Validate invite tokens or codes.
- Accept invites and create memberships.
- Enforce invite expiration rules (invites expire after 7 days).

#### Typical Usage

- Called from UI components that:
  - Send an invite email to a user.
  - Allow a user to accept an invite and join an organization.

#### Behavior Notes

- Requires a valid `Invite` record and token.
- On acceptance, links the user to the target organization via a `Membership`.
- Uses environment variables for email sending (see `RESEND_API_KEY`, `RESEND_FROM_EMAIL`).

---

### `src/app/actions/wiki.ts`

Manages creation and organization of wiki content.

#### Responsibilities

- Create and manage:
  - Spaces (top-level areas within an organization).
  - Folders (hierarchical grouping within spaces).
  - Pages (content documents within folders or spaces).

#### Typical Usage

- Called from UI components that:
  - Create a new space for an organization.
  - Create or move folders.
  - Create, update, or delete pages.

#### Behavior Notes

- Uses the Prisma client (`src/lib/db.ts`) to persist data.
- Enforces relationships between:
  - Organizations → Spaces
  - Spaces → Folders → Pages

---

## Library Modules

### `src/lib/auth.ts`

Configures authentication using NextAuth.

#### Responsibilities

- Set up NextAuth configuration.
- Configure Google OAuth provider.
- Integrate with Prisma via `@auth/prisma-adapter`.
- Expose helpers used by server components and actions to:
  - Get the current session.
  - Get the current authenticated user.

#### Environment Variables

- `NEXTAUTH_URL` – Base URL for NextAuth.
- `NEXTAUTH_SECRET` – Secret used to sign tokens.
- `GOOGLE_CLIENT_ID` – Google OAuth client ID.
- `GOOGLE_CLIENT_SECRET` – Google OAuth client secret.

---

### `src/lib/db.ts`

Initializes and exports the Prisma client.

#### Responsibilities

- Provide a singleton Prisma client instance for database access.
- Avoid multiple Prisma client instances in development (hot reload).

#### Typical Usage

Imported by server actions and other server-side modules:

- `src/app/actions/invites.ts`
- `src/app/actions/wiki.ts`
- Any other module that needs to read/write from the database.

---

### `src/lib/env.ts`

Validates and exposes environment variables.

#### Responsibilities

- Define a schema for required environment variables (using `zod`).
- Validate `process.env` at startup.
- Provide a typed, safe way to access environment variables throughout the app.

#### Environment Variables (selected)

- `DATABASE_URL` – Database connection string.
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

---

## Data Models (Prisma)

These models are defined in the Prisma schema (see `prisma/schema.prisma`) and are accessed via `@prisma/client` through `src/lib/db.ts`.

### `User`

Represents an application user.

#### Key Fields (conceptual)

- `id`
- `name`
- `email`
- Relations:
  - Memberships in organizations.

---

### `Organization`

Represents an organization (company or team).

#### Key Fields (conceptual)

- `id`
- `name`
- `slug`
- Relations:
  - Memberships (users in this organization).
  - Spaces (wiki areas under this organization).

---

### `Membership`

Links users to organizations.

#### Key Fields (conceptual)

- `id`
- `userId`
- `organizationId`
- `role` (e.g., member/admin)
- `createdAt`

---

### `Invite`

Represents an invitation to join an organization.

#### Key Fields (conceptual)

- `id`
- `email`
- `role`
- `token`
- `expiresAt`
- `organizationId`

#### Behavior Notes

- Invites expire after 7 days.
- A valid token or code is required to accept an invite.
- Used by `src/app/actions/invites.ts` and email flows (Resend).

---

## Email / Notifications

### Resend Integration

Email sending (e.g., invite emails) is handled via the Resend service.

#### Environment Variables

- `RESEND_API_KEY` – API key for Resend.
- `RESEND_FROM_EMAIL` – From address used when sending invites.

---

## Authentication & Sessions

Authentication is handled via NextAuth with Google as a provider.

- Configuration: `src/lib/auth.ts`
- Depends on:
  - `@auth/prisma-adapter`
  - `@prisma/client`
  - Google OAuth credentials
- Sessions are used by server actions to:
  - Determine the current user.
  - Enforce access control for organizations, spaces, and pages.

---

## Notes and Gotchas

- All required environment variables must be set before running the app; `src/lib/env.ts` will validate them.
- Database schema changes require running Prisma migrations.
- Invite-related actions enforce a 7-day expiration window and require a valid token.