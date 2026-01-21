# NexusWiki
Internal wiki for organizations, spaces, and pages.

NexusWiki is an internal company knowledge base built with Next.js. It lets teams organize information into organizations, spaces, folders, and pages, with authentication and invitations for controlled access.

The app uses Prisma for database access, NextAuth for authentication (with Google OAuth), and Resend for sending email invites.

## Features

- **Organizations & Memberships** – Create organizations and manage user memberships and roles.
- **Spaces, Folders & Pages** – Structure content hierarchically for clear navigation.
- **Markdown Editing** – Write and edit pages using a Markdown editor with syntax highlighting.
- **Authentication** – Sign in with Google via NextAuth.
- **Invitations** – Invite users to organizations via email; token-based, time-limited invites.
- **Typed Validation** – Environment and input validation using Zod.
- **Prisma ORM** – Type-safe database access and schema management.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript, React
- **Styling**: Tailwind CSS, Radix UI
- **Auth**: NextAuth with `@auth/prisma-adapter`
- **Database**: Prisma ORM (SQL database via `DATABASE_URL`)
- **Email**: Resend
- **Markdown**: `@uiw/react-md-editor`, `react-markdown`, `remark-gfm`, `rehype-highlight`

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm (or another package manager)
- A SQL database (e.g., MySQL/Postgres) reachable via `DATABASE_URL`
- Google OAuth credentials (Client ID & Secret)
- Resend account and API key

### Installation

1. Clone the repository:

   ```bash
   git clone <your-fork-or-clone-url>
   cd NexusWiki
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the project root and configure the required environment variables (see below).

4. Set up the database schema with Prisma (see [Database Setup (Prisma)](#database-setup-prisma)).

5. Seed initial data if needed:

   ```bash
   npm run db:seed
   ```

6. Run the development server:

   ```bash
   npm run dev
   ```

7. Open the app at:

   - http://localhost:3000

### Environment Variables

Create a `.env` file in the project root:

```env
# Database connection string (e.g., MySQL/Postgres)
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/DB_NAME"

# NextAuth base URL (your app URL)
NEXTAUTH_URL="http://localhost:3000"

# NextAuth secret (generate a strong random value)
NEXTAUTH_SECRET="your-nextauth-secret"

# Google OAuth credentials
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Resend email configuration
RESEND_API_KEY="your-resend-api-key"
RESEND_FROM_EMAIL="noreply@example.com"
```

All variables above are required for a fully functional local setup. Validation is handled in `src/lib/env.ts`.

### Database Setup (Prisma)

1. Generate and push the Prisma schema to your database:

   ```bash
   npx prisma db push
   ```

2. (Optional) Seed the database:

   ```bash
   npm run db:seed
   ```

3. (Optional) Open Prisma Studio to inspect data:

   ```bash
   npx prisma studio
   ```

## Mock Mode

This project does not currently expose a dedicated “mock mode”.  
If you need fixtures or mock data:

- Use `npm run db:seed` to populate development data.
- Add or adjust seed data in `prisma/seed.ts`.

## Project Structure

```txt
.
├─ prisma/
│  ├─ schema.prisma        # Prisma schema
│  ├─ seed.ts              # Database seeding script
│  └─ ...                  # Additional Prisma config/migrations
├─ public/                 # Static assets
├─ src/
│  ├─ app/
│  │  ├─ actions/
│  │  │  ├─ invites.ts     # Invite creation/acceptance logic
│  │  │  └─ wiki.ts        # Spaces/folders/pages actions
│  │  └─ ...               # App routes and UI
│  ├─ lib/
│  │  ├─ auth.ts           # NextAuth configuration
│  │  ├─ db.ts             # Prisma client initialization
│  │  └─ env.ts            # Environment variable validation
│  └─ ...                  # Components, utilities, etc.
├─ components.json
├─ next.config.ts
├─ tailwind.config.ts
├─ package.json
└─ README.md
```

## Routes

> Note: Route list is indicative; adjust to match the current `src/app` structure.

| Route                | Method | Description                          | Auth Required |
|----------------------|--------|--------------------------------------|--------------|
| `/`                  | GET    | Landing / dashboard                  | Yes/No (TBD) |
| `/auth/signin`       | GET    | Sign-in page                         | No           |
| `/organizations`     | GET    | List organizations                   | Yes          |
| `/organizations/new` | GET    | Create organization form             | Yes          |
| `/spaces/[id]`       | GET    | View a space and its content         | Yes          |
| `/pages/[id]`        | GET    | View a wiki page                     | Yes          |
| `/invites/[token]`   | GET    | Accept invite via token              | No/Yes (TBD) |

## API Endpoints

This project primarily uses Next.js server actions (e.g., `src/app/actions/invites.ts`, `src/app/actions/wiki.ts`) instead of traditional REST endpoints.

### Auth

- **NextAuth** configuration in `src/lib/auth.ts`
  - Handles Google OAuth sign-in.
  - Uses Prisma adapter for user and session persistence.

### Invites

Defined in `src/app/actions/invites.ts`:

- Create organization invites (email-based).
- Accept invites using a token.
- Enforce invite expiration (e.g., 7 days).

### Wiki (Spaces / Folders / Pages)

Defined in `src/app/actions/wiki.ts`:

- Create and manage spaces.
- Create folders and pages within spaces.
- Update and delete wiki content.

## Security Notes

- Never commit `.env` files or real secrets to version control.
- Use strong, unique values for `NEXTAUTH_SECRET` and database credentials.
- Restrict access to your database and email provider credentials.
- For production:
  - Use HTTPS for `NEXTAUTH_URL`.
  - Rotate keys and secrets regularly.
  - Limit invite token lifetime and scope as needed.

## Development

Common npm scripts:

- `npm run dev` – Start the development server.
- `npm run build` – Create a production build.
- `npm run start` – Start the production server (after build).
- `npm run lint` – Run ESLint.
- `npm run db:seed` – Seed the database via Prisma.

## Docker

Docker support is not configured in this repository by default.

- To containerize the app, add a `Dockerfile` and (optionally) `docker-compose.yml`.
- Ensure environment variables from `.env` are passed into the container securely.

## Cron / Scheduled Scans

There are no built-in cron jobs or scheduled tasks in this project.  
If you need scheduled operations (e.g., invite cleanup), use an external scheduler or background worker and call the relevant server actions or database logic.

## License

License information is not specified in this repository.  
Add a `LICENSE` file to clarify usage and distribution terms.