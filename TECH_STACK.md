# Tech Stack & Design System

## Stack decision

| Layer | Choice | Why |
|---|---|---|
| Frontend | React (Vite) + TypeScript + Tailwind CSS | Fast dev, full control over design, no framework lock-in |
| UI components | **shadcn/ui** (Radix primitives underneath) | You copy the component code into the repo and own it — fully restyleable, accessible (WAI-ARIA via Radix), ~18KB vs Material UI's ~95KB or Ant Design's ~120KB. Best fit for a custom, non-generic look instead of an out-of-the-box "bootstrappy" feel. |
| Icons | **Lucide** (primary) + **Phosphor** (for anything needing filled/duotone weight, e.g. empty states, marketing sections) | Lucide is the de-facto React standard and shadcn's default — 1,500+ consistent outline icons. Phosphor adds 6 weights (Thin/Light/Regular/Bold/Fill/Duotone) for spots that need more visual weight. |
| Charts | Recharts or Tremor (built on top of shadcn patterns) | Matches the bar/donut/line charts in the original mockups |
| Backend | FastAPI (Python) | Async, typed, auto docs (OpenAPI/Swagger), great fit for wiring in AI/RAG services later |
| ORM / DB layer | SQLAlchemy 2.0 (or SQLModel) + Alembic for migrations | **Not tightly coupled to SQLite.** SQLAlchemy abstracts the SQL dialect — start on SQLite file DB for local dev, swap the `DATABASE_URL` to Postgres (or MySQL) in production with no code changes, just a connection string + driver swap. |
| Dev DB | SQLite | Zero-setup local dev/testing |
| Prod-ready DB | PostgreSQL (when you're ready to deploy) | Drop-in swap via SQLAlchemy, same models/migrations |
| Auth | JWT (FastAPI + passlib/bcrypt) | Standard, stateless, scales fine |
| Vector store (for RAG, later) | Start with `pgvector` (Postgres extension) or Chroma locally — decide when we build the AI layer | Keeps infra minimal until actually needed |

This gives you: **React + shadcn/ui + Lucide/Phosphor icons on the frontend, FastAPI + SQLAlchemy (SQLite→Postgres-ready) on the backend.**

## Visual identity (the "crazy / next-level" look)

### Fonts
**Primary pairing: Geist (UI/body) + Bricolage Grotesque (headlines/display)**
- Geist — one of the most-installed sans-serifs right now, clean modern proportions, built for product UI — use for body text, nav, buttons, forms.
- Bricolage Grotesque — the trending display typeface, distinctive character but still professional — use for big headlines, hero sections, dashboard section titles.
- Fallback stack: `Geist, Inter, system-ui, sans-serif`

Alternative if you want something bolder for marketing pages: Fraunces (display) + Hanken Grotesk (body).

### Color palette — dual-domain theme
Since the platform has two domains, the palette needs one neutral base + two accent systems that swap in per domain, not two totally different brand identities.

**Neutral/base (shared everywhere — dashboards, text, surfaces):**
- Background: `#0B0D10` (near-black, dark mode default) / `#FAFAFA` (light mode)
- Surface: `#15181C` (dark) / `#FFFFFF` (light)
- Border: `#262A2F` (dark) / `#E5E7EB` (light)
- Text primary: `#F5F6F7` (dark) / `#0B0D10` (light)
- Text muted: `#9AA1A9`

**E-Commerce (TechKart) accent — electric blue/violet, tech feel:**
- Primary: `#4F6BFF`
- Primary hover: `#3A53E0`
- Accent glow: `#8B5CF6` (violet, for gradients/highlights)
- Success: `#22C55E` · Warning: `#F59E0B` · Danger: `#EF4444`

**Agriculture (AgriMart) accent — deep green/earth, organic feel:**
- Primary: `#2FA84F`
- Primary hover: `#228A3E`
- Accent glow: `#C7F24A` (lime, for highlights/badges)
- Success/Warning/Danger: same as above for consistency across admin

**Usage rule:** neutral base + text colors never change between domains — only the primary/accent color token swaps (via a CSS variable / Tailwind theme toggle) when the user switches from E-Commerce to Agriculture. This is what makes it feel like "one crazy good platform" instead of two unrelated apps glued together.

### Visual style direction
- Dark mode first (default), light mode as a toggle — dashboards and product data read better on dark surfaces, and it reads premium/SaaS rather than generic e-commerce
- Glassmorphism-lite: subtle frosted/blurred cards for hero sections and modals, not overused
- Soft glow accents behind key CTAs and KPI cards (using the accent glow colors above)
- Generous whitespace, large rounded corners (`rounded-2xl`/`rounded-3xl` on cards), soft shadows — not sharp corporate-dashboard edges
- Micro-interactions: hover lift on cards, animated number counters on KPI tiles, smooth page transitions (use `framer-motion`)
- Charts styled to match the palette, not default library colors

## What's next
Once you confirm this stack + look, next steps would be:
1. Scaffold the repo structure (`/frontend`, `/backend`)
2. Set up Tailwind + shadcn/ui + the color tokens/fonts above as a theme config
3. Build the base layout shell (nav, sidebar, domain switcher) with no real data yet, just to see the look
4. Wire FastAPI + SQLAlchemy + SQLite with a basic health-check endpoint

Say the word and I'll start scaffolding.

## Sources
- [Comparing shadcn/ui vs Radix — DaisyUI](https://daisyui.com/compare/shadcn-vs-radix/?lang=ar)
- [8 Best React Component Libraries in 2026 — UXPin](https://www.uxpin.com/studio/blog/top-react-component-libraries/)
- [Best Free SVG Icon Libraries 2026 — allsvgicons](https://allsvgicons.com/blog/best-free-svg-icon-libraries-2026/)
- [Phosphor Icons vs Lucide — allsvgicons](https://allsvgicons.com/compare/phosphor-vs-lucide/)
- [Best New Google Fonts of 2026 — MadeGoodDesigns](https://madegooddesigns.com/best-new-google-fonts-2026/)
- [Font pairings resource — Mintlify](https://mintlify.com/nextlevelbuilder/ui-ux-pro-max-skill/resources/font-pairings)
- [FastAPI SQL Databases tutorial](https://fastapi.tiangolo.com/tutorial/sql-databases/)
- [Building Production-Ready APIs with FastAPI, SQLAlchemy, Alembic](https://pub.towardsai.net/building-production-ready-apis-with-fastapi-sqlalchemy-and-alembic-a-complete-guide-a4656b7e700c)
