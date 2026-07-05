# EduGov Connect

A Tamil Nadu Government unified school management platform — Stage 10A.

## Tech Stack
- **Frontend:** React 18 + TypeScript, Vite 5, Tailwind CSS v3, React Router v6, Recharts, Framer Motion
- **Backend:** Express + TypeScript, Prisma ORM, PostgreSQL (Replit built-in)
- **Auth:** JWT signed with `SESSION_SECRET` (falls back to `JWT_SECRET`)

## Running

Two workflows must both be running:

| Workflow | Command | Port |
|---|---|---|
| Start application | `npm run dev` | 5000 |
| Backend API | `cd server && npm run dev` | 3001 |

Frontend proxies `/api/*` → `http://localhost:3001`.

## Database Setup (fresh environment)

```bash
# Apply migrations
cd server && npx prisma migrate deploy

# Sync any schema drift and regenerate client
npx prisma db push --accept-data-loss --skip-generate
npx prisma generate

# Seed demo data
npx tsx prisma/seed.ts
```

`DATABASE_URL` is provided automatically by Replit's built-in PostgreSQL.

## Demo Credentials

| Role | Username | Password |
|---|---|---|
| Headmaster | `GOVT_MODEL_HM` | `CHELLAMPALAYAM` |
| Teachers | `teacher_murugan`, `teacher_kavitha`, etc. | `School@2026` |
| Students | `arjun_s001`, `meena_s002`, etc. | `School@2026` |

## User Preferences
- Keep existing project structure and UI
- Do not start Stage 2 unless explicitly asked
