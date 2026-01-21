# Architecture Overview

NexusWiki is an internal company wiki built on a modern TypeScript/React stack using Next.js, Prisma, and NextAuth. This document provides a high-level view of the system architecture and how the main pieces fit together.

---

## High-Level Architecture

NexusWiki is a monolithic web application with:

- **Next.js 16 (App Router)** for server-side rendering, routing, and server actions.
- **React 19** for the UI layer.
- **Prisma** as the ORM for database access.
- **NextAuth** for authentication and session management.
- **Resend** for transactional email (e.g., organization invites).

The application is structured around:

- **Organizations** – top-level tenants.
- **Memberships** – link users to organizations with roles.
- **Spaces / Folders / Pages** – hierarchical wiki content within an organization.
- **Invites** – email-based onboarding into organizations.

---

## Application Layers

### 1. Presentation Layer (Next.js / React)

Located primarily under `src/app` and `src/components` (if present):

- **Routing & Layouts**: Next.js App Router organizes pages and layouts by route segments.
- **UI Components**:
  - Tailwind CSS (with `@tailwindcss/typography` and `tw-animate-css`) for styling.
  - Radix UI components (`@radix-ui/react-*`) for accessible primitives.
  - Markdown editing and rendering via:
    - `@uiw/react-md-editor` for editing.
    - `react-markdown`, `remark-gfm`, and `rehype-highlight` for display with syntax highlighting (`highlight.js`).

The UI interacts with the backend primarily through:

- **Server Actions** (e.g., `src/app/actions/wiki.ts`, `src/app/actions/invites.ts`).
- **NextAuth session hooks** on the client side for auth state.

### 2. Application / Domain Layer

Encapsulated in server-side modules and actions:

- `src/app/actions/wiki.ts`
  - Handles creation and management of **spaces**, **folders**, and **pages**.
  - Enforces organization and membership constraints when modifying wiki content.

- `src/app/actions/invites.ts`
  - Creates and sends invites using **Resend**.
  - Validates and accepts invites, linking users to organizations via **Memberships**.
  - Enforces invite expiration (e.g., 7-day validity) and token/code checks.

These actions:

- Run on the server (using Next.js server actions).
- Use the Prisma client (`src/lib/db.ts`) for data access.
- Rely on auth helpers (`src/lib/auth.ts`) to identify the current user and their memberships.

### 3. Infrastructure Layer

#### Authentication

- Implemented via **NextAuth**:
  - Configuration in `src/lib/auth.ts`.
  - Uses `@auth/prisma-adapter` to persist users and sessions in the database.
  - **Google OAuth** is configured as the primary provider using:
    - `GOOGLE_CLIENT_ID`
    - `GOOGLE_CLIENT_SECRET`
  - `NEXTAUTH_URL` and `NEXTAUTH_SECRET` are required for secure operation.

Auth responsibilities:

- User sign-in via Google.
- Session management (JWT or database-backed sessions, depending on config).
- Exposing `getServerSession`-style helpers to server actions and pages.

#### Database Access

- Prisma client initialization in `src/lib/db.ts`.
- Schema and migrations managed under `prisma/`:
  - Models include (at minimum):
    - **User** – core identity, linked to memberships and invites.
    - **Organization** – tenant entity with name/slug.
    - **Membership** – links users to organizations with a role.
    - **Invite** – email-based invitation with token, role, and expiration.

Data access patterns:

- Server actions and API-like logic call Prisma directly through the shared client.
- Prisma migrations must be applied whenever the schema changes.
- `npm run db:seed` runs `prisma/seed.ts` via `tsx` to populate initial data.

#### Environment Configuration

- `src/lib/env.ts`:
  - Uses **Zod** to validate and parse environment variables.
  - Ensures required variables (e.g., `DATABASE_URL`, auth and email settings) are present at startup.

Key environment variables:

- `DATABASE_URL` – connection string for the database.
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET` – NextAuth configuration.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` – Google OAuth.
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL` – Resend email integration.

#### Email Delivery

- **Resend** is used to send transactional emails:
  - Invites to join organizations.
  - Possibly other notifications (if implemented elsewhere).
- Configured via `RESEND_API_KEY` and `RESEND_FROM_EMAIL`.

---

## Data Model Overview

At a high level, the core entities and relationships are:

- **User**
  - Identified by email; may have multiple memberships.
  - Created via NextAuth when a user signs in with Google.

- **Organization**
  - Represents a company or team.
  - Has many memberships and spaces.

- **Membership**
  - Joins a `User` to an `Organization`.
  - Includes a `role` (e.g., admin/member) and timestamps.

- **Invite**
  - Targets an email address and an organization.
  - Contains a token/code, role, and expiration date.
  - On acceptance, creates a `Membership` for the user.

- **Spaces / Folders / Pages** (managed via `wiki.ts`)
  - Hierarchical content structure within an organization.
  - Typically:
    - Organization → Spaces → Folders → Pages.
  - Pages store markdown content and metadata.

---

## Request Flow Examples

### User Sign-In

1. User visits NexusWiki and clicks “Sign in with Google”.
2. NextAuth handles the OAuth flow with Google.
3. On success:
   - User is created/updated in the database via Prisma adapter.
   - A session is established and accessible in server actions and components.

### Accepting an Invite

1. An organization admin triggers an invite via UI.
2. `src/app/actions/invites.ts`:
   - Validates permissions.
   - Creates an `Invite` record in the database.
   - Sends an email via Resend with a tokenized link.
3. Invitee clicks the link:
   - Server action validates the token and expiration.
   - If valid, creates a `Membership` linking the user to the organization.
   - Marks the invite as used/invalid (implementation-specific).

### Creating Wiki Content

1. Authenticated user navigates to a space and creates a page.
2. Client UI submits the action to `src/app/actions/wiki.ts`.
3. The action:
   - Verifies the user’s membership and role for the organization.
   - Creates or updates the relevant `Space`/`Folder`/`Page` via Prisma.
4. Updated content is rendered using React and `react-markdown` with syntax highlighting.

---

## Deployment Considerations

- **Runtime**: Node.js environment compatible with Next.js 16.
- **Database**: Any Prisma-supported database; `DATABASE_URL` must be configured accordingly.
- **Environment**:
  - All required env vars must be set before `next build` / `next start`.
  - Missing or invalid env vars will typically cause startup failures due to `src/lib/env.ts` validation.
- **Migrations & Seeding**:
  - Run Prisma migrations before first start.
  - Optionally run `npm run db:seed` to populate initial data.

---

## Extensibility Notes

- New domain features should:
  - Add/modify Prisma models and run migrations.
  - Implement server actions for business logic.
  - Use `src/lib/auth.ts` for authorization checks.
  - Validate configuration via `src/lib/env.ts` when introducing new env vars.

- UI extensions should:
  - Reuse existing Tailwind and Radix UI patterns.
  - Use the markdown stack (`@uiw/react-md-editor`, `react-markdown`) for content-related features where appropriate.