# AI-Powered Multi-Domain Commerce and Relationship Management Platform

Source spec: [docs/AICRM.pdf](docs/AICRM.pdf)

## What this project actually is

One platform, two "stores" bolted onto a shared AI/CRM brain:

1. **TechKart** — electronics e-commerce (laptops, mobiles, tablets, earphones, smartwatches, cameras, accessories)
2. **AgriMart** — agriculture commerce + farmer support (seeds, fertilizers, farming tools)

Same login, same AI engine, same database layer underneath — but the customer picks a domain after login and gets a completely different storefront, product catalog, and voice/AI experience tuned to that domain. Admin manages both domains from one dashboard.

## Roles / apps needed (from the mockups)

| App | Who | What it shows |
|---|---|---|
| E-Commerce Customer (TechKart) | Shopper | Home feed, voice search bar, category tiles, "Recommended for You", "Today's Deals", cart/support bottom nav |
| E-Commerce Admin | Store admin | Orders/customers/revenue KPIs, sales chart, order status donut, top-selling products, low-stock alerts, customer growth, top categories, support tickets |
| Agriculture Customer (AgriMart) | Farmer | Localized greeting (shown in Telugu in the mockup), voice bar ("మీకు ఏమి కావాలి?"), My Crops, Products, Talk to Expert, recommended agri-products |
| Agriculture Admin | Agri admin | Farmer/crop-entry/order/revenue KPIs, farmer registration trend, crop distribution donut, **crop issue analysis** (leaf disease, pest attack, nutrient deficiency, weather damage), top sold agri products, crop issues management |

Both admin panels share the same shell/layout pattern (sidebar nav, KPI cards, charts, "recent orders", quick-action buttons) — that's a strong signal they should share one admin UI codebase with domain-specific modules swapped in, not two separate admin apps.

## Core flow (from the diagram on page 5)

```
User Access (Customer/Farmer)
   → Login/Signup
   → Language Selection (English / Telugu / Hindi)
   → Domain Selection (E-Commerce / Agriculture)
   → Domain-specific browse → cart/wishlist → order → tracking → AI assistant
```

Everything downstream feeds into one **Multilingual AI Engine**:

```
Voice or text input
  → Speech-to-Text (if voice)
  → Language detection (En/Te/Hi)
  → Intent detection + sentiment analysis (happy/neutral/frustrated)
  → Pull user context (profile, search history, wishlist, cart, past orders, past conversations)
  → RAG retrieval from the correct domain Knowledge Base (E-Commerce KB or Agriculture KB)
  → LLM generates a response grounded in that retrieved context
  → Output as text (in selected language) and/or synthesized speech
```

In parallel, every interaction also feeds a **Next-Best-Action** engine: based on query + sentiment + order/cart state, it decides whether to surface order info, recommend a product, open a support ticket, suggest a replacement, or escalate to a human — then notifies the user (in-app, and optionally push/email).

All of it — users, orders, conversations, sentiment scores, analytics — lands in one database that the **Admin Dashboard** reads from for both domains.

## What you'd actually need to build this

**Frontend (2 customer apps + 1 shared admin, or 1 app with domain theming)**
- Web or mobile client with: auth, language switcher, domain switcher, product browse/search, cart/wishlist, checkout, order tracking, voice input button, chat/assistant UI, support tickets
- Admin dashboard: KPI cards, charts (bar/donut/line — matches the mockups), CRUD for products/categories/orders/users, support ticket inbox, knowledge-base editor, analytics/reports

**Backend**
- Auth service (users, roles: customer/farmer/admin)
- Catalog service per domain (products, categories, inventory, pricing, deals)
- Order service (cart, checkout, order status, tracking)
- Support ticket service
- Conversation/history store (per-user, isolated — "without mixing information between users" is an explicit requirement)
- Analytics/reporting service for admin

**AI layer — the actual hard part**
- Speech-to-text + text-to-speech (multilingual: English/Telugu/Hindi)
- Language identification + intent classification
- Sentiment analysis on user messages
- Two separate RAG pipelines (vector store + retriever) — one E-Commerce KB, one Agriculture KB — so answers don't cross-contaminate domains
- A personalization layer that assembles per-user context (profile, history, cart, wishlist, orders, reviews, past chats) before each LLM call
- Cold-start handling: fall back to popularity/top-seller recommendations until a user has enough activity
- Next-best-action decision logic (rules or a lightweight classifier) that maps intent+sentiment+state → action

**Data**
- User data: profile, search history, viewed products, wishlist, cart, orders, reviews, conversations
- Product data per domain
- Knowledge base content per domain (specs, policies, FAQs, crop/fertilizer guidance, etc.)
- Analytics/event logs for admin reporting

**Infra**
- DB (relational for transactional data, vector DB for RAG embeddings)
- Auth/session management
- API layer connecting clients ↔ AI services ↔ data
- Notification channel (in-app at minimum; email/push optional per the diagram)

## Suggested build order

1. Auth + language/domain selection shell (no AI yet) — gets the skeleton flow working end to end
2. One domain's catalog + cart + checkout + order tracking (pick E-Commerce first, it's simpler)
3. Admin dashboard reading from that same data (reuse the TechKart admin layout)
4. Repeat catalog/cart/order/admin for Agriculture domain
5. Add the knowledge bases (start as plain FAQ/spec documents) + basic RAG chat (text only, no voice yet)
6. Add personalization (pull user context into the RAG prompt) + cold-start fallback to top-sellers
7. Add sentiment analysis + next-best-action + support-ticket auto-creation
8. Add speech-to-text/text-to-speech and wire up the voice button
9. Add multilingual support across UI strings + AI responses (Telugu/Hindi)
10. Analytics/reporting polish on admin side

## Notes on the mockups themselves

- TechKart (e-commerce) uses a blue theme; AgriMart (agriculture) uses a green/earth theme and localizes UI text (the farmer home screen is shown entirely in Telugu) — confirms the "same engine, different skin" approach, including per-domain language defaults.
- The Agriculture admin has a domain-specific module the e-commerce admin doesn't: **Crop Issue Analysis / AI Analysis / Advisories & Tips / Schemes & Announcements** — this is agriculture-specific AI (likely image-based crop disease detection feeding "crop issues reported"), separate from the chat/voice assistant.
- Both admins expose "Generate Reports" as a quick action, and both show a 4-stage order-status breakdown (Delivered/Processing/Shipped/Cancelled) — build this as a shared reusable component.
