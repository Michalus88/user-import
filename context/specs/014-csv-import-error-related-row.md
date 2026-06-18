# 014 — CSV Import Error Related Row

## Goal

Expose the row number of the first occurrence of an in-file duplicate as structured data, so the UI can point admin to the original row.

## Scope

- New optional field `relatedRow?: number` on the per-row error object in the import response
- Backend populates it for `EMAIL_DUPLICATE_IN_FILE` (value = row where the email first appeared)
- Frontend renders it in the error table next to the translated code label
- ANALIZA.md §3 promise about "reference to the original row" stays accurate

## Result

- Admin importing a 10k-row file sees "Duplikat w pliku (pierwsze: w. 7)" instead of just "Duplikat w pliku"
- `message` stops carrying semantics — it remains only as a log-friendly fallback

## Data Model

`ImportRowError` becomes a discriminated union keyed on `code`:

- `EMAIL_DUPLICATE_IN_FILE` variant: `{ row, field: 'email', code, message, relatedRow: number }` — `relatedRow` is required
- Other codes: `{ row, field, code, message }` — `relatedRow` is not a property at all

The shared `code` field is typed as `ImportErrorCode`, not `string`.

## Acceptance Criteria

- [x] `ImportRowError` in `packages/types` is a discriminated union over `code`
- [x] `code` is typed as `ImportErrorCode`, not `string`
- [x] Accessing `relatedRow` on a non-`EMAIL_DUPLICATE_IN_FILE` variant is a TS error
- [x] Parser sets `relatedRow` on in-file duplicate
- [x] Parser unit test asserts the `relatedRow` value
- [x] Frontend renders the original-row suffix when `relatedRow` is present
- [x] Other error codes do not emit `relatedRow` at runtime

## Out of Scope

- `relatedRow` for `EMAIL_DUPLICATE_IN_DB` (DB does not know the CSV row number)
- Clickable link to the original row in the table
- Localization of the `message` field
