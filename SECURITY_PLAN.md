# AI CRM Platform Security Plan

## Purpose

This document is the security checklist for the college-project version of the AI CRM Platform. It focuses on protecting customer data, admin actions, orders, support tickets, agriculture records, AI usage, and deployment secrets without making the project unnecessarily difficult to run locally.

## Current risk summary

The initial audit found release-blocking issues:

- Several backend admin endpoints accepted anonymous requests.
- Customer-owned records trusted caller-supplied IDs, creating IDOR/BOLA risk.
- Order creation and status updates were not consistently protected.
- The JWT signing secret was hardcoded.
- API credentials existed in the local environment file and must be rotated before sharing or deploying.
- Tokens were stored in browser `localStorage`.
- Rate limiting, security headers, audit logging, and production-safe dependency scanning were missing.

## Security goals

1. Every protected API action is authenticated server-side.
2. A customer can access only their own orders, cart, wishlist, support tickets, crops, and crop issues.
3. Only an admin can operate the admin control plane.
4. Client-controlled identity, role, price, payment status, and workflow status are never trusted.
5. Secrets are supplied by the environment or a secret manager and are never bundled into the frontend.
6. Abuse is limited with request validation, rate limits, body-size limits, and safe error handling.
7. Sensitive actions are logged well enough for a demo administrator to investigate misuse.
8. Security behavior is covered by automated tests and dependency scans.

## Access model

### Public

- Health check.
- Public catalog reads: active products, categories, active deals, active banners, public agriculture advisories, and active schemes.
- Login and signup, protected by rate limits.

### Authenticated customer or farmer

- Own profile and password.
- Own cart and wishlist.
- Own orders and order actions.
- Own support tickets and messages.
- Own crops and crop issues.
- Reviews created by the authenticated user.
- AI assistant requests for the authenticated user.

### Admin

- Admin analytics and reports.
- Catalog, category, banner, deal, review, order, support, payment, crop issue, advisory, and scheme management.
- Customer/farmer directory.

The frontend route guards are convenience UX only. The backend is the security boundary.

## Implementation checklist

### P0 — complete before sharing or deploying

- [ ] Rotate all API keys currently present in local `.env` files.
- [x] Require a strong environment-provided JWT secret in staging/production.
- [x] Add backend `current_user` and `require_admin` dependencies.
- [x] Remove caller-controlled ownership from customer operations.
- [x] Protect all admin reads and writes.
- [x] Protect order creation, order reads, and order status changes.
- [x] Protect carts, wishlists, support tickets, crops, crop issues, reviews, and payments.
- [x] Add strict enum and range validation.
- [x] Add safe CORS and security headers.

### P1 — complete before a public demo

- [x] Add rate limiting to auth, AI, checkout, support, and selected write endpoints.
- [x] Add request/body-size limits and bounded list parameters.
- [x] Add structured audit events for unsafe requests and authenticated actions.
- [x] Upgrade vulnerable dependencies and verify with `pip-audit` and frontend lint/build.
- [x] Replace browser `localStorage` token storage with an HttpOnly cookie flow.
- [ ] Add email verification, password reset, and admin MFA when the project grows beyond classroom use.
- [ ] Add idempotency and real payment-provider webhook verification before accepting real money.

### P2 — good follow-up improvements

- [ ] Move production data to PostgreSQL with restricted credentials.
- [ ] Add encrypted backups and restore testing.
- [ ] Add OWASP ZAP staging scans and secret scanning.
- [ ] Add monitoring/alerting for repeated failures, suspicious admin changes, and unusual order activity.
- [ ] Add malware scanning and signed object storage if image/file uploads are introduced.
- [ ] Review AI-provider retention, consent, prompt injection, and agricultural-advice safety requirements.

## Required security tests

- [x] Anonymous access to protected APIs returns `401` or `403`.
- [x] Non-admin users cannot access admin APIs.
- Customer A cannot access or change customer B's records.
- Client-supplied customer IDs are ignored for authenticated customer actions.
- Client-supplied order status, role, price, payment status, and sender role cannot be used to escalate privileges.
- [x] Invalid and expired JWTs are rejected by the shared auth dependency.
- [x] Login, signup, AI, support, and checkout rate limits are wired and tested at the dependency level.
- [ ] Stock cannot become negative during concurrent checkout (requires a database transaction/concurrency test).
- [x] No authentication token is stored in frontend `localStorage`; audit logs redact sensitive fields.
- [x] Frontend build, backend tests, dependency audit, Python compilation, and linting pass locally.

## College-project operating rules

- Use the seed script only for local demo data.
- Never use the demo password or seeded admin account in a public deployment.
- Keep `.env` files out of commits and rotate keys if the workspace is shared.
- Run the API behind HTTPS when accessible beyond localhost.
- Treat this plan as a living document and check off items as features are added.
