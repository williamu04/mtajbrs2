# MTA Jebres 2 — Presensi

> A web-based attendance tracking system for **MTA Jebres 2** (a religious/community organization in Jebres, Indonesia). Built with zero framework overhead — vanilla JavaScript on Cloudflare Pages with Supabase PostgreSQL.

## Features

- **Admin Dashboard** — Full CRUD management for groups (*kelompok*), members (*anggota*), and events (*kegiatan*)
- **Public Attendance Page** — Shareable per-event URL where anyone can mark each member as **Hadir** (Present), **Sakit** (Sick), **Izin** (Permitted absence), or **Alpha** (Unexcused absence)
- **Recap/Summary** — Per-event recap page with aggregate stats and sortable member table
- **Statistics** — Admin dashboard tab showing per-event attendance rates and per-member attendance across all events, with sortable columns and group filtering
- **Admin Auth** — Username/password login with JWT tokens signed via Web Crypto API (HMAC-SHA256)
- **Mobile Responsive** — Fully responsive CSS with collapsible group sections, optimized for mobile attendance-taking
- **Indonesian UI** — All labels and statuses in Indonesian language

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Hosting | Cloudflare Pages + Pages Functions |
| Database | Supabase PostgreSQL (free tier) |
| Auth | JWT (Web Crypto API HMAC-SHA256) |
| Backend | Vanilla JavaScript ES Modules (CF Pages Functions) |
| Frontend | Vanilla HTML + CSS + JavaScript |

Zero runtime dependencies — the codebase uses no npm packages at runtime. (`jose` and `@supabase/supabase-js` listed in `package.json` are unused; all auth is done via the native Web Crypto API, and Supabase is queried through a lightweight custom fetch-based REST client.)

## Project Structure

```
├── functions/                  # Cloudflare Pages Functions (backend API)
│   ├── _utils/
│   │   ├── auth.js             # JWT sign, verify, requireAuth middleware
│   │   └── supabase.js         # Custom Supabase REST client (select, insert, update, delete, upsert)
│   └── api/
│       ├── auth/
│       │   ├── login.js        # POST /api/auth/login
│       │   └── verify.js       # GET /api/auth/verify
│       ├── groups/
│       │   ├── index.js        # GET, POST /api/groups
│       │   └── [id].js         # PUT, DELETE /api/groups/:id
│       ├── members/
│       │   ├── index.js        # GET, POST /api/members
│       │   └── [id].js         # PUT, DELETE /api/members/:id
│       ├── events/
│       │   ├── index.js        # GET, POST /api/events
│       │   ├── [id].js         # PUT, DELETE /api/events/:id
│       │   └── [id]/groups.js  # GET, POST /api/events/:id/groups
│       ├── attendance/
│       │   └── [event].js      # GET, POST /api/attendance/:event (public)
│       └── stats.js            # GET /api/stats (admin)
├── public/                     # Static frontend (served by Cloudflare Pages)
│   ├── index.html              # Redirects to login.html
│   ├── login.html              # Admin login page
│   ├── dashboard.html          # Admin dashboard (4 tabs: Kelompok, Anggota, Kegiatan, Statistik)
│   ├── attendance.html         # Public attendance page (?event=UUID)
│   ├── recap.html              # Per-event recap page (?event=UUID)
│   ├── css/
│   │   └── style.css           # Complete responsive stylesheet
│   └── js/
│       ├── api.js              # Fetch wrapper with JWT handling
│       ├── admin.js            # Dashboard CRUD logic + stats
│       ├── attendance.js       # Attendance page logic
│       └── recap.js            # Recap page logic
├── schema.sql                  # Database schema (5 tables)
├── seed.sql                    # Test/seed data
├── PLAN.md                     # Original implementation plan
└── package.json
```

## Database Schema

Five PostgreSQL tables managed via Supabase:

| Table | Purpose |
|-------|---------|
| `groups` | Member groups (e.g., pa-kelompok1, pemudi) |
| `members` | Individual members (nickname + group FK) |
| `events` | Activities/events with date, time, location |
| `group_event` | Many-to-many: which groups participate in which events |
| `member_event` | Attendance records: one row per member per event with status |

Attendance statuses: `hadir` (present), `sakit` (sick), `izin` (permitted absence), `alpha` (unexcused absence).

See `schema.sql` for the full DDL.

## Setup

### 1. Supabase Database

1. Create a free Supabase project at [supabase.com](https://supabase.com)
2. Open the SQL Editor and run the contents of `schema.sql`
3. (Optional) Run `seed.sql` to populate sample data

### 2. Environment Variables

Set the following in your Cloudflare Pages dashboard:

| Variable | Description |
|----------|-------------|
| `ADMIN_USERNAME` | Admin login username |
| `ADMIN_PASSWORD` | Admin login password |
| `JWT_SECRET` | Secret key for HMAC-SHA256 JWT signing (use a long random string) |
| `SUPABASE_URL` | Supabase project URL (e.g., `https://xxxxx.supabase.co`) |
| `SUPABASE_SERVICE_KEY` | Supabase anon/service key (used server-side as the privileged role key) |

### 3. Deploy to Cloudflare Pages

**Via Git (recommended):**

- Push the repo to GitHub
- Connect the repo to Cloudflare Pages
- Build settings: leave blank (no build step needed)
- Set environment variables in the dashboard

**Via Wrangler CLI:**

```bash
npx wrangler pages deploy . --project-name mta-krpd-presensi
```

Set env vars with:

```bash
npx wrangler pages secret put ADMIN_USERNAME
# ... repeat for each variable
```

### 4. Local Development

```bash
npx wrangler pages dev . --binding ADMIN_USERNAME=admin --binding ADMIN_PASSWORD=secret --binding JWT_SECRET=dev-secret --binding SUPABASE_URL=<url> --binding SUPABASE_SERVICE_KEY=<key>
```

The `wrangler pages dev` command serves `public/` statically and runs `functions/` as serverless endpoints locally.

## API Reference

### Admin Endpoints (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Authenticate admin, returns JWT |
| GET | `/api/auth/verify` | Verify JWT validity |
| GET | `/api/groups` | List all groups |
| POST | `/api/groups` | Create a group |
| PUT | `/api/groups/:id` | Update a group |
| DELETE | `/api/groups/:id` | Delete group (cascades to members) |
| GET | `/api/members` | List members (optional `?group_id=`) |
| POST | `/api/members` | Create a member |
| PUT | `/api/members/:id` | Update a member |
| DELETE | `/api/members/:id` | Delete a member |
| GET | `/api/events` | List events (ordered by date desc) |
| POST | `/api/events` | Create an event |
| PUT | `/api/events/:id` | Update an event |
| DELETE | `/api/events/:id` | Delete an event |
| GET | `/api/events/:id/groups` | Get groups assigned to event |
| POST | `/api/events/:id/groups` | Assign groups to event |
| GET | `/api/stats` | Compute attendance statistics |

### Public Endpoints (No Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/attendance/:event` | Get event info + members grouped by group + current attendance |
| POST | `/api/attendance/:event` | Submit batch attendance (upsert) |

## Usage Flow

1. **Admin** logs in at `/login.html` → creates groups, members, and events via the dashboard
2. **Admin** assigns groups to an event → copies the attendance link (e.g., `/attendance.html?event=<UUID>`)
3. **Attendance taker** opens the link → marks each member as Hadir/Sakit/Izin/Alpha → submits
4. **Anyone** views the recap at `/recap.html?event=<UUID>` to see summary stats and member-by-member status
5. **Admin** views per-event and per-member statistics on the dashboard

## Architecture Decisions

- **Attendance endpoints are public** — so multiple people can record attendance without needing admin credentials
- **Batch submission** — attendance is sent as a single upsert array, not individual records
- **Custom Supabase client** — a lightweight fetch-based wrapper avoids the official SDK's ESM/CJS issues in Cloudflare Workers
- **Custom JWT** — uses the native Web Crypto API instead of the `jose` library, keeping the deployable artifact dependency-free
- **No build step** — Cloudflare Pages serves `public/` directly and auto-detects `functions/` as serverless endpoints
