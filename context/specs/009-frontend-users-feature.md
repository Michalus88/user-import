# 009 — Frontend Users Feature (Create + List)

## Goal

Replace starter UI with an admin users screen that supports creating a single user and viewing a paginated users list.

## Scope

- Frontend app shell replacement for admin panel layout
- Users feature folder with colocated API and TanStack Query hooks
- Create-user form with client-side validation (shared username rule with backend)
- Paginated users list bound to backend `GET /users`
- Query invalidation after successful `POST /users`
- Reusable UI helpers for avatar initials/color and date formatting
- Stats card fed from pagination metadata

## Result

- Admin can create a single user from UI
- Users list loads from backend and supports page switching
- Duplicate email errors are displayed using machine-readable API code
- UI is ready for CSV tab integration from spec `010`

## UI/State Rules

- Data fetching and cache through TanStack Query
- Page state kept locally in component state
- Query key includes page info for deterministic caching
- Keep previous page data during pagination transitions
- No global users state copy; server response is source of truth

## UI Contract

### Page Layout

- Full-height page with light background (`bg-gray-50`)
- Header on top, two-column content below
- Main container: `max-w-7xl mx-auto px-6 py-8`
- Desktop layout:
	- left panel fixed width (`w-96`) for form/tabs and stats
	- right panel (`flex-1`) for toolbar, table, pagination
- Mobile layout:
	- single column stack
	- left panel cards above table card

### Header

- Wrapper: `bg-white border-b border-gray-200 px-6 py-4`
- Icon: `Users` from `lucide-react` in `w-8 h-8 rounded-lg bg-violet-600`
- Title: `User Management`
- Subtitle: `Admin Panel`

### Form Tab: Add User

- Two fields:
	- email (`type=email`, placeholder `jan.kowalski@example.com`)
	- username/full name (`type=text`, placeholder `Jan Kowalski`)
- Field visuals:
	- `Label` with `text-xs font-medium text-gray-700`
	- `Input` with `bg-gray-50 focus:bg-white`
	- left-side icon (`Mail` for email, `User` for username)
- Username validation rules (shared with backend via `@shared/constants`):
	- minimum 3 characters
	- only Unicode letters, digits, and spaces (regex enforced)
- Submit button:
	- full width, violet primary style
	- icon `UserPlus`, label `Add User`
	- disabled when form invalid or mutation pending

### List Header

- Heading `Users` and total count (e.g. `X results`)

### Users Table

- Columns:
	- User (avatar + username)
	- Email
	- Added (date)
- Row hover: `hover:bg-gray-50/80 transition-colors`
- Avatar rules:
	- initials from username (max 2 chars, uppercase)
	- deterministic color by `email.charCodeAt(0) % 6`
	- color pairs:
		- violet-100 / violet-700
		- blue-100 / blue-700
		- emerald-100 / emerald-700
		- amber-100 / amber-700
		- rose-100 / rose-900
		- cyan-100 / cyan-700
- Date formatting:
	- locale: `pl-PL`
	- pattern target: `dd MMM yyyy` (for example `17 cze 2026`)

### Empty States

- Empty dataset: `No users yet`
- Load error: `Could not load users`
- Empty state includes `Users` icon and muted helper text

### Stats Card

- Shows:
	- total users
	- total pages (`ceil(total / pageSize)`)
- Left stat uses violet accent surface
- Right stat uses neutral gray surface

### Pagination

- Render only when `totalPages > 1`
- Prev/next icon buttons (`ghost`, `size=icon`)
- Numbered page buttons with active violet style
- Maximum 5 numeric buttons in viewport; use ellipsis indicator for overflow
- Range label: `Showing A-B of TOTAL`

## API Alignment

### GET /api/users

Request query:

- `page` default `1`

Response shape:

```ts
{
	users: Array<{
		id: number;
		email: string;
		username: string;
		createdAt: string;
	}>;
	total: number;
	page: number;
	pageSize: number; // expected 50
}
```

Derived in frontend:

- `totalPages = Math.max(1, Math.ceil(total / pageSize))`

### POST /api/users

Request body:

```ts
{ email: string; username: string }
```

Behavior:

- `201`: clear form, reset to page `1`, invalidate users query, success toast
- `409`: map machine-readable domain code to duplicate-email toast
- `400`: show validation error toast
- other errors: fallback toast `Something went wrong`

## Toast Contract

- Success create: `User "{username}" added successfully`
- Duplicate email: `Email {email} already exists`
- Generic API error: backend message or fallback `Something went wrong`
- Position: bottom-right
- Auto-dismiss: 4 seconds

## Suggested Frontend Structure

Use feature-based colocated modules (project convention):

```text
apps/frontend/src/
	features/
		users/
			add-user-form.tsx
			users-list.tsx
			users-pagination.tsx
			user-avatar.tsx
			stats-card.tsx
			api.ts
			use-users.ts
			utils.ts
```

## Acceptance Criteria / Progress Checklist

- [x] Vite starter content is replaced with admin users interface
- [x] `src/features/users` contains API functions and query hooks
- [x] Create-user form validates required `username` and valid `email` before submit
- [x] Username rule (min 3 chars, allowed characters) is sourced from `@shared/constants` and enforced before submit
- [x] Successful create invalidates users-list query and refreshes data
- [x] `GET /users` is consumed with pagination metadata
- [x] Pagination controls change page and trigger refetch without UI flicker
- [x] Duplicate email API error code is mapped to user-facing message
- [x] Header, left panel, right panel, and stats card match UI contract
- [x] Table rows render avatar initials/color and `pl-PL` formatted creation date
- [x] Empty state renders for empty dataset; load error has distinct message
- [x] Mobile layout stacks correctly without overflow

## Out of Scope

- CSV upload UI
- Search/filter/sort controls on the list
- Edit/delete user actions
