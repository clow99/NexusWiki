# NexusWiki User Guide

NexusWiki is an internal company wiki built with Next.js, designed to help teams organize and manage documentation within organizations.

This guide explains how to use NexusWiki as an end user once your instance is up and running.

---

## Getting Started

### Accessing NexusWiki

1. Open your browser and go to your NexusWiki URL (for local development this is typically `http://localhost:3000`).
2. Sign in using the authentication method configured by your administrator (handled via NextAuth).

If you cannot sign in, contact your administrator to ensure your account or invite has been created.

---

## Organizations

Organizations are the top-level containers for all content in NexusWiki. Everything else (members, spaces, pages) lives inside an organization.

### Viewing and Switching Organizations

1. Navigate to the **Organizations** section (usually available in the main navigation or sidebar).
2. You’ll see a list of organizations you belong to.
3. Select an organization to switch your active context. All spaces, pages, and audit logs will reflect the currently selected organization.

### Creating an Organization

If your role and instance configuration allow it:

1. Go to **Organizations**.
2. Click **Create Organization** (or similar button).
3. Enter:
   - **Name** – the display name of your organization.
   - **Slug** – a short, URL-friendly identifier (often auto-generated).
4. Confirm to create.

You will be added as a member of the new organization, typically with an elevated role (e.g., admin/owner).

---

## Members and Invites

Membership determines who can access an organization and what they can do.

### Inviting New Members

1. Ensure you have permission to manage invites in the current organization.
2. Go to the **Invites** page.
3. Click **New Invite** (or similar).
4. Fill in:
   - **Email address** of the person you want to invite.
   - **Role** (e.g., member/admin) as allowed by your permissions.
5. Send the invite.

The invitee will receive an email (via the configured email provider) with a link to accept the invitation.

### Accepting an Invitation

1. Open the invite email.
2. Click the invitation link.
3. Sign in (or create an account if required by your setup).
4. After accepting, you’ll be added as a member of the organization with the specified role.

If the invite has expired or the token is invalid, you may need to request a new invitation.

---

## Spaces and Content Organization

Within each organization, content is grouped into **Spaces**. Spaces help you separate documentation by team, project, or topic.

### Viewing Spaces

1. Make sure you have selected the correct organization.
2. Go to the **Spaces** page.
3. Browse the list of available spaces. Your access may depend on your role or membership.

### Creating a Space

If you have permission:

1. On the **Spaces** page, click **Create Space**.
2. Provide:
   - **Name** – e.g., “Engineering”, “HR Policies”, “Product Docs”.
   - Optional description or other metadata if prompted.
3. Save to create the space.

Once created, you can add folders and pages (depending on how your instance is configured).

---

## Wiki Pages and Editing

NexusWiki provides a markdown-based editor for creating and maintaining documentation.

### Creating a Page

The exact UI may vary, but generally:

1. Navigate to the **Space** where you want to add content.
2. Choose the appropriate folder or section (if applicable).
3. Click **New Page** (or similar).
4. Enter:
   - **Title** of the page.
   - Optional folder or hierarchy information.
5. Save or continue to the editor.

### Editing Content

NexusWiki uses a markdown editor (powered by `@uiw/react-md-editor` and `react-markdown`):

- **Write mode**: Type your content using Markdown syntax.
  - Use headings (`#`, `##`, `###`), lists, code blocks, links, etc.
  - Tables and task lists are supported via GitHub Flavored Markdown (GFM).
- **Preview mode**: See a rendered view of your content, including:
  - Syntax-highlighted code blocks (via `highlight.js`).
  - Line breaks and formatting as they will appear to readers.

Typical actions:

1. Open a page.
2. Click **Edit**.
3. Modify the content in the editor.
4. Click **Save** or **Publish** to persist your changes.

If you navigate away without saving, your changes may be lost.

---

## File Uploads and Assets

You can attach files or images to your documentation (subject to instance configuration and limits).

### Uploading Files

1. While editing a page, look for an **Upload** or **Attach** option.
2. Choose a file from your device.
3. Wait for the upload to complete.
4. The system will store the file and may insert a link or image reference into your page.

Notes:

- Only certain file types and sizes are allowed (as defined by your administrator).
- Uploaded assets can be retrieved via their unique asset ID.

If an upload fails, check file size/type and try again or contact your administrator.

---

## Organization Branding and Logo

Admins can customize the organization’s appearance, including its logo.

### Updating the Organization Logo

1. Ensure you have admin-level permissions in the organization.
2. Navigate to the **Organization Settings** or **Theme** section (exact label may vary).
3. Look for **Logo** or **Branding**.
4. Upload a new logo image.
5. Save changes.

The logo will be used across the app where organization branding is displayed.

---

## Audit Logs

NexusWiki tracks important actions within each organization for transparency and compliance.

### Viewing the Audit Log

1. Select the organization you want to inspect.
2. Go to the **Audit** page.
3. Review recent actions, which may include:
   - Member invites and role changes.
   - Space and page creation, updates, or deletions.
   - Other administrative actions.

Use filters or search (if available) to narrow down events by user, date, or action type.

Audit logs are read-only; you cannot modify past entries.

---

## Roles and Permissions (Conceptual)

While exact roles may vary per deployment, the system typically distinguishes:

- **Admins/Owners**
  - Manage organizations, members, invites, spaces, and branding.
  - Access audit logs and administrative settings.
- **Members**
  - View and edit content in spaces they have access to.
  - Create pages and possibly new spaces, depending on configuration.
- **Guests/Restricted Users** (if configured)
  - Limited access to specific spaces or pages.

If you are unable to perform an action (e.g., create a space or invite a user), your role may not permit it. Contact an organization admin for assistance.

---

## Troubleshooting

### I can’t sign in

- Confirm you are using the correct sign-in method.
- Check if you have an active invite to the organization.
- If the problem persists, contact your administrator.

### I don’t see my organization

- Make sure you accepted the invitation for that organization.
- Check the **Organizations** page to switch context.
- If it’s still missing, ask an admin to verify your membership.

### My uploads are failing

- Ensure the file type and size comply with your organization’s policy.
- Try again with a smaller file or different format.
- If failures continue, contact your administrator.

### I can’t edit a page or create content

- Your role may be read-only for that space.
- Ask a space or organization admin to adjust your permissions if appropriate.

---

## Where to Get Help

If you encounter issues not covered here:

- Reach out to your internal NexusWiki administrator or support team.
- Provide details such as:
  - What you were trying to do.
  - Any error messages you saw.
  - The organization and space you were working in.

This helps administrators use the audit logs and system configuration to diagnose problems more quickly.