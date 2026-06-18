# 011 — CSV Import Race-Safe Persistence

## Goal

Make CSV import resilient to a concurrent user creation that wins the race between preflight email check and batch insert, while preserving precise per-row reporting.

## Scope

- Race-safe batch insert that does not fail on unique-constraint conflicts
- Post-insert reconciliation: identify rows lost to the race and report them as DB duplicates
- Repository contract change to express race-tolerant insert
- Import result accounting: race losers counted in `skipped`, listed in `errors` with the same code as preflight-detected duplicates

## Result

- A concurrent `POST /users` (or another concurrent CSV import) inserting the same email does not surface as `500` to the admin
- Race losers are reported per row with `EMAIL_DUPLICATE_IN_DB`, indistinguishable in shape from preflight-detected duplicates
- `inserted + skipped + invalid_rows = total` invariant holds even under contention

## Persistence Rules

Insert:
- Eligible rows after preflight are inserted with duplicate-tolerant batch write
- Returned count is the number of rows actually persisted

Reconciliation:
- If returned count equals eligible count, no race occurred and no extra work is needed
- If returned count is lower than eligible count, the difference is attributable to a concurrent insert that won the race
- A targeted re-query identifies which eligible emails are now present in DB and were not present at preflight time
- Each identified row is appended to `errors` with `EMAIL_DUPLICATE_IN_DB`

Counting:
- Race losers contribute to `skipped` alongside in-file and preflight DB duplicates
- Validation errors remain separate from `skipped` (see spec 007 boundary)

## Acceptance Criteria / Progress Checklist

- [x] Repository exposes a duplicate-tolerant batch insert and a way to read its actual insert count
- [x] Service uses the duplicate-tolerant path for the post-preflight insert
- [x] When actual inserts equal eligible count, the result is identical to the pre-existing fast path
- [x] When actual inserts are lower than eligible count, a reconciliation read identifies race losers
- [x] Race losers are reported with `EMAIL_DUPLICATE_IN_DB`, addressed to their original CSV row number
- [x] `inserted`, `skipped`, and `errors` remain mutually consistent under both no-race and race scenarios
- [x] Unit tests cover: no race, partial race (some eligible rows lost), full race (no inserts succeed)
- [x] No additional DB round-trip in the no-race case

## Out of Scope

- Transactional isolation tuning (serializable, advisory locks)
- Idempotency keys or import job deduplication
- Streaming or queued imports
- Retry semantics for transient DB errors
