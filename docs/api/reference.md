# API Reference

This document describes the main HTTP API endpoints exposed by NexusWiki. All routes are relative to the application base URL (e.g. `https://your-domain.com` or `http://localhost:3000` in development).

Unless otherwise noted, all endpoints return JSON responses and may require authentication.

---

## Authentication

### `GET /api/auth/[...nextauth]`

Handles authentication flows via NextAuth.

**Description**

- Serves the NextAuth configuration endpoint.
- Used internally by the NextAuth client for session handling.

**Typical Uses**

- Retrieving the current session.
- Handling OAuth callbacks.
- Managing sign-in / sign-out flows.

**Notes**

- You normally do not call this directly; use the NextAuth client helpers on the frontend.
- Methods and behavior are determined by the NextAuth configuration in the app.

### `POST /api/auth/[...nextauth]`

Handles POST-based authentication actions via NextAuth.

**Description**

- Processes sign-in, sign-out, and callback actions that require POST.
- Used internally by NextAuth.

**Notes**

- Typically invoked via NextAuth client methods (e.g. `signIn`, `signOut`) rather than manually.

---

## Organizations

### `POST /api/orgs/theme/logo`

Uploads and manages organization theme logos.

**Authentication**

- Requires an authenticated user.
- The user must have permission to modify the organization’s settings.

**Request**

- **Content-Type:** `multipart/form-data`
- **Body:**
  - A file field containing the logo image (exact field name and constraints are defined in the implementation).

**Behavior**

- Validates the uploaded file (type, size, etc.).
- Stores the logo and associates it with the current organization.
- May overwrite an existing logo for that organization.

**Response**

- On success: JSON containing information about the stored logo (e.g. URL or asset identifier).
- On error: JSON error payload with appropriate HTTP status code.

---

## Uploads

### `POST /api/uploads`

Handles file uploads to the server.

**Authentication**

- Typically requires an authenticated user (see implementation for exact rules).

**Request**

- **Content-Type:** `multipart/form-data`
- **Body:**
  - One or more file fields, subject to:
    - Allowed file types.
    - Maximum file size.
    - Any additional constraints defined in the upload schema.

**Behavior**

- Validates file type and size.
- Stores the file in the configured storage backend.
- Generates an asset identifier for later retrieval.

**Response**

- On success: JSON describing the uploaded asset(s), including:
  - Asset ID(s).
  - Possibly URLs or metadata (depending on implementation).
- On error: JSON error payload with validation or permission details.

**Gotchas**

- File uploads are limited to specific types and sizes as defined in the upload schema.
- Requests exceeding limits will be rejected with an error.

---

### `GET /api/uploads/[assetId]`

Retrieves uploaded assets by asset ID.

**Path Parameters**

- `assetId` (string): The unique identifier of the uploaded asset.

**Behavior**

- Looks up the asset by `assetId`.
- Returns the file content or a redirect/stream to the stored asset, depending on implementation.

**Response**

- On success: The file content (binary) or an HTTP redirect to the file location.
- On error:
  - `404 Not Found` if the asset does not exist or is not accessible.
  - Other appropriate HTTP status codes for permission or server errors.

---

## Notes

- All endpoints may rely on a correctly configured database connection via the `DATABASE_URL` environment variable.
- For detailed business logic (e.g. organization creation, invites, wiki management), see the server actions in:
  - `src/app/actions/invites.ts`
  - `src/app/actions/orgs.ts`
  - `src/app/actions/wiki.ts`