# 002 — Create User Endpoint

## Goal

Add a backend endpoint for creating a single user so the admin panel can support manual user creation alongside the future CSV import flow.

## Scope

- `POST /users` endpoint in the backend
- Request DTO for `username` and `email`
- Request validation for `username` and `email`
- User creation through Prisma
- Conflict handling for duplicate email addresses
- Unit coverage for DTO validation and service behavior
- Shared type definitions for request and response contracts (`packages/shared`)

## Result

- The backend exposes a `POST /users` endpoint
- Valid requests create a new user record in the database
- Invalid input is rejected through the existing validation pipeline
- Duplicate email conflicts return a predictable API error
- `ICreateUserRequest` and `IUser` interfaces live in `packages/shared` and are shared between backend and frontend
- `CreateUserDto` implements `ICreateUserRequest`

## API Contract

Request body:
- `username`: required string
- `email`: required valid email string

Validation boundary:
- Request payload is validated through a backend DTO before reaching the service layer

Success response:
- `201 Created`
- Response body contains the created `User`

Error response:
- `400 Bad Request` for invalid request payload
- `409 Conflict` for duplicate email
- Conflict response includes a machine-readable error code in the body

## Acceptance Criteria / Progress Checklist

- [x] `POST /users` endpoint is available in the backend
- [x] Request DTO validates required `username` and `email`
- [x] Valid request creates a user through Prisma
- [x] Duplicate email is mapped from Prisma `P2002` to `409 Conflict`
- [x] Unit tests cover DTO validation rules
- [x] Unit tests cover successful creation and duplicate email handling
- [x] `ICreateUserRequest` and `IUser` defined in `packages/shared`
- [x] `CreateUserDto` implements `ICreateUserRequest`

## Out of Scope

- User update or delete endpoints
- Frontend form implementation
- CSV import flow
- CSV import shared types