# 001 — Prisma Init + User Model

## Goal

Set up Prisma as the backend ORM and define the initial `User` model so the NestJS application has a working database layer for future user features.

## Scope

- Prisma configuration for the backend application
- Initial `User` model in the Prisma schema
- First database migration
- Injectable `PrismaService` available through NestJS DI

## Result

- The backend uses Prisma as its ORM layer
- The database schema includes the initial `User` table
- Prisma Client types can be generated successfully
- `PrismaService` can be injected into backend modules

## Data Model

`User`
- `id`: unique identifier
- `username`: required username
- `email`: required unique email
- `createdAt`: record creation timestamp

## Acceptance Criteria / Progress Checklist

- [ ] Prisma schema includes the `User` model
- [ ] Initial migration is created for the current schema
- [ ] Prisma Client generates without errors
- [ ] Backend starts with a working database connection
- [ ] `PrismaService` is available through NestJS dependency injection

## Out of Scope

- User CRUD endpoints
- Request DTO validation
- CSV import logic
- Seed data or fixtures