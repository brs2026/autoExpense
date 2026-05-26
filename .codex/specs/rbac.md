# Permission-Based RBAC Spec

## Summary
Add a permission-based role system so AutoExpense can control access to features such as viewing reports, managing expenses, and managing categories through explicit permissions instead of scattered role-name checks. The feature should keep the current mobile app experience simple while making authorization consistent, auditable, and enforceable in Supabase.

## Goals
- Define a reusable RBAC model where roles are collections of permissions.
- Gate navigation, pages, buttons, and form actions based on the current user's permissions.
- Enforce the same permissions at the data layer with Supabase Row Level Security or equivalent server-side checks.
- Preserve existing owner-based expense management behavior where users can manage their own expenses unless a permission grants broader access.
- Make role and permission behavior easy to extend without hardcoding role names throughout UI components.

## Non-Goals
- Building a full user administration screen in the first implementation.
- Supporting organization, tenant, branch, or team scoping beyond the current single-app data model.
- Replacing Supabase Auth or changing the username/password login flow.
- Implementing approval workflows, audit logs, or expense reimbursement states.
- Migrating to server components or API routes unless needed for secure permission enforcement.

## Requirements
- The system must expose a canonical permission list in application code, using stable string keys such as `expenses.read`, `expenses.create`, `expenses.update.own`, `expenses.update.any`, `expenses.delete.own`, `expenses.delete.any`, `reports.read`, `categories.read`, and `categories.manage`.
- Each authenticated user must resolve to a role and an effective permission set after login.
- Existing `users.role` values must continue to work during migration by mapping known roles to permissions.
- Role-name checks such as `role === "admin"` or `role === "superadmin"` must be replaced with permission checks.
- Bottom navigation must hide links for pages the user cannot access.
- Protected pages must show an access-denied state or redirect when the user lacks the required permission.
- Action buttons must only render when the user has permission to perform the action.
- Write operations must validate permissions before modifying Supabase data.
- Expense ownership rules must be explicit:
  - A user with `expenses.update.own` may edit expenses where `created_by` equals their auth user id.
  - A user with `expenses.update.any` may edit any non-deleted expense.
  - A user with `expenses.delete.own` may soft-delete expenses where `created_by` equals their auth user id.
  - A user with `expenses.delete.any` may soft-delete any non-deleted expense.
- Category creation and future category edits/deactivation must require `categories.manage`.
- Reports must require `reports.read`.
- Dashboard metrics must only include data the user is allowed to read.
- Permission loading must handle loading, unauthenticated, and failed profile lookup states.
- Permission data must not be trusted from client state alone for protected mutations.

## UX / Flow
On login, the app resolves the authenticated user's profile and permissions before sending them to the main app. If permissions cannot be loaded, the user sees a clear error and can retry or log out.

The bottom navigation adapts to available permissions:
- Dashboard is visible to authenticated users with basic expense read access.
- Expenses is visible to users with `expenses.read`.
- Reports is visible to users with `reports.read`.
- Settings is visible to authenticated users; category management controls inside Settings require `categories.manage`.

The Expenses list shows only expenses the user can read. The floating add button appears only with `expenses.create`. Expense details show edit/delete buttons only when the user can manage that specific record through either owner or any-scope permissions.

Direct URL access must be handled. A user without page permission should see an access-denied state with a path back to an allowed page. A user without action permission who submits a request directly should receive a failure message and no data change.

## Data & Integration
Use Supabase Auth as the identity source and the existing `users` table as the profile source. The first implementation can keep the existing `users.role` column, but should introduce a role-to-permission mapping layer in code and, if database migrations are available, normalized RBAC tables:

- `roles`: `id`, `key`, `name`, `description`, `created_at`
- `permissions`: `id`, `key`, `description`, `created_at`
- `role_permissions`: `role_id`, `permission_id`
- `user_roles`: `user_id`, `role_id`

If migrations are not part of the current repo yet, document the required SQL separately and implement the application layer in a way that can switch from static role mappings to database-backed permissions without changing calling code.

Application code should provide a shared authorization helper, for example:
- `getCurrentUserPermissions()` to load the current user, profile, role, and permission keys.
- `hasPermission(permission)` for simple checks.
- `canManageExpense(action, expense)` for ownership-aware checks.
- A reusable guard component or hook for page/action gating in client routes.

Supabase policies should align with the same permission model. Until database-backed permission checks exist, policies should at minimum enforce ownership for own-scope actions and restrict admin/global actions to trusted role values. The client UI must be treated as convenience only, not the source of authorization.

No new environment variables are expected.

## Acceptance Criteria
- Given a user with expense read access, when they open `/expenses`, then they can see only expenses they are permitted to read.
- Given a user without `expenses.create`, when they open `/expenses`, then the add expense button is hidden and direct access to `/expenses/add` is denied.
- Given a user with `expenses.create`, when they submit a valid expense, then the expense is created with `created_by` equal to their auth user id.
- Given a user with `expenses.update.own`, when they view their own expense, then the edit button is visible.
- Given a user with `expenses.update.own`, when they view another user's expense, then the edit button is hidden and direct edit access is denied.
- Given a user with `expenses.update.any`, when they view any non-deleted expense, then they can edit it.
- Given a user with `expenses.delete.own`, when they delete their own expense, then `is_deleted` becomes `true`.
- Given a user without `reports.read`, when they use the app, then Reports is hidden from bottom navigation and `/reports` is denied.
- Given a user without `categories.manage`, when they open Settings, then category creation controls are hidden while profile and logout remain available.
- Given an unauthenticated visitor, when they open a protected route, then they are redirected to `/login` or shown an unauthenticated state with no protected data loaded.
- Given any blocked mutation attempt from the browser console or direct route access, when Supabase evaluates the request, then unauthorized data is not changed.
- `npm run lint` passes after implementation.
- `npm run build` passes for the final implementation if build-sensitive files are changed.

## Risks & Open Questions
- The current repo does not show database migration files, so the implementation path for Supabase schema and RLS changes needs to be chosen before coding.
- Existing production role values must be confirmed before finalizing the default role-to-permission map.
- The desired default roles are not yet specified. A practical initial set is `user`, `admin`, and `superadmin`, but this should be confirmed.
- Client-only pages make UI gating straightforward but do not provide authorization by themselves; database policies or server-side checks are required for real protection.
- Dashboard and report totals may need read-scope decisions: own expenses only, all expenses, or role-dependent aggregation.

# Permission-Based RBAC Tasks

## Context
This task plan implements the permission-based RBAC spec above for the current Next.js App Router and Supabase client app. The affected areas are route pages in `src/app`, shared layout navigation in `src/components/layout`, Supabase access in `src/lib/supabase`, and new shared authorization utilities under `src/lib`.

## Tasks

- [ ] Inspect current role and auth usage in `src/app/settings/page.tsx`, `src/app/expenses/[id]/page.tsx`, `src/app/expenses/edit/[id]/page.tsx`, `src/app/expenses/add/page.tsx`, `src/app/reports/page.tsx`, `src/app/dashboard/page.tsx`, and `src/components/layout/bottom-nav.tsx`.
- [ ] Confirm the existing Supabase schema for `users`, `expenses`, and `expense_categories`, including available role values, `created_by`, `is_deleted`, and existing RLS policies.
- [ ] Decide whether the first implementation will use a static role-to-permission map from `users.role` or database-backed RBAC tables; document the decision in this spec if it changes the implementation path.
- [ ] Add a shared permission model in `src/lib/auth/permissions.ts` with canonical permission keys, default role-to-permission mappings, and typed helpers for permission checks.
- [ ] Add a shared current-user authorization loader in `src/lib/auth/client.ts` or a similarly named file that reads the Supabase auth user, loads the matching `users` profile, and returns role plus effective permissions.
- [ ] Add ownership-aware helpers for expense actions, including checks for `expenses.update.own`, `expenses.update.any`, `expenses.delete.own`, and `expenses.delete.any`.
- [ ] Add a reusable client-side guard or hook for loading, unauthenticated, access-denied, and allowed states in protected pages.
- [ ] Update `src/components/layout/bottom-nav.tsx` to filter Dashboard, Expenses, Reports, and Settings links based on effective permissions.
- [ ] Update `src/app/dashboard/page.tsx` to load authorization state before querying data and to make dashboard totals match the user's expense read scope.
- [ ] Update `src/app/expenses/page.tsx` to require `expenses.read`, limit expense queries to the user's read scope, and show the add button only when `expenses.create` is granted.
- [ ] Update `src/app/expenses/add/page.tsx` to require `expenses.create`, handle denied direct URL access, and keep `created_by` set from the authenticated Supabase user.
- [ ] Update `src/app/expenses/[id]/page.tsx` to replace hardcoded `admin` and `superadmin` checks with permission helpers for edit and delete actions.
- [ ] Update `src/app/expenses/edit/[id]/page.tsx` to require update permission for the target expense before loading the edit form and before submitting changes.
- [ ] Update delete handling in `src/app/expenses/[id]/page.tsx` to require delete permission for the target expense before setting `is_deleted` to `true`.
- [ ] Update `src/app/reports/page.tsx` to require `reports.read`, deny direct URL access without the permission, and query only data allowed by the user's read scope.
- [ ] Update `src/app/settings/page.tsx` so profile and logout remain available, while category list and category creation are gated by `categories.read` and `categories.manage`.
- [ ] Add consistent access-denied UI copy and actions for protected pages, either as a shared component under `src/components` or local route states if only a few pages need it.
- [ ] Add SQL documentation or migration notes for Supabase RLS policies that enforce expense ownership, global expense permissions, report read access, and category management.
- [ ] If database-backed RBAC is selected, add SQL for `roles`, `permissions`, `role_permissions`, and `user_roles`, plus seed data for the selected default roles.
- [ ] Verify blocked browser-console or direct-route mutations cannot change unauthorized expense or category data after Supabase policies are applied.
- [ ] Add focused tests if a test framework is introduced; otherwise document manual QA coverage because this repo currently has no test framework configured.
- [ ] Run `npm run lint` and fix any lint issues.
- [ ] Run `npm run build` after behavior-sensitive changes and fix any build issues.

## Dependencies
- Supabase project access is required to inspect and update schema, seed data, and RLS policies.
- Existing Supabase environment variables in `.env.local` must remain available: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Existing production role values in `users.role` must be confirmed before finalizing the permission map.
- A read-scope decision is required for dashboard and reports: own expenses only, all expenses for elevated roles, or another explicit rule.
- No new design assets are required.

## Acceptance Checks
- A user without `expenses.create` cannot see the add expense button and cannot access `/expenses/add`.
- A user with own-scope expense permissions can edit or delete only expenses where `created_by` matches their auth user id.
- A user with any-scope expense permissions can edit or delete any non-deleted expense.
- A user without `reports.read` cannot see Reports in bottom navigation and cannot access `/reports` directly.
- A user without `categories.manage` can open Settings but cannot create categories.
- Unauthorized direct Supabase mutations are blocked by database policy or an equivalent server-side authorization layer.
- No UI path relies on hardcoded `admin` or `superadmin` checks for authorization decisions.
- `npm run lint` passes.
- `npm run build` passes when the implementation is complete.
