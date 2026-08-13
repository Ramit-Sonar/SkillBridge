# SkillBridge Production Operations

This document explains the basic production checks, backup steps, rollback steps,
and load testing notes for SkillBridge.

## Health Check

Use this endpoint to check whether the API process is running:

```bash
GET /api/health
```

Expected response:

```json
{
  "statusCode": 200,
  "success": true,
  "message": "SkillBridge API is running",
  "database": "connected"
}
```

If `database` is `disconnected`, the API process is alive but MongoDB is not
connected.

## Required Production Environment

Backend production must provide:

- `MONGODB_URI`
- `CORS_ORIGIN`
- `ACCESS_TOKEN_SECRET`
- `ACCESS_TOKEN_EXPIRY`
- `REFRESH_TOKEN_SECRET`
- `REFRESH_TOKEN_EXPIRY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `FRONTEND_URL`

Frontend production must provide:

- `VITE_API_URL`, for example `https://your-backend.example.com/api/v1`
- `VITE_SOCKET_URL`, for example `https://your-backend.example.com`

Local development can keep using the Vite proxy and local backend defaults.

## Database Backup

Before deploying backend changes, take a MongoDB backup from the production
database provider or with `mongodump`:

```bash
mongodump --uri="<production-mongodb-uri>" --out="./backup-YYYY-MM-DD"
```

Store the backup outside the server, for example in secure cloud storage.

## Database Restore

To restore from a known-good backup:

```bash
mongorestore --uri="<production-mongodb-uri>" "./backup-YYYY-MM-DD"
```

Always restore to a staging database first when possible, then verify login,
jobs, applications, projects, messages, reports, and admin pages.

## Rollback Plan

1. Keep the previous deployment version available in Render/Vercel.
2. If a deployment fails, redeploy the previous backend and frontend versions.
3. If data was damaged, restore the latest verified MongoDB backup.
4. Check `/api/health`.
5. Verify login, job browsing, project messages, file downloads, and admin lists.

## Load Testing Notes

Recommended smoke load test areas:

- `GET /api/health`
- `GET /api/v1/jobs?limit=50`
- `GET /api/v1/projects/:projectId/messages?page=1&limit=30`
- `POST /api/v1/projects/:projectId/messages`
- `GET /api/v1/admin/users?limit=50`
- `GET /api/v1/reports?limit=50`

Expected behavior:

- Large lists return only one bounded page.
- Message creation is rate limited to reduce spam bursts.
- Report creation is rate limited to reduce abuse.
- Socket.IO continues real-time message delivery while old polling pressure is
  avoided.
- The server closes HTTP, Socket.IO, and MongoDB connections during shutdown.
