# Phase 2 — Full Flow + Agriculture Domain

Everything deferred in Phase 1 gets built now, plus the Agriculture domain end to end.

## 1. Auth (backend + frontend)
- `Customer` model gets `password_hash`, `role` (customer|farmer|admin), `language` (en|te|hi)
- JWT auth: `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me`, `PUT /api/auth/me` (language update)
- Frontend: AuthContext (JWT in localStorage), axios interceptor, protected routes

## 2. Flow screens (frontend)
- Landing page (pre-login marketing/hero) → Login / Signup
- Language selection (English / Telugu / Hindi) — first login only, editable later
- Domain selection (E-Commerce / Agriculture) — every session start
- Routes: `/` landing → `/login` `/signup` → `/language` → `/domain` → `/ecommerce/*` or `/agriculture/*`

## 3. Agriculture domain (backend)
- `Category.domain` field (`ecommerce` | `agriculture`) — reuse Product/Order/Cart/Wishlist/Review/Deal/SupportTicket tables, filtered by domain. Matches the spec's "common AI and relationship-management layer."
- New models: `Crop` (My Crops), `CropIssue` (AI crop analysis reports), `Advisory` (farming tips), `Scheme` (govt schemes/announcements)
- New routers: crops, crop-issues, advisories, schemes
- Seed: Seeds/Fertilizers/Farming Tools categories + products, crops, crop issues, advisories, schemes

## 4. Agriculture domain (frontend)
- Customer app (AgriMart, green theme): Home (My Crops / Shop / Talk to Expert / Recommended), Crops, Shop (categories+products), Product detail, Cart, Checkout, Orders, Support — reuse backend, green-themed components
- Admin dashboard (AgriMart Admin): Dashboard (farmer KPIs, crop distribution, crop issue analysis), Farmers, Crops, Products, Categories, Orders, Crop Issues, Advisories & Tips, Schemes & Announcements, Support Tickets, Reports, Settings

## 5. Backend validation hardening
- `EmailStr` for emails, `Field` constraints (price/stock ≥ 0, qty ≥ 1, password min length)
- Duplicate-email → 409, bad login → 401, missing resource → 404 (already mostly in place)
- Non-empty order items, stock checks (already in place) kept consistent across domains

## Build order
Backend models → schemas → auth → agri routers/domain filters → seed → test via curl → frontend auth/flow pages → agriculture frontend → wire App.tsx routing → test in browser.
