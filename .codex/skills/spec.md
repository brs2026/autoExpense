# Spec Skill

Use this skill when the user asks to create, refine, review, or implement a feature specification before coding.

## Goal

Produce a clear, testable specification that defines what should be built, why it matters, and how success will be evaluated.

## Workflow

1. Inspect the existing repository before drafting implementation details.
2. Identify the user goal, affected users, and expected behavior.
3. Capture assumptions explicitly when requirements are incomplete.
4. Define scope boundaries, including what is intentionally out of scope.
5. Describe data, UI, API, and state changes only as specifically as the project requires.
6. Include acceptance criteria that can be verified through tests, manual QA, or review.
7. Highlight risks, dependencies, migrations, environment variables, and rollout concerns.

## Spec Format

Use this structure unless the project already has a stronger convention:

```markdown
# <Feature Name> Spec

## Summary
Briefly describe the change and user value.

## Goals
- Outcome-focused goal.

## Non-Goals
- Explicitly excluded behavior.

## Requirements
- Functional requirement with observable behavior.

## UX / Flow
Describe screens, interactions, empty states, loading states, and errors.

## Data & Integration
Describe data models, API calls, persistence, auth, and external services.

## Acceptance Criteria
- Given/when/then or checklist-style criteria.

## Risks & Open Questions
- Risk or unresolved decision.
```

## Quality Bar

Keep specs concise and implementation-ready. Avoid vague requirements such as "make it better" unless they are translated into measurable behavior. Do not over-design architecture before reading the codebase.
