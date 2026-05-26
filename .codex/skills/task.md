# Task Skill

Use this skill when the user asks to break a specification, feature, bug fix, or refactor into actionable implementation tasks.

## Goal

Create a practical task plan that another agent or developer can execute without rediscovering the whole problem.

## Workflow

1. Read the relevant spec, issue, or user request.
2. Inspect the repository for existing patterns, scripts, routes, components, and tests.
3. Break work into small tasks that each produce a verifiable result.
4. Order tasks by dependency: discovery, data/model changes, implementation, tests, verification, documentation.
5. Include exact files or directories when known.
6. Call out blockers, assumptions, and decisions that need user input.
7. Keep tasks scoped; avoid mixing unrelated cleanup with feature work.

## Task Format

Use this structure by default:

```markdown
# <Feature Name> Tasks

## Context
Short summary of the request, source spec, and affected area.

## Tasks

- [ ] Inspect existing implementation in `<path>` and confirm integration points.
- [ ] Implement `<specific behavior>` in `<path>`.
- [ ] Add or update validation, loading, empty, and error states.
- [ ] Add focused tests or document why tests are not available.
- [ ] Run verification commands such as `npm run lint` and `npm run build`.

## Dependencies
- Required environment variables, services, migrations, or design assets.

## Acceptance Checks
- Concrete checks that prove the task list is complete.
```

## Quality Bar

Prefer concrete verbs: add, update, remove, verify, document. Avoid tasks like "handle edge cases" unless the edge cases are named. Each task should be small enough to complete and review independently.
