# NexusWiki User Guide

NexusWiki is an internal company wiki for organizing knowledge into organizations, spaces, folders, and pages. This guide explains how to use the application once it is running.

> For installation and development setup, see the main `README.md`.

---

## 1. Accessing NexusWiki

1. Open your browser and go to your NexusWiki URL (for local development this is typically `http://localhost:3000`).
2. You will be redirected to sign in using Google (configured via NextAuth).

### Sign In

- Click **Sign in with Google**.
- Choose the Google account associated with your organization.
- After successful authentication, you will be redirected into NexusWiki.

If you cannot sign in, contact your administrator to ensure:
- Your Google domain is allowed (if restricted).
- The correct environment variables are configured.

---

## 2. Core Concepts

NexusWiki organizes content in several layers:

- **User** – You, identified by your Google account.
- **Organization** – A company or group that owns content and members.
- **Membership** – Your role within an organization (e.g., member, admin).
- **Space** – A top-level area within an organization (e.g., “Engineering”, “HR”).
- **Folder** – A way to group related pages within a space.
- **Page** – A single document in the wiki, written in Markdown.
- **Invite** – An email invitation to join an organization with a specific role.

You can belong to multiple organizations, each with its own spaces and content.

---

## 3. Organizations

### Viewing Your Organizations

After signing in, you’ll typically see a list or selector of organizations you belong to. From here you can:

- Switch between organizations.
- Open an organization to view its spaces and content.

### Creating an Organization

Depending on configuration, you may see an option like **Create organization**:

1. Click **Create organization**.
2. Enter:
   - **Name** (e.g., “Acme Corp”).
   - **Slug** (a URL-friendly identifier, often generated automatically).
3. Confirm to create.

You will be added as a member of the new organization, usually with an elevated role (e.g., admin/owner).

### Managing Memberships

Within an organization, your permissions depend on your role:

- **Admin/Owner** (typical):
  - Invite new members.
  - Manage roles.
  - Create and manage spaces.
- **Member**:
  - View content.
  - Create and edit pages (depending on configuration).

If you need more permissions, contact an existing admin in your organization.

---

## 4. Invites and Access

Invites allow admins to add new members to an organization.

### Sending an Invite

From an organization where you have permission to manage members:

1. Go to the **Members** or **Invites** section (label may vary).
2. Click **Invite member** (or similar).
3. Fill in:
   - **Email address** of the person you’re inviting.
   - **Role** (e.g., member, admin).
4. Send the invite.

Behind the scenes, NexusWiki:

- Creates an `Invite` record with a unique token.
- Sends an email via Resend to the specified address.
- Sets an expiration (invites typically expire after 7 days).

### Accepting an Invite

1. Open the invite email sent from NexusWiki.
2. Click the invite link.
3. Sign in with Google (if not already signed in).
4. Confirm joining the organization.

If the invite has expired or the token is invalid, you’ll see an error and need a new invite.

---

## 5. Spaces, Folders, and Pages

Content in NexusWiki is structured hierarchically.

### Spaces

Spaces are top-level content areas inside an organization.

Typical examples:
- Engineering
- Product
- HR
- Operations

#### Creating a Space

1. Navigate to the organization where you want the space.
2. Look for a **New space** or **Create space** button.
3. Enter:
   - **Name** (e.g., “Engineering”).
   - Optional description.
4. Save.

The space will appear in the organization’s navigation.

### Folders

Folders group related pages within a space.

#### Creating a Folder

1. Open the space where you want the folder.
2. In the space’s sidebar or content tree, click **New folder**.
3. Enter a folder name (e.g., “Onboarding”, “Architecture”).
4. Save.

You can nest content under folders to keep pages organized.

### Pages

Pages are the actual wiki documents.

#### Creating a Page

1. Navigate to the space (and folder, if applicable) where the page should live.
2. Click **New page**.
3. Enter:
   - **Title**.
   - Optional parent folder (if not already selected).
4. Save to open the editor.

---

## 6. Editing Content

NexusWiki uses a Markdown editor for pages.

### Markdown Editor

When editing a page, you’ll see a text area or rich Markdown editor where you can:

- Type plain text.
- Use Markdown syntax for formatting:
  - `# Heading 1`, `## Heading 2`, etc.
  - `**bold**`, `_italic_`.
  - `-` or `1.` for lists.
  - `[link text](https://example.com)` for links.
- Insert code blocks:
  ````
  ```language
  // your code here
  ```
  ````
  Highlighting is handled by `highlight.js`.

### Preview and Formatting

Depending on the UI, you may have:

- A **Preview** mode to see rendered Markdown.
- A split view with editor and preview side by side.

Use these to verify formatting before saving.

### Saving Changes

- Click **Save** or **Update** to persist your changes.
- If you navigate away without saving, you may lose unsaved edits.

---

## 7. Navigation and Search

While exact UI details may vary, typical navigation includes:

- **Organization switcher** – Change between organizations.
- **Space list** – View all spaces in the current organization.
- **Sidebar/tree** – Browse folders and pages within a space.
- **Breadcrumbs** – See where you are (Organization → Space → Folder → Page).

If a search feature is available, you can:

- Search by page title or content.
- Filter results by space or folder (if supported).

---

## 8. Notifications and Emails

NexusWiki uses Resend for sending emails, such as:

- Organization invites.
- Possibly other notifications (depending on configuration).

If you are not receiving emails:

- Check your spam/junk folder.
- Confirm with an admin that your email address is correct.
- Ask an admin to verify that email sending is configured.

---

## 9. Common Issues and Gotchas

- **Missing environment variables**  
  If the app behaves unexpectedly (e.g., cannot send invites, cannot sign in), the underlying environment may be misconfigured. Contact your admin or development team.

- **Invite expired**  
  Invites expire after a period (e.g., 7 days). If you see an “expired” or “invalid token” message, ask the inviter to send a new invite.

- **Permission denied**  
  If you cannot create spaces, folders, or pages, your role may not allow it. Contact an organization admin to adjust your role.

- **Database or server errors**  
  If you see generic server errors, the backing database or server may be down. Notify your technical team.

---

## 10. Getting Help

If you need help using NexusWiki:

- Check any internal documentation your organization may have added within NexusWiki itself (e.g., a “How to use this wiki” space).
- Contact your organization’s NexusWiki admin or internal IT team.
- For development or deployment issues, refer to the project’s `README.md` and the source code in this repository.