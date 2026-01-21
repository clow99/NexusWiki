# Getting Started with NexusWiki

This tutorial walks you through setting up NexusWiki locally and creating your first organization, space, and page.

---

## Prerequisites

Make sure you have:

- **Node.js** (LTS recommended)
- **npm** (comes with Node.js)
- A **database** compatible with your `DATABASE_URL` (for example, MySQL)
- A **Google OAuth** client (for authentication)
- A **Resend** account (for sending email invites)

---

## 1. Clone the Repository

```bash
git clone https://github.com/clow99/NexusWiki.git
cd NexusWiki
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

1. Copy the example environment file (if present) or create a new `.env` file in the project root.
2. Add the required variables:

```bash
DATABASE_URL="mysql://user:password@localhost:3306/dbname"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="supersecret"

GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

RESEND_API_KEY="your-resend-api-key"
RESEND_FROM_EMAIL="noreply@example.com"
```

Notes:

- `DATABASE_URL` must point to an existing database.
- `NEXTAUTH_URL` should match the URL where your app runs locally.
- `NEXTAUTH_SECRET` should be a long, random string.
- For Google OAuth, configure your OAuth consent screen and credentials in the Google Cloud Console and set the redirect URL to something like `http://localhost:3000/api/auth/callback/google` (or as documented in your NextAuth configuration).
- `RESEND_FROM_EMAIL` should be a verified sender in Resend.

---

## 4. Set Up the Database

1. Ensure your database server is running.
2. Run Prisma migrations (from the project root):

```bash
npx prisma migrate dev
```

3. (Optional) Seed the database:

```bash
npm run db:seed
```

---

## 5. Run the Development Server

Start the app:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

If everything is configured correctly, you should see the NexusWiki interface.

---

## 6. Sign In

NexusWiki uses **NextAuth** with **Google** as the provider:

1. Click the **Sign in** button.
2. Choose **Sign in with Google**.
3. Complete the OAuth flow.

Your user account will be created automatically on first sign-in.

---

## 7. Create Your First Organization

Once signed in:

1. Navigate to the organizations section (typically visible after login).
2. Click **Create Organization** (or similar action).
3. Provide:
   - **Name** – the display name of your organization.
   - **Slug** – a URL-friendly identifier (often auto-generated).
4. Save to create the organization.

Behind the scenes, this creates an `Organization` record and a `Membership` linking your user to it.

---

## 8. Create a Space, Folders, and Pages

Within your organization:

1. **Create a Space**
   - Go to the spaces area for your organization.
   - Click **New Space**.
   - Enter a name and confirm.
   - This uses the wiki actions in `src/app/actions/wiki.ts` to create a space.

2. **Add Folders (Optional)**
   - Inside a space, create folders to organize content hierarchically.
   - Use the UI option like **New Folder** and provide a name.

3. **Create a Page**
   - Inside a space or folder, click **New Page**.
   - Enter a title.
   - Use the Markdown editor (powered by `@uiw/react-md-editor`) to add content.
   - Save the page.

You now have a basic wiki structure: **Organization → Space → (Folder) → Page**.

---

## 9. Invite Team Members

To collaborate:

1. Go to your organization’s members or invites section.
2. Click **Invite Member**.
3. Enter the teammate’s **email** and select a **role**.
4. Send the invite.

The invite system:

- Creates an `Invite` record with a token and expiration (invites typically expire after 7 days).
- Uses **Resend** to email the invite link from `RESEND_FROM_EMAIL`.
- When the recipient accepts, a `Membership` is created linking them to the organization.

If invites fail:

- Double-check `RESEND_API_KEY` and `RESEND_FROM_EMAIL`.
- Confirm your database is reachable and migrations are up to date.

---

## 10. Common Gotchas

- **Missing env vars**: If the app crashes on startup, verify all required environment variables are set.
- **Database schema changes**: After pulling new code, run `npx prisma migrate dev` again.
- **Invite expiration**: If an invite link no longer works, send a new invite.

---

## 11. Next Steps

Once you’re comfortable with the basics:

- Explore the code in:
  - `src/app/actions/wiki.ts` for wiki operations.
  - `src/app/actions/invites.ts` for invite handling.
  - `src/lib/auth.ts` for authentication configuration.
  - `src/lib/db.ts` for Prisma client setup.
  - `src/lib/env.ts` for environment variable validation.
- Customize styling via `tailwind.config.ts`.
- Prepare for production by:
  - Setting production-ready environment variables.
  - Running `npm run build` and `npm start` behind a reverse proxy.