# AutoExpense

A mobile-first expense & income tracker for a small team (e.g. a car/vehicle rental or ride operation) to log shared expenses and income, split by category and by team member, with monthly summaries and reports — in English or Bengali.

**Live app:** [auto-expense-sigma.vercel.app](https://auto-expense-sigma.vercel.app)

## Overview

AutoExpense is a installable Progressive Web App (PWA) built with Next.js and Supabase. Multiple users (an admin plus team members) log in and record **expenses** (fuel, repairs, tires, driver salary/tips, parking, tax, car wash, oil change, etc.) and **income** (trip fares, rental payments), attach receipt photos, and see:

- A **dashboard** with the current month's profit, income, and expense, month-over-month % change, per-member spending totals, and the 5 most recent transactions (updated live).
- A **transactions** list, filterable by month and by type (all / expense / income).
- **Reports** with category breakdowns and monthly trends (pie + bar charts).
- **Settings** to manage expense categories, switch language (English/Bengali), and manage users (admin only).

## Features

- 🔐 **Username/password login** — usernames are mapped internally to `username@autoexpense.app` Supabase Auth accounts (no real email required from users).
- 👥 **Multi-user, role-based** — `admin` and `member` roles; admins can create/deactivate users from the Users page.
- 💸 **Expense tracking** — amount, category, date, note, and an optional receipt photo (auto-compressed client-side before upload).
- 💰 **Income tracking** — amount, income source (e.g. trip fare, rental payment), date, note.
- 📊 **Live dashboard** — monthly profit/income/expense cards with % change vs. previous month, per-member contribution totals, and a live-updating recent-activity feed (via Supabase Realtime).
- 📁 **Category management** — add/manage custom expense categories, each auto-assigned an icon and color.
- 📈 **Reports** — spending by category (pie chart) and by month (bar chart) via Recharts.
- 🌐 **Bilingual UI** — English and Bengali (বাংলা), with currency shown in ৳ (BDT).
- 📱 **PWA** — installable, standalone mobile app experience (via `next-pwa`), with light/dark theme support.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js](https://nextjs.org) 16 (App Router), React 19, TypeScript |
| Backend / Auth / DB | [Supabase](https://supabase.com) (Postgres + Auth + Realtime) |
| State / Forms | Zustand · React Hook Form · Zod |
| UI | shadcn/ui + Radix UI, Tailwind CSS, `lucide-react` icons |
| Charts | Recharts |
| i18n | Custom React context (`en` / `bn` message files) |
| PWA | `next-pwa` |
| Image handling | `browser-image-compression` (compresses receipt photos before upload) |
| Notifications | Sonner |

## Project Structure

```
src/
├── app/
│   ├── login/                          # Username/password login
│   ├── (app)/                          # Authenticated app shell (bottom nav)
│   │   ├── dashboard/                  # Monthly summary + recent activity
│   │   ├── transactions/                # Combined expense/income list
│   │   │   ├── expense/{add,[id],edit/[id]}
│   │   │   └── income/{add,[id],edit/[id]}
│   │   ├── reports/                    # Category & monthly charts
│   │   ├── settings/                   # Categories, language, logout
│   │   └── users/                      # Admin: create/manage users
│   ├── api/users/create/route.ts       # Server route: creates auth user + profile
│   └── manifest.ts                     # PWA manifest
├── components/
│   ├── layout/                         # app-shell, bottom-nav, page-header
│   └── ui/                             # shadcn-based primitives (button, dialog, etc.)
├── context/language-context.tsx        # en/bn language state
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # Basic Supabase client
│   │   ├── browser-client.ts           # Browser (SSR-aware) Supabase client — used by pages
│   │   └── server-admin.ts             # Server-only admin client (service role key)
│   ├── category-icons.ts               # Maps category/source names to icons & colors
│   └── utils.ts                        # Tailwind class merge helper
└── messages/{en,bn}.json                # UI translation strings
```

## Data Model (Supabase / Postgres)

Inferred from queries in the app code:

- **`users`** — `id` (matches Supabase Auth user id), `username`, `full_name`, `role` (`admin` / `member`), `is_active`, `created_at`.
- **`expenses`** — `id`, `amount`, `note`, `expense_date`, `category_id` → `expense_categories`, `created_by` → `users`, `is_deleted`.
- **`expense_categories`** — `id`, `name`, `is_active`. Built-in categories referenced in the UI: Car Wash, Driver's Salary, Driver's Tip, Fuel, Misc, Oil Change, Parking, Repair, Tax, Tire (custom categories can be added).
- **`income`** — `id`, `amount`, `note`, `income_date`, `source_id` → `income_sources`, `created_by` → `users`, `is_deleted`.
- **`income_sources`** — `id`, `name`. Referenced sources: Rental Payment, Trip Fare.

Soft deletes are used throughout (`is_deleted` flag rather than row deletion).

## Getting Started

### Prerequisites
- Node.js
- A [Supabase](https://supabase.com) project with the tables above, Auth enabled, and Realtime enabled on `expenses` and `income`

### Installation

```bash
git clone https://github.com/brs2026/autoExpense.git
cd autoExpense
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key   # server-only — used to create users
```

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` has admin privileges. It's used only in the server-side `/api/users/create` route and must never be exposed to the client or committed to source control.

### Run locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the local dev server |
| `npm run build` | Production build + compile checks |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

### First login

There's no public sign-up — accounts are created by an admin via the **Users** page (Settings → Users), which calls `/api/users/create`. That route creates a Supabase Auth user (email is synthesized as `username@autoexpense.app`) and a matching row in `users`. You'll need to seed at least one admin account directly in Supabase (or temporarily open the API route) to get started.

## Coding Conventions

- TypeScript + `.tsx` for all components.
- Route files follow Next.js App Router conventions (`page.tsx`, `layout.tsx`); the authenticated section is grouped under the `(app)` route group so it can share the `AppShell`/bottom-nav layout.
- Kebab-case for route folders and component filenames (e.g. `bottom-nav.tsx`, `page-header.tsx`).
- Use the `@/*` path alias for imports from `src` (e.g. `@/lib/utils`).
- Tailwind + shadcn styling patterns; use `src/lib/utils.ts`'s `cn()` helper for conditional classes.

## Testing

No automated test suite is currently configured. Run `npm run lint` (and `npm run build` for build-sensitive changes) before submitting a PR.

## Security Notes

- Keep all secrets in `.env.local`; never commit them.
- All privileged operations (creating auth users) go through the server-only admin client in `src/lib/supabase/server-admin.ts` — don't use the service role key in client components.
- Regular data access uses the anon-key browser client (`src/lib/supabase/browser-client.ts`), so Supabase Row Level Security (RLS) policies should be configured to enforce who can read/write `expenses`, `income`, and `users`.

## Contributing

Keep PRs scoped to one feature or fix, include a short summary and testing notes, and add screenshots/recordings for UI changes. Use concise, imperative commit messages (e.g. `Add expense edit form`, `Fix dashboard totals`).
