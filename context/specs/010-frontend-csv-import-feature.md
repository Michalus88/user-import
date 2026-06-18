# 010 — Frontend CSV Import Feature

## Goal

Enable admins to upload a CSV file from UI and receive a clear import report with per-row errors.

## Scope

- `csv-import` feature folder with API calls and mutation hook
- File upload panel using multipart form submission
- Import result summary (`inserted`, `skipped`, `total`)
- Error table/list rendering row-level import errors
- Users list cache invalidation after successful or partial import
- CSV tab integrated into the left-side form card (`Add User` / `Import CSV`)
- Drop zone interaction (click to browse + drag and drop)
- Toast notifications for full success, partial success, and error responses

## Result

- Admin can import users from CSV directly in the panel
- Import outcomes are transparent and actionable
- UI handles full success, partial success, and full failure consistently
- CSV flow is visually consistent with Users panel and shared design tokens

## UX Rules

- Import action is disabled while upload is in progress
- Report remains visible after response until next import attempt
- Row errors show row number, field, and message in readable form
- Backend machine-readable codes are translated to clear Polish UI text
- Accepted file type is `.csv` only
- Selected file can be removed before submit
- Format hint with required columns is visible in idle and file-selected states (hidden once an import result is displayed)

## UI Contract

### Tabs Integration

- Tabs in form card header:
	- `Add User` (icon `UserPlus`)
	- `Import CSV` (icon `Upload`)
- Active trigger style: violet text/background + bottom border
- Inactive trigger style: muted gray with hover feedback

### Drop Zone

- Hidden input: `type=file`, `accept=.csv`
- Click on zone opens native file picker
- Drag handlers: `onDragOver`, `onDragLeave`, `onDrop`
- Visual states:
	- idle: dashed neutral border
	- dragging: violet border + tinted background
	- file selected: emerald border + filename + size + remove action

### Format Hint

- Alert-like block below drop zone
- Content:
	- label: `Required columns`
	- values: `email, username`
- Uses amber surface and `AlertCircle` icon

### Import Action

- Full-width primary button with `Upload` icon
- Label: `Import Users`
- Disabled when:
	- no file selected
	- mutation pending

### Result Block

- Shown after mutation resolves (success, partial, or failure with structured payload)
- Summary values:
	- inserted
	- skipped
	- total
- Error rows list/table for `errors[]` when present:
	- row number
	- field
	- translated message

## API Alignment

### POST /api/users/import

Request:

- `multipart/form-data`
- field name: `file`

Success response (`200 OK`):

```ts
{
	inserted: number;
	skipped: number;
	total: number;
	errors: Array<{
		row: number;
		field: 'username' | 'email' | 'row';
		code: string;
		message: string;
	}>;
}
```

Failure response expectations:

- `400`: malformed request (for example missing file / invalid CSV structure)
- `413`: file too large (multer limit)
- `422`: parsed correctly but zero inserted (all rows invalid/duplicates)

### CSV Parsing Assumptions From Backend

- Headers are case-insensitive
- Username header aliases accepted by parser (`username`, `name`, `user`)
- Duplicates and invalid rows are counted in `skipped`

## Error/Toast Contract

- Full success (`inserted > 0`, `errors = 0`):
	- success toast: `Imported {inserted} users. Skipped: {skipped}.`
- Partial success (`inserted > 0`, `errors > 0`):
	- warning/success toast with same counter message
	- detailed row errors visible in result block
- Full failure (`422`):
	- error toast: `No users were imported. Check the error report.`
- Missing required columns:
	- error toast: `CSV must have "email" and "username" columns`
- Generic fallback:
	- backend message or `Something went wrong`

## Query Invalidation Rules

- After `inserted > 0`:
	- reset users page to `1`
	- invalidate users list query
- After `inserted = 0`:
	- do not force refetch
	- keep result report visible for diagnosis

## Suggested Frontend Structure

```text
apps/frontend/src/
	features/
		csv-import/
			csv-upload-panel.tsx
			import-result-table.tsx
			error-code-map.ts
			api.ts
			use-csv-import.ts
```

## Acceptance Criteria / Progress Checklist

- [x] `src/features/csv-import` contains API functions and mutation hook
- [x] Upload panel sends file under expected backend field name
- [x] UI displays summary values from import response
- [x] UI displays row-level errors with row/field/message
- [x] `200`, `400`, `413`, and `422` responses are handled with user-friendly messaging
- [x] Users list query is invalidated after successful or partial import
- [x] Unit/component tests cover key UI states (loading, success, partial, error)
- [x] CSV tab supports drag-and-drop and click-to-browse flows
- [x] Drop zone visual state changes are reflected correctly
- [x] Selected file metadata and remove action are available before import
- [x] Result report persists until a new import attempt starts

## Out of Scope

- CSV template download
- Persisting import history
