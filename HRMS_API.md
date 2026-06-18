# HRMS API (Mobile)

Canonical API contract lives in [docs/openapi/hrms.yaml](docs/openapi/hrms.yaml).

## Base URL

- Relative: `/api/hrms`
- Authenticated requests use `Authorization: Bearer <accessToken>`
- Tokens are issued by `/auth/login` and refreshed by `/auth/refresh`

## Purpose Of This File

This file is a lightweight human overview for mobile developers. It should not
duplicate the full endpoint catalog, request schemas, or response schemas from
the OpenAPI document.

## Main API Areas

- `Auth`: login, token refresh
- `Profile`: profile read/update, password change
- `PIN`: local unlock-related endpoints
- `Config`: office, attendance, and Wi-Fi validation config
- `Attendance`: office proof, check-in/out, history, recap, dashboard, and reasons
- `Leave`: list, create, quota, detail, and approvals
- `Overtime`: list, create, detail, and approvals
- `Upload`: attendance, leave, and profile attachments

## Source Of Truth

- Endpoint paths, request bodies, and response schemas: `docs/openapi/hrms.yaml`
- App-side type mapping: `src/api/types.ts`
- App-side API helpers: `src/features/*/api.ts` and `src/api/upload.ts`

When API behavior changes, update the OpenAPI spec first, then align the mobile
types and helpers.
