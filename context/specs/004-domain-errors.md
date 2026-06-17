# 004 — Domain Errors and Exception Filter

## Goal

Separate domain error signaling from HTTP concerns so that service layer communicates failures through typed domain errors and the transport layer handles mapping to HTTP responses in one place.

## Scope

- `DomainError` base class with a machine-readable `code` field
- `UserAlreadyExistsError` in `src/modules/users/users.errors.ts`
- Global `DomainExceptionFilter` in `src/common/errors/domain-error.filter.ts`
- Filter registered globally in `main.ts`
- Service updated to throw domain errors instead of NestJS HTTP exceptions
- Unit coverage for the filter mapping behavior

## Result

- Service layer has no dependency on `@nestjs/common` HTTP exceptions
- All domain-to-HTTP mapping lives in `DomainExceptionFilter`
- Adding a new domain error requires touching the module errors file, `domain-error-http-map.ts`, and the filter

## Error Mapping

| Domain error | HTTP status | Response code |
|---|---|---|
| `UserAlreadyExistsError` | `409 Conflict` | `USER_ALREADY_EXISTS` |

Response body shape on domain error:
- `statusCode`: HTTP status code
- `code`: machine-readable error code
- `message`: human-readable description

## Acceptance Criteria / Progress Checklist

- [x] `DomainError` base class defined with `code` property
- [x] `UserAlreadyExistsError extends DomainError` in `users.errors.ts`
- [x] `DomainExceptionFilter` maps `UserAlreadyExistsError` to `409` with `USER_ALREADY_EXISTS` code
- [x] Filter registered globally in `main.ts`
- [x] `UsersService` throws `UserAlreadyExistsError` instead of `ConflictException`
- [x] Unit tests cover filter mapping for `UserAlreadyExistsError`

## Out of Scope

- Mapping of NestJS built-in exceptions (validation errors, not found, etc.)
- Error logging or monitoring
