# 005 — CSV Import Endpoint Contract

## Goal

Define a stable backend API contract for CSV user import so frontend and backend can implement against the same response shape and status semantics.

## Scope

- `POST /users/import` endpoint in the backend
- Multipart upload contract for a single CSV file field
- Import result response DTO shared with frontend (`packages/types`)
- Transport-level status code policy for full success, partial success, and full failure
- Error code constants for predictable frontend handling

## Result

- The backend exposes a documented `POST /users/import` endpoint
- Frontend has typed contracts for import result and row-level errors
- HTTP status semantics are explicit and match product assumptions from analysis

## API Contract

Request:
- `multipart/form-data`
- file field name: `file`
- accepted file type: CSV text content

Success and partial success:
- `200 OK`
- body contains import summary and row-level errors

Full business failure (no rows inserted due to row-level validation/domain issues):
- `422 Unprocessable Entity`
- body keeps the same import result shape

Malformed CSV payload:
- `400 Bad Request`

File/row limits exceeded:
- `413 Payload Too Large`

Response body shape:
- `inserted`: number of inserted users
- `skipped`: number of skipped rows
- `total`: total number of parsed data rows
- `errors`: array of row-level errors:
  - `row`: CSV row number (1-based including header offset policy)
  - `field`: `username | email | row`
  - `code`: machine-readable error code
  - `message`: human-readable description

## Acceptance Criteria / Progress Checklist

- [x] `POST /users/import` route exists in users module
- [x] File field contract is defined as `file` in controller-level API contract
- [x] Shared types for import result and row error are added in `packages/types`
- [ ] Backend and frontend import contracts reuse the shared types
- [x] Status code policy is implemented as documented (`200`, `400`, `413`, `422`)
- [x] Endpoint returns a stable response shape for both success and failures

## Out of Scope

- CSV parsing and row validation implementation details
- Database insert strategy
- Frontend upload UI
