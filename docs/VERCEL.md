# Deploy to Vercel with a cloud database

Your laptop Postgres (`127.0.0.1:55432`) is **not** reachable from Vercel.
Use a hosted PostgreSQL provider (Neon is free and works well).

## 1. Create a Neon database

1. Open [https://console.neon.tech](https://console.neon.tech) and sign in (GitHub is fine).
2. Create a project, e.g. `unza-chapel-portal`.
3. Copy the connection string. It looks like:

```text
postgresql://USER:PASSWORD@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
```

Prefer the **pooled** connection string if Neon shows both (has `-pooler` in the host).

## 2. Connect the GitHub repo on Vercel

1. Open [https://vercel.com/new](https://vercel.com/new).
2. Import `Bwalya-Katwishi/unza-chapel-project`.
3. Framework: Next.js (auto-detected).

## 3. Set environment variables in Vercel

Project → **Settings** → **Environment Variables** → add for Production (and Preview if you want):

| Name | Value |
| --- | --- |
| `DATABASE_URL` | Neon connection string (`sslmode=require`) |
| `AUTH_SECRET` | Long random secret (`openssl rand -base64 32`) |
| `AUTH_URL` | Your Vercel URL, e.g. `https://unza-chapel-project.vercel.app` |
| `NEXTAUTH_URL` | Same as `AUTH_URL` |
| `APP_NAME` | `UNZA Chapel & Community Portal` |
| `APP_TIMEZONE` | `Africa/Lusaka` |
| `CURRENCY` | `ZMW` |
| `EMAIL_ENABLED` | `false` |

Do **not** paste your local `.env` `DATABASE_URL` that points at `127.0.0.1`.

## 4. Deploy

Push to `main` or click **Redeploy**.  
The build runs `prisma migrate deploy`, which creates tables on Neon automatically.

## 5. Seed demo data (optional, once)

From your laptop (with the Neon URL, not local Postgres):

```powershell
$env:DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require"
npm run db:seed
```

Demo password for seed users: `ChangeMe!2026`

## 6. Confirm it works

Open the Vercel site. The home page should load communities/stories instead of the “Database is not connected” banner.

If build fails with Prisma / connection errors, double-check:

- `DATABASE_URL` includes `?sslmode=require`
- The Neon project is not paused (free tier pauses after inactivity — open the Neon console to wake it)
- Env vars are set for the **Production** environment

## Notes

- Uploaded facility photos under `public/uploads/` will not persist on Vercel’s serverless filesystem. Bundled images in `public/images/` are fine.
- After changing env vars, trigger a new deployment.
