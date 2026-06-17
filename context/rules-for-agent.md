# Collaboration Rules

## Planning

- Do not start implementation without explicit user approval.
- New features require a spec in `context/specs/` before any code is written. Exception: small ad-hoc fixes that fit in a single logical change and have no design decisions.
- Work is spec-driven. Before implementing anything, read the relevant file in `context/specs/`.
- Follow the implementation sequence from `context/specs/` (default: ascending numeric prefix), unless the user explicitly reprioritizes.
- Keep plans short and action-oriented. Focus on the smallest complete increment.

## Implementation Loop

For each spec:

1. Mark the current work item as in progress by updating the checkbox in that spec.
2. Select the next unchecked acceptance criterion and implement only that scope.
3. Run validation for the touched area:
	 - backend changes: `pnpm --filter backend build`
	 - frontend changes: `pnpm --filter frontend build`
	 - when behavior changes, run relevant tests for that area.
4. If a command fails, fix the issue before moving on.
5. Mark completed acceptance checkboxes in the same spec.
6. Move to the next unchecked acceptance criterion and repeat.
7. When the spec is complete, provide a concise, short summary of what was done, what changed, and what remains next.

Use the spec checklists as the source of truth for session handoff. There is no separate progress-tracker file.

## Implementation Rules

- Do not implement anything outside `Scope` and `Acceptance Criteria`.
- Prefer editing existing files over creating new ones, unless new files are required by the spec.
- Do not add comments explaining what the code does — only why, when non-obvious.

## Project Constraints

- Use `CLAUDE.md` as the single source of truth for stack constraints, scope boundaries, and non-negotiable project rules.

## Definition of Done (per spec)

A spec is complete when ALL of the following are true:

- [ ] All acceptance criteria in `context/specs/<spec>.md` are checked
- [ ] Relevant build command passes (`pnpm --filter backend build` and/or `pnpm --filter frontend build`)
- [ ] Relevant tests for changed behavior pass
- [ ] Documentation and spec checkboxes reflect the actual implementation state

## Git

- Do not commit unless the user explicitly asks.
- Do not push unless the user explicitly asks.
