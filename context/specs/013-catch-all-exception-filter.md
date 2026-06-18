# 013 — Catch-All Exception Filter

## Goal

Surface every unhandled server-side error in logs without leaking internals to the client, while preserving the existing behavior of specific filters for known exception types.

## Scope

- A global catch-all exception filter as the last line of defense for any throwable not caught by `DomainExceptionFilter` or `MulterExceptionFilter`
- Logging of 5xx outcomes with HTTP method, URL and stack trace
- Pass-through of `HttpException` instances using their declared status and response shape
- Generic response body for non-`HttpException` errors, with a stable `code` and a safe message

## Result

- A bug in a service or unmapped Prisma error no longer disappears from logs; operations have a single place to look
- Clients receive a consistent error envelope (`statusCode`, `code`, `message`) without internal details such as file paths or DB internals
- Existing specific filters keep their precedence; only previously-uncaught exceptions land in the catch-all path

## Logging and Response Rules

Logging:
- Status >= 500 is logged at error level with HTTP method, URL and the original exception stack
- Status < 500 is not logged (treated as client-driven and not a server fault)

Response:
- When the exception is an `HttpException`, the filter uses its `getStatus()` and `getResponse()` unchanged
- For everything else, the filter responds with HTTP 500 and a body `{ statusCode: 500, code: 'INTERNAL_ERROR', message: 'Internal server error' }`
- The response body never includes the original error message, name or stack

Filter ordering:
- The catch-all filter is registered first in `useGlobalFilters` so that more specific filters take precedence during resolution
- `DomainExceptionFilter` continues to handle `DomainError` subclasses
- `MulterExceptionFilter` continues to handle Multer-specific errors on the upload endpoint

## Acceptance Criteria / Progress Checklist

- [x] A new global filter with `@Catch()` (no type argument) is registered in `main.ts`
- [x] Specific filters (`DomainExceptionFilter`, `MulterExceptionFilter`) keep their precedence for matching exceptions
- [x] Unknown `Error` instances produce HTTP 500 with a generic body and an error-level log including method, URL and stack
- [x] `HttpException` instances retain their status and response shape; no extra log is emitted unless their status is 5xx
- [x] Generic 500 response does not include the original error message, class name or stack
- [x] Unit tests cover: generic `Error`, `HttpException` pass-through, response body sanitization, and 4xx-not-logged behavior

## Out of Scope

- Structured (JSON) logging or request-id correlation
- Sentry / external error tracking integration
- Sanitizing nested fields inside `HttpException` responses
- Differentiating Prisma error codes inside the catch-all (those belong in domain-level mapping)
