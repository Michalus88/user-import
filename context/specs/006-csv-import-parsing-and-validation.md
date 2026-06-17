# 006 — CSV Parsing and Row Validation

## Goal

Implement deterministic CSV parsing and row-level validation so invalid records are reported precisely without blocking valid ones.

## Scope

- CSV parsing service for uploaded files (`csv-parse/sync`)
- Header validation (`username`, `email`)
- Row-level field validation for `username` and `email`
- In-file duplicate detection with reference to first occurrence
- Row-level error aggregation for import report

## Result

- CSV files are parsed into normalized row records
- Invalid rows are rejected with explicit row/field/code/message entries
- Valid rows proceed to persistence stage without being blocked by invalid ones

## Validation Rules

Headers:
- Required columns: `username`, `email`
- Column order is not significant — files with `email` before `username` are accepted
- Missing/unknown critical structure returns malformed payload response

Per row:
- `username` is required and non-empty after trim
- `email` is required and must pass email format validation

In-file duplicates:
- First occurrence is eligible for insert
- Each next occurrence is skipped and reported with duplicate error code

Accepted input variants:
- Encoding: UTF-8, with or without leading BOM (Excel-on-Windows export)
- Line endings: LF, CRLF
- Quoted fields containing commas (standard CSV escaping)

## Acceptance Criteria / Progress Checklist

- [x] CSV parser is extracted into dedicated import logic (service/helper)
- [x] Header validation rejects files missing required columns
- [x] Header validation is order-independent
- [x] Row validation enforces non-empty `username` and valid `email`
- [x] In-file duplicate emails are detected and reported per row
- [x] Error entries include row number, field, code, and message
- [x] Parser output cleanly separates valid rows from validation errors
- [x] UTF-8 BOM, CRLF line endings, and quoted commas are accepted
- [x] Unit tests cover header errors, field errors, duplicate-in-file behavior, and accepted input variants

## Out of Scope

- Database existence checks
- Batch insert implementation
- Upload size/row-count limits
- Auto-detection of non-UTF-8 encodings (Windows-1250/1252, ISO-8859-1/2) — production-grade handling discussed in analysis
- Delimiter auto-detection (semicolon-separated CSV from localized Excel) — production-grade handling discussed in analysis
- Pre-save preview UI for manual encoding/content confirmation — production-grade flow discussed in analysis
