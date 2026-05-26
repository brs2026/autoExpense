# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js App Router project. Route files live in `src/app`, with feature routes such as `dashboard`, `expenses`, `reports`, `settings`, and `login`. Shared layout components are in `src/components/layout`, reusable UI primitives are in `src/components/ui`, and shared utilities plus Supabase clients are in `src/lib`. Static assets are stored in `public`. Use the `@/*` TypeScript path alias for imports from `src`, for example `@/lib/utils`.

## Build, Test, and Development Commands

- `npm run dev`: starts the local Next.js development server.
- `npm run build`: creates a production build and runs Next.js compile checks.
- `npm run start`: serves the production build after `npm run build`.
- `npm run lint`: runs ESLint with Next.js core web vitals and TypeScript rules.

Use `npm install` to restore dependencies from `package-lock.json`.

## Coding Style & Naming Conventions

Write TypeScript and React components in `.tsx` files. Keep route components named `page.tsx` and nested layouts named `layout.tsx` to match App Router conventions. Use kebab-case for route folders and component filenames, as seen in `bottom-nav.tsx` and `page-header.tsx`. Prefer named exports for shared components and utilities unless the framework requires a default export. Keep styling consistent with the existing Tailwind/shadcn patterns and use `src/lib/utils.ts` helpers for class composition when appropriate.

## Testing Guidelines

No test framework is currently configured. Before submitting changes, run `npm run lint` and, for behavior or build-sensitive work, `npm run build`. If tests are added later, place focused tests near the code they cover or in a clearly named test directory, and document the new test command in `package.json` and this guide.

## Commit & Pull Request Guidelines

Git history was not available in this environment, so use concise, imperative commit subjects such as `Add expense edit form` or `Fix dashboard totals`. Pull requests should include a short summary, testing notes, linked issues when applicable, and screenshots or screen recordings for visible UI changes. Keep PRs scoped to one feature or fix.

## Security & Configuration Tips

Keep secrets in `.env.local` and do not commit them. Supabase-related configuration should be accessed through the existing clients in `src/lib/supabase`. When adding environment variables, document required names and expected usage in the README or a dedicated setup section.
