# Madrasa Progress

A small app for tracking madrasa students' daily prayers and learning.

- `/admin`: manage teachers and students, assign students to teachers, view records
- `/teacher`: set daily tasks for each assigned student and see when they ticked each item
- `/student`: tick your own prayers and activities (each tick saves its time), plus a history view

Stack: Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · PostgreSQL · Prisma 7

## Local setup

```bash
npm install
cp .env.example .env          # then fill in the values
npm run db:migrate            # create tables
npm run db:seed               # create the first admin from SEED_ADMIN_*
npm run dev
```

## Project layout

```
prisma/
  schema.prisma        User, Student, DailyRecord
  migrations/          SQL migrations (commit these)
  seed.ts              creates the first admin
src/
  proxy.ts             optimistic route guard (cookie only)
  lib/
    auth.ts            data access layer: getCurrentUser, requireRole
    session.ts         session cookie read/write
    session-token.ts   signed JWT (HS256) helpers
    db.ts              Prisma client (pg driver adapter)
  app/
    login/             sign-in page + login/logout server actions
    admin/             teachers, students, records (admin only)
    teacher/           daily tasks per student + saveTasks action
    student/           today ticking (setTick action) + history
  components/          dashboard shell, nav, UI primitives
```

## Security model

- Passwords hashed with bcrypt (cost 12); hashes are never selected outside login.
- Session: signed JWT in an `HttpOnly`, `SameSite=Lax` cookie (`Secure` in production), 7-day expiry.
- `proxy.ts` gives fast redirects, but **every page and server action calls `requireRole()`**,
  which re-checks the session and the database, so deleted users and role changes apply immediately.

## Deploying to Vercel

1. **Database.** Create a PostgreSQL database (Neon, Supabase, Prisma Postgres, …).
   Note both its *pooled* URL and its *direct* (non-pooled) URL.
2. **Import the repo** in Vercel. `vercel.json` already sets the build command to
   `npm run db:deploy && npm run build`, so pending migrations run on every deploy.
3. **Environment variables** (Production and Preview):

   | Name             | Value                                         |
   | ---------------- | --------------------------------------------- |
   | `DATABASE_URL`   | pooled connection URL                         |
   | `DIRECT_URL`     | direct connection URL (used for migrations)   |
   | `SESSION_SECRET` | output of `openssl rand -base64 48`           |

4. **Deploy.**
5. **Create the first admin** once, from your machine, against the production database:

   ```bash
   DATABASE_URL="<direct url>" SEED_ADMIN_USERNAME=admin SEED_ADMIN_PASSWORD="<strong password>" npm run db:seed
   ```

   Then sign in and create teachers and students from `/admin`.

### Changing the schema later

```bash
npm run db:migrate -- --name describe_change   # creates a migration locally
```

Commit the new folder in `prisma/migrations/`; the next Vercel deploy applies it.

## Known limits

- No login rate limiting. Use strong passwords; add rate limiting (e.g. Vercel Firewall rules on `/login`) if the app is public.
- Changing a password does not sign out sessions already open on other devices; they expire within 7 days. Rotating `SESSION_SECRET` signs everyone out immediately.
