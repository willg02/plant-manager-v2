# Plant Manager V2 — SaaS Roadmap

> Last updated: 2026-03-31
> Current state: Working MVP with admin panel, AI chat/design, CSV upload, regional filtering, Clerk auth (admin/client roles)

---

## Phase 1: Foundation Hardening (Current → 2 weeks)
*Goal: Make the existing product reliable and feel professional before adding revenue features.*

### 1.1 Observability & Error Tracking
- [ ] Add Sentry for error tracking (frontend + API routes)
- [ ] Add basic request logging (API response times, error rates)
- [ ] Add health-check endpoint (`/api/health`)

### 1.2 Background Job Reliability
- [ ] Replace fire-and-forget AI population with a proper queue (Inngest or Trigger.dev — both free tier, both work on Vercel)
- [ ] Add retry logic for failed AI population calls
- [ ] Show real-time batch progress on the admin UI (polling or SSE)

### 1.3 Performance & Caching
- [ ] Cache repeated AI chat queries (same region + same question = cached response)
- [ ] Add pagination to the Plants admin table (currently loads ALL 1000+ plants)
- [ ] Add search/filter to admin tables (plants, suppliers)
- [ ] Lazy-load plant detail modals instead of navigating to edit pages

### 1.4 Testing Baseline
- [ ] Set up Vitest
- [ ] Add tests for critical paths: CSV upload parsing, AI population data mapping, API auth middleware
- [ ] Add a basic CI check (GitHub Actions: lint + type-check + test)

---

## Phase 2: Supplier Self-Service Portal (2–4 weeks)
*Goal: Let suppliers manage their own inventory without admin intervention. This is the unlock for scaling beyond you manually uploading CSVs.*

### 2.1 Supplier Auth & Onboarding
- [ ] Add a `supplier` role to Clerk (admin / supplier / client)
- [ ] Supplier sign-up flow that links a Clerk user to a Supplier record
- [ ] Supplier dashboard: their inventory, upload history, profile

### 2.2 Supplier Inventory Management
- [ ] Supplier can upload their own CSVs
- [ ] Supplier can toggle in-stock / out-of-stock per item
- [ ] Supplier can update prices inline
- [ ] Supplier can see which plants are pending AI population

### 2.3 Inventory API (for future POS sync)
- [ ] REST API with API key auth for suppliers to push inventory programmatically
- [ ] `POST /api/v1/inventory/sync` — upsert availability records
- [ ] `GET /api/v1/inventory` — pull current inventory
- [ ] Rate limiting on API endpoints

---

## Phase 3: Monetization & Billing (4–6 weeks)
*Goal: Start generating revenue. Free tier drives adoption, paid tiers capture value.*

### 3.1 Stripe Integration
- [ ] Stripe Checkout for subscription creation
- [ ] Stripe Customer Portal for self-service billing management
- [ ] Webhook handler for subscription lifecycle events
- [ ] Store subscription status in DB (new `Subscription` model)

### 3.2 Pricing Tiers
| Tier | Price | Includes |
|------|-------|----------|
| **Free** | $0 | Browse plants, 5 AI chats/day, 1 design/day |
| **Pro** (Landscapers) | $29/mo | Unlimited AI chat & design, saved projects, PDF export, client proposals |
| **Supplier** | $49/mo | Inventory portal, CSV upload, API access, analytics |
| **Enterprise** | Custom | Multi-location, dedicated support, API priority |

### 3.3 Usage Gating
- [ ] Track AI usage per user (chat messages, design generations, image generations)
- [ ] Enforce free-tier limits with friendly upgrade prompts
- [ ] Gate PDF export, saved projects, and proposals behind Pro

---

## Phase 4: Saved Projects & Proposals (6–8 weeks)
*Goal: Make the AI Garden Designer sticky — users come back to edit and share their designs.*

### 4.1 Saved Designs
- [ ] New `Project` model (userId, regionId, name, designPlan JSON, status)
- [ ] Save/load designs from the Design page
- [ ] "My Projects" dashboard for logged-in users
- [ ] Duplicate / version a design

### 4.2 Client Proposals
- [ ] Generate a shareable proposal link from a saved design
- [ ] Proposal page: design plan + plant list + pricing + supplier info
- [ ] Client can approve/request changes (no auth required, token-based)
- [ ] PDF proposal export with branding

### 4.3 Design → Shopping List → Order
- [ ] Auto-generate a shopping list from a design plan
- [ ] Show which items are in stock at which suppliers
- [ ] "Request Quote" button that notifies the supplier(s)

---

## Phase 5: Multi-Tenancy & Team Features (8–12 weeks)
*Goal: Support landscaping companies with multiple team members and nurseries with multiple locations.*

### 5.1 Organization / Workspace Model
- [ ] New `Organization` model with tenant isolation
- [ ] Org-scoped data: projects, inventory, team members
- [ ] Shared global plant taxonomy (Plants remain global, availability is tenant-scoped)

### 5.2 Team & Roles
- [ ] Invite team members by email
- [ ] Roles: Owner, Manager, Crew (read-only)
- [ ] Activity log per org

### 5.3 Multi-Location Suppliers
- [ ] A supplier org can have multiple locations (each with its own inventory)
- [ ] Location-based availability filtering for end users

---

## Phase 6: Analytics & Intelligence (12–16 weeks)
*Goal: Provide data-driven insights that make the platform indispensable.*

### 6.1 Supplier Analytics
- [ ] Top-viewed plants (what are customers searching for?)
- [ ] Low-stock alerts (email/in-app)
- [ ] Seasonal demand trends
- [ ] Inventory health score

### 6.2 Landscaper Analytics
- [ ] Most-used plants across projects
- [ ] Average project cost
- [ ] Client conversion rate (proposals → approvals)

### 6.3 Platform Analytics (Internal)
- [ ] User engagement metrics (DAU, retention, feature usage)
- [ ] AI cost tracking (tokens used per feature)
- [ ] Revenue dashboards

---

## Phase 7: Integrations & Ecosystem (16+ weeks)
*Goal: Become the hub that connects the plant supply chain.*

### 7.1 POS Integrations
- [ ] Shopify inventory sync
- [ ] Square POS sync
- [ ] Generic webhook-based sync

### 7.2 External Integrations
- [ ] Zapier connector (trigger on new inventory, new design, etc.)
- [ ] Email notifications (Resend or SendGrid)
- [ ] SMS alerts for suppliers (low stock, new orders)

### 7.3 AI Enhancements
- [ ] Fine-tuned plant embeddings for better search relevance
- [ ] Model fallback chain (Claude → GPT-4 → fallback)
- [ ] Prompt versioning and A/B testing
- [ ] Plant image recognition (upload a photo → identify the plant)

---

## What NOT to Build Yet
These are commonly suggested but are premature at this stage:

| Suggestion | Why Wait |
|-----------|----------|
| OpenTelemetry | Sentry covers 90% of needs until you have real scale |
| CDN for images | Vercel already handles this; revisit when you host user uploads |
| Microservices | Monolith is correct until you have 10k+ users |
| OAuth (Google/Microsoft) | Clerk already supports this, just enable it in the dashboard |
| Magic links | Same — Clerk feature, flip a switch when needed |
| Custom embeddings | RAG with full context works fine at your current data size |

---

## Quick Reference: What Exists Today

| Area | Status |
|------|--------|
| Auth | Clerk (admin/client roles) |
| Database | PostgreSQL on Neon, Prisma ORM |
| AI Chat | Claude streaming with RAG |
| AI Design | Claude + fal.ai image generation |
| AI Population | Claude auto-fills plant data |
| Upload | CSV + PDF extraction |
| Scraper | Pike Nursery integration |
| Hosting | Vercel (auto-deploy from GitHub) |
| Billing | None |
| Testing | None |
| Error tracking | None |
| Background jobs | None (fire-and-forget) |
| Multi-tenancy | None (region-scoped only) |
| Analytics | Basic admin dashboard stats |
