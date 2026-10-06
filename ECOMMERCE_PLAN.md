# Phase 1 Plan — E-Commerce (TechKart) Only

Login, language selection, and domain switcher are deferred to the last phase. This phase builds the **entire E-Commerce domain** end to end, assuming an already-logged-in test user.

## Scope — nothing from the mockups gets skipped

### Customer app (TechKart)
- Home: greeting, location/weather strip, voice search bar (UI only for now, no STT yet), category quick-tiles, "Recommended for You", "Today's Deals"
- Categories browse page
- Product listing (per category) with filters
- Product detail page: specs, price, reviews, warranty/availability, add to cart/wishlist
- Cart page: line items, qty update, remove, subtotal
- Wishlist page
- Checkout flow: address, payment method (mock), order confirmation
- Order tracking page: status (pending/processing/shipped/delivered/cancelled), order history list
- Support: ticket list + create ticket
- Bottom nav: Home / Categories / Cart / Support

### Admin dashboard (E-Commerce Admin)
- Dashboard: KPI cards (orders, customers, revenue, products), sales overview chart, order status donut, top-selling products, recent orders, low-stock products, customer growth chart, top categories, quick actions
- Products: list, create/edit/delete, stock mgmt
- Categories: CRUD
- Orders: list, detail, update status
- Customers: list, detail (order history, activity)
- Inventory: stock levels, low-stock alerts
- Deals & Offers: CRUD discounts tied to products
- Reviews: list, moderate
- Payments: transaction list (mock/stub)
- Reports: exportable summaries (orders/revenue/customers)
- Banners: CRUD promotional banners
- Support Tickets: list, respond, close
- Settings: store profile/settings page

## Build order (backend-first per feature, then frontend wired to it)

1. **Repo scaffold** — `/backend` (FastAPI + SQLAlchemy + SQLite, Alembic ready) and `/frontend` (Vite + React + TS + Tailwind + shadcn/ui + Lucide icons, theme tokens from TECH_STACK.md)
2. **Data models** — Product, Category, Customer (stub, no auth yet — seeded fake users), Cart, CartItem, Wishlist, Order, OrderItem, Review, Deal, Banner, SupportTicket, Payment (stub)
3. **Seed data** — realistic electronics catalog (laptops/mobiles/tablets/earphones/smartwatches/cameras/accessories) matching the mockup's product names so it looks real immediately
4. **Backend APIs**, domain by domain:
   - Products & Categories (CRUD + list/filter)
   - Cart & Wishlist
   - Orders & Order tracking
   - Reviews
   - Deals & Offers
   - Banners
   - Support Tickets
   - Admin analytics endpoints (KPIs, sales-over-time, order-status breakdown, top products, low stock, customer growth, top categories)
5. **Frontend — shared shell**: layout, theme (dark/light, blue/violet accent), Lucide icon set, base shadcn components (button, card, input, dialog, dropdown, table, badge, tabs, toast)
6. **Frontend — Customer app pages**, wired to real API, in this order: Home → Category/Product listing → Product detail → Cart → Wishlist → Checkout → Orders/Tracking → Support
7. **Frontend — Admin dashboard pages**, wired to real API, in this order: Dashboard (KPIs+charts) → Products → Categories → Orders → Customers → Inventory → Deals & Offers → Reviews → Payments → Reports → Banners → Support Tickets → Settings
8. **Polish pass**: animations (framer-motion), empty/loading/error states, responsive check, consistent spacing/typography against TECH_STACK.md

## Explicitly out of scope for this phase
Login/signup, language selection, domain switcher, voice assistant/STT-TTS, RAG/knowledge base, sentiment analysis, next-best-action, Agriculture domain, admin's shared multi-domain views. All of these come later per the original roadmap.

---
Starting now: repo scaffold → models → seed data → APIs → frontend shell → customer pages → admin pages → polish.
