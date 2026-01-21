# Getting Started with NexusWiki

This tutorial walks you through setting up NexusWiki locally and taking your first steps inside the app.

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js** (LTS recommended)
- **npm** (comes with Node.js)
- **PostgreSQL** running locally or accessible remotely
- Access to create and manage a PostgreSQL database

---

## 1. Clone the Repository

```bash
git clone https://github.com/clow99/NexusWiki.git
cd NexusWiki
```

---

## 2. Install Dependencies

From the project root:

```bash
npm install
```

This installs all required dependencies for the Next.js app, Prisma, Tailwind, and related tooling.

---

## 3. Configure Environment Variables

Create a `.env` file in the project root (if it does not exist) and add at least:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
```

Replace `user`, `password`, `localhost`, `5432`, and `mydb` with your actual PostgreSQL credentials and database name.

> Note: NexusWiki requires a running PostgreSQL instance. Ensure the database referenced in `DATABASE_URL` exists and is reachable.

---

## 4. Set Up the Database with Prisma

Generate the Prisma client (this also runs automatically after install via `postinstall`):

```bash
npm run prisma:generate
```

Run database migrations to create the schema:

```bash
npx prisma migrate dev
```

Optionally, seed the database with initial data (if a seed script is configured):

```bash
npm run db:seed
```

---

## 5. Start the Development Server

Run the app in development mode:

```bash
npm run dev
```

By default, the app will be available at:

- http://localhost:3000

Open this URL in your browser.

---

## 6. First-Time Use: Core Concepts

Once the app is running, you’ll interact with a few core concepts:

### Organizations

Organizations are the top-level containers for your wiki content.

- Navigate to the **Organizations** section (internally handled by `src/app/(app)/orgs/page.tsx`).
- Create a new organization and give it a name and slug.
- You’ll typically be added as a member of the organization you create.

### Spaces

Spaces help you organize documentation within an organization.

- Go to the **Spaces** section (`src/app/(app)/spaces/page.tsx`).
- Create a new space (e.g., “Engineering”, “Product”, “Operations”).
- Each space can contain folders and pages for your wiki content.

### Wiki Content (Pages, Folders)

NexusWiki uses a wiki-like structure managed by server actions in `src/app/actions/wiki.ts`.

Typical flow:

1. Select an organization.
2. Select or create a space.
3. Create folders and pages to structure your documentation.
4. Use the markdown editor to write content; code blocks are highlighted using `highlight.js`.

---

## 7. Inviting Team Members

To collaborate with others in your organization:

- Open the **Invites** section (`src/app/(app)/invites/page.tsx`).
- Send invitations by email, assigning appropriate roles.
- Invited users receive a token-based invite (backed by the `Invite` model) and can join your organization.

Memberships are tracked via the `Membership` model, linking users to organizations with roles.

---

## 8. Viewing Audit Logs

NexusWiki tracks important actions for transparency and compliance.

- Navigate to the **Audit** section (`src/app/(app)/audit/page.tsx`).
- Review recent actions within your organization (e.g., content changes, membership updates).

---

## 9. Authentication and Sessions

Authentication is handled by NextAuth via:

- `/api/auth/[...nextauth]`

You’ll typically be redirected to sign in when accessing protected areas. User data is stored in the `User` model and related tables (accounts, sessions, etc.).

---

## 10. File Uploads and Assets

NexusWiki supports file uploads and organization branding:

- **Logo uploads**: `/api/orgs/theme/logo`
- **File uploads**: `/api/uploads` (POST)
- **Asset retrieval**: `/api/uploads/[assetId]` (GET)

Be aware that file types and sizes are validated server-side; uploads that don’t meet the criteria will be rejected.

---

## 11. Production Build (Optional)

When you’re ready to test a production-like build:

```bash
npm run build
npm start
```

This runs the optimized Next.js build.

---

## 12. Troubleshooting

Common issues and checks:

- **Database connection errors**
  - Confirm `DATABASE_URL` is correct.
  - Ensure PostgreSQL is running and the database exists.
  - Re-run `npx prisma migrate dev` if schema changes were made.

- **Prisma client errors**
  - Run `npm run prisma:generate` to regenerate the client.
  - Ensure `@prisma/client` and `prisma` versions are compatible (they are pinned in `package.json`).

- **Uploads failing**
  - Check server logs for validation errors.
  - Verify file type and size fall within allowed limits.

---

You now have NexusWiki running locally with an organization, spaces, and initial content. From here, you can explore customizing the UI, extending data models, or integrating with your organization’s workflows.