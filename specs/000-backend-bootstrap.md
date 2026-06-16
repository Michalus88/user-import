# 000 — Backend Bootstrap and App Defaults

## Goal

Set up the NestJS backend with shared application defaults so all later features build on the same validation, security, and configuration baseline.

## Scope

- Application bootstrap configuration in `main.ts`
- Global request validation through `ValidationPipe`
- Basic security middleware for the HTTP layer
- Development CORS configuration for the frontend application
- Validated, typed environment configuration accessible through DI
- Global API route prefix
- Graceful shutdown handling

## Result

- The backend starts with a consistent global validation policy
- Common security defaults are enabled for the API
- The frontend development origin can call the backend safely
- A typed config service is injectable across the app, with required variables validated at startup
- All API endpoints live under the `/api` prefix
- The backend closes connections cleanly on SIGTERM / SIGINT

## App Defaults

- Global `ValidationPipe` is enabled with:
  - `transform: true`
  - `whitelist: true`
  - `forbidNonWhitelisted: true`
- `helmet` is enabled
- CORS is configured for the frontend development origin
- Environment configuration is loaded centrally and fails fast when required values are missing
- Global route prefix is set to `/api`
- Shutdown hooks are enabled so injected services (e.g. database clients) can disconnect cleanly

## Acceptance Criteria / Progress Checklist

- [ ] Backend bootstrap enables the global `ValidationPipe` with the agreed options
- [ ] `helmet` is enabled for the NestJS app
- [ ] CORS allows the frontend development origin to call the API
- [ ] Required backend environment variables are validated at startup
- [ ] All API routes are reachable under the `/api` prefix
- [ ] Shutdown hooks are enabled and trigger cleanup of injected services
- [ ] Backend starts successfully with the shared bootstrap defaults in place

## Out of Scope

- Custom exception filters
- Rate limiting
- API versioning
- File upload limits for specific endpoints
- Response compression middleware
- Configurable log levels
- Feature-specific DTOs, modules, or business logic