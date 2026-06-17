# 003 — List Users Endpoint With Pagination

## Goal

Add a paginated backend endpoint for listing users so the admin panel can display the current user base without rendering the entire dataset at once.

## Scope

- `GET /users` endpoint in the backend
- Pagination query handling for page-based navigation
- Total user count in the response
- Default page size suitable for the admin list view
- Unit coverage for pagination behavior

## Result

- The backend exposes a paginated `GET /users` endpoint
- The response includes both the current page of users and pagination metadata
- The endpoint supports the frontend pagination flow planned in TanStack Query

## API Contract

Query parameters:
- `page`: optional positive integer, defaults to `1`

Success response:
- `200 OK`
- Response body shape:
  - `users`: array of `User`
  - `total`: total number of users
  - `page`: current page number
  - `pageSize`: number of users returned per page

Pagination rules:
- Default `pageSize` is `50`
- Users are returned in a deterministic order suitable for pagination

## Acceptance Criteria / Progress Checklist

- [x] `GET /users` endpoint is available in the backend
- [x] Endpoint returns `{ users, total, page, pageSize }`
- [x] Default pagination starts at page `1`
- [x] Default `pageSize` is `50`
- [x] Pagination logic returns the correct slice of users and total count
- [x] Unit tests cover default page behavior and non-default page access

## Out of Scope

- Frontend pagination UI
- Search, filtering, or sorting controls
- Cursor-based pagination
- User detail endpoint