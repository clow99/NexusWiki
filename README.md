# NexusWiki
Internal company wiki for organizing and managing documentation.

NexusWiki is a Next.js-based internal knowledge base for teams and organizations. It provides structured spaces, folders, and pages to organize documentation, along with organization management, invitations, and auditing of key actions.

The app is built on a modern React/Next.js stack with Prisma and PostgreSQL, and integrates authentication and file uploads to support a full-featured internal wiki experience.

## Features

- **Organizations & Memberships**  
  - Create and manage organizations  
  - Invite members with role-based access  
  - Switch between organizations

- **Spaces & Documentation**  
  - Organize content into spaces, folders, and pages  
  - Markdown-based editing with syntax highlighting  
  - Support for rich text and code blocks

- **Authentication & Access Control**  
  - NextAuth-based authentication  
  - Organization membership and roles via Prisma models

- **Invites & Onboarding**  
  - Send and manage invitations to new members  
  - Token-based invite flow with expiration

- **Audit Logging**  
  - View recent actions within the organization  
  - Track key events for compliance and visibility

- **File Uploads & Assets**  
  - Upload and serve assets (e.g., images, attachments)  
  - Organization logo and theme asset management

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript, React 19
- **Styling:** Tailwind CSS 4, @tailwindcss/typography
- **Auth:** NextAuth with @auth/prisma-adapter
- **Database:** PostgreSQL with Prisma ORM
- **Markdown:** @uiw/react-md-editor, react-markdown, remark-gfm, rehype-highlight
- **Email / Notifications:** Resend (configured via environment variables)
- **AI Integration:** OpenAI SDK (configured via environment variables)
- **Build & Tooling:** ESLint, TypeScript, tsx

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm (or another package manager like pnpm/yarn/bun)
- PostgreSQL instance (local or remote)
- Access to required API keys (e.g., OpenAI, email provider) if you plan to use those features

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/clow99/NexusWiki.git
cd NexusWiki

npm install
# or: pnpm install / yarn install / bun install
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Database connection (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"

# Auth (NextAuth) – replace with your own secure values
NEXTAUTH_URL="http://localhost:3000"          # Public base URL
NEXTAUTH_SECRET="your-nextauth-secret"        # Generate a strong random string

# OpenAI integration (optional)
OPENAI_API_KEY="your-openai-api-key"

# Email provider (Resend) (optional)
RESEND_API_KEY="your-resend-api-key"
RESEND_FROM_EMAIL="no-reply@example.com"

# Any additional provider/client IDs and secrets
OAUTH_PROVIDER_CLIENT_ID="your-client-id"
OAUTH_PROVIDER_CLIENT_SECRET="your-client-secret"
```

Adjust the variables according to your environment and providers. Some variables are optional and only required if you enable those integrations.

### Database Setup (Prisma)

Ensure your PostgreSQL instance is running and `DATABASE_URL` is set, then:

```bash
# Push the Prisma schema to the database
npx prisma db push

# (Optional) Run migrations instead of push, if you maintain them
# npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Seed the database (if seed script is configured)
npm run db:seed

# Inspect data in Prisma Studio
npx prisma studio
```

### Run the App Locally

Start the development server:

```bash
npm run dev
# or: pnpm dev / yarn dev / bun dev
```

Then open:

- http://localhost:3000

You can start editing the main page by modifying `src/app/page.tsx` (or other routes under `src/app`). The app supports hot reloading during development.

## Mock Mode

A dedicated mock mode is not currently documented. If you need to run the app without external services (e.g., email, OpenAI), you can:

- Use placeholder API keys in `.env`
- Disable or stub out features that depend on external providers in the relevant components/actions

If a formal mock/fixture system is added, document:

- How to enable it (e.g., `MOCK_MODE=true`)
- Where fixtures live (e.g., `src/mocks/`)

## Project Structure

High-level structure (simplified):

```bash
.
├─ prisma/
│  ├─ schema.prisma        # Database schema and models
│  ├─ seed.ts              # Seed script (referenced by package.json)
│  └─ ...                  # Additional Prisma-related files
├─ public/                 # Static assets (logos, images, etc.)
├─ src/
│  ├─ app/
│  │  ├─ (app)/
│  │  │  ├─ audit/page.tsx   # Audit log UI
│  │  │  ├─ invites/page.tsx # Invite management UI
│  │  │  ├─ orgs/page.tsx    # Organization management UI
│  │  │  ├─ spaces/page.tsx  # Spaces and documentation UI
│  │  │  └─ ...              # Other app routes
│  │  ├─ api/
│  │  │  ├─ auth/[...nextauth]/route.ts   # NextAuth handler
│  │  │  ├─ orgs/theme/logo/route.ts      # Org logo upload
│  │  │  ├─ uploads/route.ts              # File upload
│  │  │  └─ uploads/[assetId]/route.ts    # Asset retrieval
│  │  └─ page.tsx          # Root landing page
│  ├─ app/actions/
│  │  ├─ invites.ts        # Invite-related server actions
│  │  ├─ orgs.ts           # Organization-related server actions
│  │  └─ wiki.ts           # Wiki spaces/folders/pages actions
│  └─ ...                  # Components, lib, hooks, etc.
├─ components.json         # UI components configuration
├─ next.config.ts          # Next.js configuration
├─ tailwind.config.ts      # Tailwind CSS configuration
├─ package.json
└─ README.md
```

## Routes

Key application routes (UI):

| Path              | Description                                  | Auth Required |
| ----------------- | -------------------------------------------- | ------------- |
| `/`               | Landing / entry point                        | Depends on app config |
| `/audit`          | Organization audit log view                  | Yes           |
| `/invites`        | Manage invitations to the organization       | Yes           |
| `/orgs`           | Organization creation and selection          | Yes           |
| `/spaces`         | Manage spaces and documentation hierarchy    | Yes           |

Note: Actual route behavior may depend on your auth and middleware configuration.

## API Endpoints

### Auth

| Method | Path                     | Description                                      |
| ------ | ------------------------ | ------------------------------------------------ |
| GET    | `/api/auth/[...nextauth]` | NextAuth handler (callbacks, sessions, etc.)     |
| POST   | `/api/auth/[...nextauth]` | NextAuth handler (sign-in, sign-out, callbacks)  |

### Organizations / Theme

| Method | Path                    | Description                         |
| ------ | ----------------------- | ----------------------------------- |
| POST   | `/api/orgs/theme/logo`  | Upload/update organization logo     |

### Uploads

| Method | Path                     | Description                                |
| ------ | ------------------------ | ------------------------------------------ |
| POST   | `/api/uploads`           | Handle file uploads                        |
| GET    | `/api/uploads/[assetId]` | Retrieve an uploaded asset by its asset ID |

Additional server-side logic for organizations, invites, and wiki content lives in `src/app/actions/*.ts` and is invoked from the UI rather than exposed as standalone REST endpoints.

## Security Notes

- Never commit `.env` files or any secrets (API keys, database passwords, OAuth secrets) to version control.
- Use strong, unique values for `NEXTAUTH_SECRET` and any other cryptographic secrets.
- Restrict database access to trusted networks and use least-privilege credentials.
- When deploying, ensure HTTPS is enforced and environment variables are configured via your hosting platform’s secret management.
- Review upload size/type limits and storage configuration to avoid abuse.

## Development

Common npm scripts:

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server (after build)
npm run start

# Lint the codebase
npm run lint

# Generate Prisma client
npm run prisma:generate

# Seed the database
npm run db:seed
```

## Docker

A Docker setup is not currently documented in this repository. To containerize the app, you can:

- Create a `Dockerfile` that:
  - Installs dependencies
  - Builds the Next.js app
  - Runs `next start`
- Optionally add a `docker-compose.yml` to run the app alongside PostgreSQL.

If/when an official Docker configuration is added, document:

- Build command (e.g., `docker build -t nexuswiki .`)
- Run command (e.g., `docker run -p 3000:3000 --env-file .env nexuswiki`)
- Any compose services and volumes.

## Cron / Scheduled Scans

There are no documented cron or scheduled scan jobs at this time. If you add scheduled tasks (e.g., cleanup jobs, audit exports), document:

- The scheduler (e.g., hosted cron, GitHub Actions, platform-specific scheduler)
- The endpoints or scripts invoked
- Any required environment variables

## License

License information is not yet specified in this repository.  
Add a `LICENSE` file (e.g., MIT, Apache-2.0, or your preferred license) and update this section accordingly.