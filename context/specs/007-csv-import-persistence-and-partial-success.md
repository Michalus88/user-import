# 007 — CSV Import Persistence and Partial Success

## Goal

Persist valid CSV rows with predictable partial-success behavior and explicit reporting of rows skipped because users already exist.

## Scope

- Preflight lookup for existing emails in database
- Filtering valid rows against existing users
- Batch insert for remaining rows
- Final import report composition (`inserted`, `skipped`, `total`, `errors`)
- Mapping zero-insert outcome to `422`

## Result

- Import performs one preflight read and one insert batch for eligible rows
- Existing-user conflicts are reported as row-level errors instead of hard endpoint failure
- Partial success is first-class and visible in a single import result payload

## Persistence Rules

Preflight:
- Query existing users by email for all candidate rows

Filtering:
- Rows with email already present in DB are skipped and reported

Insert:
- Remaining valid, non-duplicate rows are inserted in batch

Response semantics:
- `200` if at least one row is inserted
- `422` if no row is inserted and failure is fully business/validation driven

## Acceptance Criteria / Progress Checklist

- [x] Repository exposes methods needed for preflight lookup and batch insert
- [x] Service performs preflight email lookup before insert
- [x] Existing-email rows are reported with machine-readable error codes
- [x] Batch insert persists only eligible rows
- [x] Result summary values (`inserted`, `skipped`, `total`) are consistent with row outcomes
- [x] Endpoint returns `422` when `inserted = 0` for business-validation outcomes
- [x] Unit tests cover full success, partial success, and zero-insert scenarios

## Out of Scope

- File size/row-count guardrails
- Frontend rendering of import report
