# Deployment notes

## Prerequisites

- Node.js 20+ (developed on Node 24)
- PostgreSQL 14+
- Reverse proxy / TLS terminator in production

## Database

1. Create an empty database and application role with limited privileges
2. Set `DATABASE_URL`
3. Run `npx prisma migrate deploy`
4. Do **not** run the development seed in production
5. Create the first administrator through a controlled process (see README)

## Application

1. Set `AUTH_SECRET`, `NEXTAUTH_URL`, SMTP variables as needed
2. `npm ci`
3. `npm run build`
4. `npm run start` (or use a process manager)

## Media uploads

Facility cover and gallery uploads are written to `public/uploads/facilities/` on the application host. Prefer a persistent volume for that path (or an object-storage adapter later). Ephemeral serverless filesystems will lose uploads on redeploy.

Default chapel photographs in `public/images/` ship with the app and do not require a writable volume.

## Backups

- Nightly logical dumps of PostgreSQL (`pg_dump`)
- Retain at least 14 days of backups for the booking/finance audit trail
- Back up `public/uploads/` separately from the database

## Outstanding decisions

- Payment gateway vendor and reconciliation workflow
- Official fee schedule ownership per authority
- Content moderation SLA for community profiles
- Whether Side Chapel institutional accounts share the same IdP as campus SSO later
