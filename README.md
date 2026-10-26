# UNZA Chapel & Community Portal

A Next.js + PostgreSQL + Prisma platform for the University of Zambia Chaplaincy: facility bookings, independent Side Chapel authorities, recurring allocations, community profiles, finance tracking and notifications.

**Project folder:** `Desktop\UNZA-Chapel-Community-Portal`

> Seed data, sample fees and organisations are **fictional development placeholders**. Do not present them as official UNZA information. Replace contacts and policy text with approved Chaplaincy content before production.

## Facility photography

Bundled defaults in `public/images/`:

| File | Use |
| --- | --- |
| `hero.jpg` | Site-wide main hero |
| `main-chapel.jpg` | Main Chapel listing |
| `secondary.jpg` | Fallback for Reading Room, Conference Room, and both Side Chapels |

Authority administrators (and the platform super admin) manage listing photos from **Dashboard → Facility photos**. Uploads are stored under `public/uploads/facilities/` and are authority-scoped.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4
- PostgreSQL + Prisma ORM
- Auth.js (`next-auth` v5 beta) credentials sessions
- Zod validation, Vitest tests
- Nodemailer notification transport (optional)

## Quick start (Windows)

### 1. Start the local PostgreSQL cluster used by this project

Docker Desktop was unavailable on the build machine, so the app uses a **project-local PostgreSQL 18 data directory** on port **55432**:

```powershell
cd $([Environment]::GetFolderPath('Desktop') + '\UNZA-Chapel-Community-Portal')
npm run db:start
```

Requires PostgreSQL binaries under `C:\Program Files\PostgreSQL\18` (or 17). The data directory is `.pgdata/` (gitignored).

Alternatively use Docker Compose when Docker Desktop works:

```powershell
docker compose up -d
```

Then set `DATABASE_URL` in `.env` to the Compose credentials from `.env.example`.

### 2. Environment

```powershell
copy .env.example .env
```

Generate a production secret:

```powershell
openssl rand -base64 32
```

Set `AUTH_SECRET` in `.env`.

### 3. Install, migrate, seed

```powershell
npm install
npx prisma migrate dev
npm run db:seed
```

### 4. Run the app

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Seeded accounts (development only)

Password for all seed users: `ChangeMe!2026`

| Email | Role |
| --- | --- |
| `superadmin@example.com` | Platform Super Administrator |
| `chaplaincy.admin@example.com` | Overall Chaplaincy Administrator |
| `catholic.admin@example.com` | Catholic Side Chapel Administrator |
| `ucc.admin@example.com` | UCC / Protestant Side Chapel Administrator |
| `booker@example.com` | Individual Booker |
| `org.rep@example.com` | Organisation Representative |

Change these passwords before any shared or production deployment.

## Booking authorities (enforced in backend)

| Facility | Authority |
| --- | --- |
| Main Chapel | Overall Chaplaincy |
| Reading Room | Overall Chaplaincy |
| Conference Room | Overall Chaplaincy |
| Catholic Side Chapel | Catholic Side Chapel Admin only |
| Protestant Side Chapel | UCC / Protestant Admin only |

Overall administrators **cannot** approve Side Chapel bookings unless an **exceptional access grant** is explicitly created, justified and audit-logged by a Platform Super Administrator.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm test` | Vitest unit/integration tests |
| `npm run db:start` | Start local Postgres on 55432 |
| `npm run db:migrate` | Prisma migrate |
| `npm run db:seed` | Seed fictional development data |
| `npm run db:studio` | Prisma Studio |

## Email notifications

1. Set SMTP host/user/password in `.env`
2. Set `EMAIL_ENABLED=true`
3. Restart the app

If email is disabled, notifications are still stored in-app and email attempts are logged as not sent. The app never claims delivery without transporter confirmation.

## Security notes

- Secrets live only in environment variables (`.env` is gitignored)
- Password hashing via bcrypt
- Middleware protects `/dashboard` and sensitive APIs
- Review endpoints re-check authority server-side
- Organisation booking lists are scoped by membership/authority queries
- Uploaded payment screenshots must never auto-mark payments successful

## Deployment outline

1. Provision managed PostgreSQL
2. Set strong `AUTH_SECRET`, `DATABASE_URL`, `NEXTAUTH_URL`
3. Run `npx prisma migrate deploy` and a controlled first-admin creation process
4. `npm run build && npm run start` (or deploy to your Node host)
5. Configure backups for PostgreSQL and uploaded files
6. Enable SMTP only after credentials are verified

## Outstanding operational decisions

- Official facility capacities, amenities and fee schedules
- Approved Chaplaincy contact details and about copy
- Whether any facility should ever use automatic approval
- Online payment gateway selection (manual verified recording is implemented first)
- Production backup cadence and retention
- Password recovery go-live after SMTP verification

## Creating the first administrator securely (non-seed)

1. Register a normal account via `/auth/register`
2. Using a privileged DB session or Prisma Studio, assign the `PLATFORM_SUPER_ADMIN` or relevant admin role in `UserRole`
3. Force password change / rotate credentials
4. Remove or disable seed accounts before production traffic
