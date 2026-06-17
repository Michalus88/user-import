# 008 — CSV Import Limits and Error Coverage

## Goal

Protect the import endpoint with explicit operational limits and complete error-path test coverage.

## Scope

- Upload size limit guard on multipart file handling
- Maximum parsed row count guard after parsing
- Standardized handling for malformed CSV payloads
- Unit/integration-level test coverage for error status mapping (`400`, `413`, `422`)

## Result

- Import endpoint fails fast on oversized files
- Excessive row-count payloads are rejected with clear status and message
- Malformed CSV parsing errors are translated to deterministic API responses
- Error-path behavior is locked by tests

## Guardrail Defaults

- Max upload size: `2 MB`
- Max data rows: `10_000`

## Acceptance Criteria / Progress Checklist

- [x] Upload middleware enforces max file size at transport boundary
- [x] Service enforces max row count after successful parsing
- [x] Malformed CSV parse failures map to `400 Bad Request`
- [x] File size and row-count overflow map to `413 Payload Too Large`
- [x] Error responses include stable machine-readable `code`
- [x] Upload error responses use fixed, client-safe `message` values (no leakage of internal upload-library details)
- [x] Tests cover malformed CSV, oversized file, and row-limit overflow
- [x] Tests verify that successful imports still use the same response shape

## Out of Scope

- Streaming parser implementation
- Async queue/worker architecture
- Frontend user messaging polish
