# 012 — CSV Import Skipped Contract

## Goal

Make `skipped` mean "every CSV row that did not reach the database", so that admin-facing totals always add up.

## Scope

- Contract change on `ImportResult.skipped` to include all non-inserted rows, not just duplicates
- Invariant `inserted + skipped = total` enforced and tested
- Unit tests updated to reflect the new semantics
- `errors` array remains the per-row detail source and is unaffected in shape

## Result

- `inserted + skipped` always equals `total` on any import outcome
- The UI summary card (Inserted / Skipped / Total) cannot show a misleading gap between the three numbers
- Per-row error list keeps its full granularity (validation, in-file duplicate, DB duplicate, race loser) for the report table

## Counting Rules

Inserted:
- Number of rows persisted to the database after preflight + race reconciliation

Skipped:
- Validation failures (missing or invalid `username`, invalid `email`)
- In-file duplicate emails (every occurrence beyond the first)
- Preflight DB duplicates
- Race losers detected after batch insert

Total:
- Number of data rows in the CSV, regardless of validity

Errors array:
- One entry per failing row, keyed by 1-based row number and field
- Multiple errors per row are emitted as separate entries
- Shape and codes unchanged

## Acceptance Criteria / Progress Checklist

- [x] Service computes `skipped` as `total - inserted`
- [x] Existing unit tests aligned with the new semantics
- [x] New unit test asserts `inserted + skipped === total` across mixed-outcome import
- [x] Validation-only failure produces non-zero `skipped`
- [x] No frontend change required to render the new totals

## Out of Scope

- Introducing a fourth category (e.g. `invalid`) as a separate counter
- Backwards-compatible aliasing of the old `skipped` semantics
- Modifying error codes or per-row error shape
