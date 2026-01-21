# Architecture Overview

NexusWiki is an internal company wiki built on a modern TypeScript/React stack using Next.js App Router, Prisma, and PostgreSQL. This document provides a high‑level view of the system architecture and how the main pieces fit together.

---

## High-Level Architecture

NexusWiki is a monolithic web application:

- **Frontend and Backend** are implemented in a single Next.js application.
- **Server-side logic** is implemented via:
  - Next.js **server components** and **server actions** under `src/app`.
  - **API routes** under `src/app/api`.
- **Persistence** is handled by **Prisma** with a **PostgreSQL** database.
- **Authentication** is handled by **NextAuth** with a Prisma adapter.
- **File uploads** are handled by custom API routes and stored as assets retrievable via `/api/uploads`.

---

## Core Technologies

- **Next.js 16 (App Router)**  
  - Routing and layouts in `src/app`.
  - Server Components and Server Actions for data fetching and mutations.
- **React 19** for UI.
- **Prisma 6** as the ORM, with schema and migrations under `prisma/`.
- **PostgreSQL** as the primary database (configured via `DATABASE_URL`).
- **NextAuth** for authentication (`/api/auth/[...nextauth]`).
- **Tailwind CSS 4** for styling, plus Radix UI and Lucide icons for UI components.
- **Markdown tooling** (`react-markdown`, `@uiw/react-md-editor`, `remark-gfm`, `rehype-highlight`) for wiki content.
- **OpenAI** (via `openai` package) is available for AI-related features where implemented.
- **Resend** for transactional email where configured (e.g., invites).

---

## Directory Structure (Relevant to Architecture)

- `src/app`
  - `(app)/` – Authenticated application area (organizations, spaces, wiki, audit, invites, etc.).
    - `audit/page.tsx` – Audit log UI.
    - `invites/page.tsx` – Invitation management UI.
    - `orgs/page.tsx` – Organization management UI.
    - `spaces/page.tsx` – Space management UI.
  - `actions/` – **Server Actions** for core domain operations:
    - `invites.ts` – Invite creation/acceptance logic.
    - `orgs.ts` – Organization lifecycle and membership logic.
    - `wiki.ts` – Wiki spaces, folders, and pages CRUD logic.
  - `api/` – **API routes**:
    - `auth/[...nextauth]/route.ts` – NextAuth configuration and handlers.
    - `orgs/theme/logo/route.ts` – Organization logo upload/update.
    - `uploads/route.ts` – File upload endpoint.
    - `uploads/[assetId]/route.ts` – Asset retrieval endpoint.
- `prisma/`
  - `schema.prisma` – Database schema and relations.
  - `seed.ts` – Database seeding logic.
- `public/` – Static assets.
- Root configs – `next.config.ts`, `tailwind.config.ts`, `eslint.config.mjs`, etc.

---

## Data Model Overview

Prisma models define the core domain entities. Key models include:

- **User**
  - Identity and profile (id, name, email, image).
  - Linked to authentication models (accounts, sessions).
  - Related to memberships, invites, and audit logs.

- **Organization**
  - Represents a company or group (id, name, slug).
  - Has many **Memberships**, **Invites**, **Spaces**, and **Audit Logs**.
  - May have theme configuration (e.g., logo via `/api/orgs/theme/logo`).

- **Membership**
  - Connects a **User** to an **Organization**.
  - Stores role/permissions and timestamps.
  - Used for authorization checks across the app.

- **Invite**
  - Invitation to join an organization.
  - Contains email, role, token, expiration, and organization reference.
  - Consumed by server actions in `src/app/actions/invites.ts`.

Additional models (e.g., for spaces, folders, wiki pages, uploads, audit logs) are defined in `schema.prisma` and used by the server actions and pages listed above.

---

## Application Layers

### 1. Presentation Layer (UI)

- Implemented with React components and Next.js pages under `src/app`.
- Uses Tailwind CSS and Radix UI for layout and interaction.
- Wiki content is rendered using `react-markdown` and related plugins for:
  - GitHub-flavored markdown (tables, task lists, etc.).
  - Code highlighting via `rehype-highlight`.
  - Soft line breaks via `remark-breaks`.

### 2. Application / Domain Logic

- Encapsulated primarily in **Server Actions** under `src/app/actions`:
  - `orgs.ts` – Create organizations, manage membership, select active org, etc.
  - `invites.ts` – Generate invite tokens, send invites (via email provider), accept invites.
  - `wiki.ts` – Manage spaces, folders, and wiki pages (CRUD, hierarchy, ordering).
- These actions:
  - Validate input (commonly with Zod where used).
  - Enforce authorization based on the current user and their memberships.
  - Interact with Prisma for database operations.

### 3. API Layer

- **NextAuth** (`/api/auth/[...nextauth]`):
  - Handles login, logout, callbacks, and session management.
  - Uses `@auth/prisma-adapter` to persist users, accounts, and sessions in PostgreSQL.

- **Organization Theme / Logo** (`/api/orgs/theme/logo`):
  - Accepts POST requests to upload or update an organization’s logo.
  - Likely validates file type/size and associates the asset with an organization.

- **Uploads**:
  - `POST /api/uploads` – Handles file uploads (e.g., attachments, images).
    - Enforces file type and size limits as defined in the upload schema.
  - `GET /api/uploads/[assetId]` – Serves stored assets by ID.

These routes are used by the UI and server actions to provide a clean separation between browser requests and server-side logic.

---

## Authentication and Authorization

- **Authentication**
  - Managed by NextAuth with Prisma adapter.
  - Sessions are available server-side (e.g., via `getServerSession`) and used in server actions and pages.

- **Authorization**
  - Based on **Membership** records linking users to organizations with roles.
  - Server actions and pages check:
    - Current user identity.
    - Membership in the active organization.
    - Role-based permissions for actions (e.g., managing invites, spaces, or org settings).

---

## Wiki Structure

Although implementation details live in `wiki.ts` and related components, the conceptual structure is:

- **Organization**
  - **Spaces** – High-level groupings of documentation (e.g., “Engineering”, “HR”).
    - **Folders** – Nested structure within a space.
      - **Pages** – Individual wiki documents written in Markdown.

Server actions in `wiki.ts` manage this hierarchy and are invoked by UI pages under `src/app/(app)/spaces` and related routes.

---

## Audit and Compliance

- The **Audit** page (`src/app/(app)/audit/page.tsx`) surfaces recent actions within an organization.
- Underlying audit log entries are stored in the database (via a Prisma model) and typically created by server actions when sensitive operations occur (e.g., membership changes, invites, wiki modifications).

---

## File Uploads and Assets

- Uploads are initiated from the UI and sent to `POST /api/uploads`.
- Uploaded files are:
  - Validated (type, size).
  - Stored (location depends on implementation; see API route code).
  - Referenced by an `assetId`.
- Assets are retrieved via `GET /api/uploads/[assetId]`, which:
  - Locates the asset.
  - Streams or redirects to the file content.

Organization logos use a similar flow via `/api/orgs/theme/logo`.

---

## Environment and Configuration

- **DATABASE_URL** (required)
  - Connection string for PostgreSQL.
  - Must be set for Prisma migrations and runtime database access.

Other environment variables may be required for:

- Authentication providers (if configured in NextAuth).
- Email delivery (Resend).
- OpenAI integration.

Refer to the NextAuth and provider-specific configuration for details.

---

## Operational Notes and Gotchas

- Ensure `DATABASE_URL` is correctly configured before running:
  - `npx prisma migrate dev`
  - `npm run dev`
- A running PostgreSQL instance is required for:
  - Local development.
  - Running migrations and seeds (`npm run db:seed`).
- File uploads are constrained by:
  - Allowed MIME types.
  - Maximum size limits defined in the upload schema and API route.
- Prisma client is generated automatically on install (`postinstall` runs `prisma generate`), but can be regenerated manually via:
  - `npm run prisma:generate`.

This overview should give you enough context to navigate the codebase and understand how the main architectural pieces interact. For deeper details, inspect the server actions in `src/app/actions`, the Prisma schema in `prisma/schema.prisma`, and the relevant pages under `src/app/(app)`.