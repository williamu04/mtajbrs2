# AGENTS.md — MTA Jebres 2 Presensi

## Project Overview

A zero-framework web attendance app for MTA Jebres 2, deployed on Cloudflare Pages + Pages Functions with Supabase PostgreSQL. Single admin manages groups, members, and events; attendance recording via public URL (no login needed).

**Language:** 100% JavaScript (ES Modules)
**Hosting:** Cloudflare Pages + Pages Functions
**Database:** Supabase PostgreSQL (REST API)
**Auth:** Custom JWT via Web Crypto API (HMAC-SHA256)
**Runtime deps:** None (npm deps in package.json are unused)

## Key Architecture

```
Browser → Cloudflare Pages
  ├── public/        → static HTML/CSS/JS (served directly)
  └── functions/     → serverless endpoints (CF Pages Functions)
                          └── Supabase REST API (via custom fetch client)
```

## File Reference

### Backend (`functions/`)

| File | Purpose | Key exports |
|------|---------|-------------|
| `functions/_utils/auth.js` | JWT utilities | `signToken(secret)`, `verifyToken(token, secret)`, `requireAuth(request, env)` |
| `functions/_utils/supabase.js` | Custom Supabase REST client | `getSupabase(env)` returns object with `.select()`, `.insert()`, `.update()`, `.updateBy()`, `.delete()`, `.upsert()` |
| `functions/api/auth/login.js` | Admin auth | `onRequestPost` — validates credentials against env vars, returns JWT |
| `functions/api/auth/verify.js` | JWT validation | `onRequestGet` — returns 200 if valid JWT |
| `functions/api/groups/index.js` | Groups CRUD | `onRequestGet`, `onRequestPost` |
| `functions/api/groups/[id].js` | Group by ID | `onRequestPut`, `onRequestDelete` |
| `functions/api/members/index.js` | Members CRUD | `onRequestGet` (supports `?group_id=` filter with join), `onRequestPost` |
| `functions/api/members/[id].js` | Member by ID | `onRequestPut`, `onRequestDelete` |
| `functions/api/events/index.js` | Events CRUD | `onRequestGet` (ordered by date desc), `onRequestPost` |
| `functions/api/events/[id].js` | Event by ID | `onRequestPut`, `onRequestDelete` |
| `functions/api/events/[id]/groups.js` | Event-group assignment | `onRequestGet`, `onRequestPost` (accepts `{ group_ids: [...] }`) |
| `functions/api/attendance/[event].js` | Attendance (public) | `onRequestGet` (event info + members grouped + existing status), `onRequestPost` (upserts batch attendance) |
| `functions/api/stats.js` | Statistics | `onRequestGet` (admin-only, returns per-event + per-member stats) |

### Frontend (`public/`)

| File | Purpose |
|------|---------|
| `public/index.html` | Redirects to `login.html` |
| `public/login.html` | Admin login form → `API.login()` → stores JWT in localStorage |
| `public/dashboard.html` | Admin dashboard with 4 tab views |
| `public/attendance.html` | Public attendance form (`?event=UUID`) |
| `public/recap.html` | Per-event recap/summary (`?event=UUID`) |
| `public/css/style.css` | Complete responsive CSS (mobile-first, 2 breakpoints at 640px and 400px) |
| `public/js/api.js` | `API` singleton object — fetch wrapper with auto JWT attachment, 401 redirect, typed methods |
| `public/js/admin.js` | Dashboard logic: tab switching, CRUD operations, stats rendering, inline editing, sortable tables |
| `public/js/attendance.js` | Attendance page: loads event data, renders radio button groups (Hadir/Sakit/Izin/Alpha), batch submit |
| `public/js/recap.js` | Recap page: loads event data, renders stat cards + sortable member table |

### Config & Data

| File | Purpose |
|------|---------|
| `schema.sql` | Full database DDL (5 tables with FK constraints, CHECK constraints, UNIQUE tuples) |
| `seed.sql` | Seed data with 7 groups and ~90 members |
| `PLAN.md` | Original project plan and design document |

## Database Schema

5 tables in Supabase PostgreSQL:

**`groups`** — `id UUID PK`, `name TEXT NOT NULL`, `description TEXT`, `created_at TIMESTAMPTZ`

**`members`** — `id UUID PK`, `nickname TEXT NOT NULL`, `group_id UUID NOT NULL → groups(id) ON DELETE CASCADE`, `created_at TIMESTAMPTZ`

**`events`** — `id UUID PK`, `name TEXT NOT NULL`, `date DATE NOT NULL`, `start_time TIME`, `end_time TIME`, `location TEXT`, `description TEXT`, `created_at TIMESTAMPTZ`

**`group_event`** — `id UUID PK`, `group_id UUID → groups(id) ON DELETE CASCADE`, `event_id UUID → events(id) ON DELETE CASCADE`, UNIQUE(group_id, event_id)

**`member_event`** — `id UUID PK`, `member_id UUID → members(id) ON DELETE CASCADE`, `event_id UUID → events(id) ON DELETE CASCADE`, `status TEXT CHECK (IN 'hadir','sakit','izin','alpha')`, `notes TEXT`, UNIQUE(member_id, event_id)

## API Patterns

### Pages Functions Convention

Each function file exports named exports matching HTTP methods:
```js
export async function onRequestGet(context) { ... }
export async function onRequestPost(context) { ... }
export async function onRequestPut(context) { ... }
export async function onRequestDelete(context) { ... }
```

`context` object: `{ request, env, params, waitUntil }`

### Auth Pattern

Admin endpoints check auth early:
```js
if (!await requireAuth(request, env)) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
}
```

### Supabase Client Usage

All endpoints use the same pattern:
```js
const supabase = getSupabase(env)
const result = await supabase.select('table', { filters: { column: value }, order: 'column.asc' })
```

Available methods: `select`, `insert`, `update`, `updateBy`, `delete`, `upsert`. See `functions/_utils/supabase.js` for full signatures. The client uses Supabase REST API directly via `fetch`.

### Response Format

Success: `new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } })`
Error: `new Response(JSON.stringify({ error: message }), { status: 4xx/5xx, headers: { 'Content-Type': 'application/json' } })`

### Frontend API Client

The `API` singleton in `public/js/api.js` wraps fetch with:
- Auto-attaches `Authorization: Bearer <token>` from localStorage
- Auto-redirects to `login.html` on 401
- Returns parsed JSON or throws with `.error` field

## Data Flows

### Attendance Recording Flow
1. Admin creates event, assigns groups
2. Attendance page fetches `GET /api/attendance/:event` → returns event + all members in their groups + current status
3. Taker marks each member, submits `POST /api/attendance/:event` with `{ attendance: [{ member_id, status, notes }] }`
4. Server upserts into `member_event` (conflict on `member_id, event_id`)

### Stats Computation Flow
1. Dashboard fetches `GET /api/stats`
2. Server loads all events, group_event links, members, and member_event records
3. Computes per-event: total expected members (sum of group sizes), status counts, hadir rate
4. Computes per-member: total expected events (events their group was assigned to), status counts, hadir rate

## Important Design Decisions

1. **No runtime npm dependencies** — `jose` and `@supabase/supabase-js` are declared in package.json but never imported. All functionality uses native APIs. Do not add imports from these packages.
2. **Public attendance** — The attendance GET/POST endpoints deliberately skip auth so anyone with the event URL can record attendance.
3. **Batch upsert** — All attendance for an event is submitted in one request and upserted by `(member_id, event_id)`.
4. **Cascading deletes** — Deleting a group cascade-deletes its members and their attendance records. The DB schema enforces this via `ON DELETE CASCADE`.
5. **Indonesian language** — All UI text uses Indonesian (`kelompok`, `anggota`, `kegiatan`, `hadir`, `sakit`, `izin`, `alpha`). Status labels and their display names should stay in Indonesian.
6. **No build step** — The project has zero build configuration. CF Pages serves `public/` directly and auto-discovers `functions/`.

## Environment Variables

| Env Var | Where Used |
|---------|-----------|
| `ADMIN_USERNAME` | `functions/api/auth/login.js` |
| `ADMIN_PASSWORD` | `functions/api/auth/login.js` |
| `JWT_SECRET` | `functions/_utils/auth.js` (signToken, verifyToken) |
| `SUPABASE_URL` | `functions/_utils/supabase.js` (constructs REST endpoint) |
| `SUPABASE_SERVICE_KEY` | `functions/_utils/supabase.js` (API key header) |

## Common Tasks

**Adding a new admin-only endpoint:**
1. Create file in `functions/api/<resource>/<action>.js`
2. Import `requireAuth` from `../../_utils/auth` and `getSupabase` from `../../_utils/supabase`
3. Export `onRequestGet` / `onRequestPost` etc.
4. Call `requireAuth(request, env)` at the top, return 401 if null

**Adding a new public endpoint:**
Same as above, but skip the auth check.

**Adding a frontend page:**
1. Add `.html` file in `public/`
2. Link `js/api.js` for API access
3. Create a `.js` file in `public/js/` for page logic
4. Link `css/style.css` for styling

**Modifying attendance statuses:**
Status values are `hadir`, `sakit`, `izin`, `alpha`. Changes require:
1. DB CHECK constraint in `schema.sql`
2. Radio button rendering in `public/js/attendance.js`
3. `statusLabel()` mapping in both `attendance.js` and `recap.js`
4. Any display logic referencing these strings

## Testing

No automated tests exist. Manual testing via the frontend is the current approach.
