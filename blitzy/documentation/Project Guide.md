# Blitzy Project Guide — Slack Clone Expansion

---

## 1. Executive Summary

### 1.1 Project Overview

This project transforms a minimal 3-endpoint Next.js Slack Clone into a comprehensive, multi-screen messaging application that reproduces 20 distinct Slack web interface screen categories. The primary deliverable is `CONTRACTS.md` — an exhaustive API contract document defining 36 endpoints across 20 screen categories. The expansion includes 20 reusable UI components, 13 workspace page routes, a 16-table PostgreSQL database schema with seed data, and a full Playwright test suite. The application targets developers and stakeholders evaluating Slack UI/UX patterns using a self-contained, mock-data-driven Next.js 16.2.1 monolith.

### 1.2 Completion Status

```mermaid
pie title Project Completion Status
    "Completed (146h)" : 146
    "Remaining (26h)" : 26
```

| Metric | Value |
|--------|-------|
| **Total Project Hours** | 172 |
| **Completed Hours (AI)** | 146 |
| **Remaining Hours** | 26 |
| **Completion Percentage** | 84.9% |

**Calculation:** 146 completed hours / (146 + 26) total hours = **84.9% complete**

### 1.3 Key Accomplishments

- ✅ **CONTRACTS.md delivered** — 2,734-line primary deliverable documenting 36 API endpoints across 20 screen categories with TypeScript interfaces, status codes, and example payloads
- ✅ **20 UI components built** — 8,549 lines of Slack-faithful React components covering Sidebar, MessageBubble, ThreadPanel, SearchResults, EmojiPicker, FileBrowser, PreferencesModal, and 13 more
- ✅ **17 new API routes + 3 updated** — Complete backend for DMs, threads, reactions, pins, search, activity feeds, files, saved items, user profiles, workspace metadata, and preferences
- ✅ **13 workspace page routes** — Channel view, DM view, thread view, search, activity, files, people, saved items, channel browser, canvas, preferences, and DM listing
- ✅ **16-table database schema** — Expanded from 3 tables (users, channels, messages) to 16 tables with comprehensive seed data
- ✅ **120/120 tests passing** — 93 API contract validation tests + 27 screenshot capture tests via Playwright
- ✅ **27 post-implementation screenshots** — Captured at 1440×900 viewport in `screenshots/output/`
- ✅ **Zero compilation errors** — TypeScript strict mode fully satisfied
- ✅ **Zero lint errors** — ESLint clean across entire codebase
- ✅ **Successful production build** — Next.js generates 35 routes (23 static, 12 dynamic)
- ✅ **Monolith decomposed** — Original 248-line `page.tsx` refactored into modular component architecture with workspace route groups
- ✅ **Security enhancements** — Input validation module, security headers (X-Content-Type-Options, X-Frame-Options, CSP), text sanitization

### 1.4 Critical Unresolved Issues

| Issue | Impact | Owner | ETA |
|-------|--------|-------|-----|
| No visual comparison utility for reference screenshots | Cannot verify pixel-level fidelity against 1,000 reference images | Human Developer | 3h |
| No `.env.example` template | Developers must manually discover required environment variables | Human Developer | 1h |
| No Docker configuration | Cannot deploy to containerized environments | Human Developer | 4h |
| No CI/CD pipeline | No automated build/test/deploy on commits | Human Developer | 4h |
| Destructive DB initialization (`DROP TABLE IF EXISTS`) | Re-running `init-db.sql` destroys all data; no migration strategy | Human Developer | 2h |

### 1.5 Access Issues

| System/Resource | Type of Access | Issue Description | Resolution Status | Owner |
|-----------------|---------------|-------------------|-------------------|-------|
| GitHub Screenshots Repository | Read (HTTPS) | Reference screenshots at `github.com/kubowania/blitzy-slack/tree/main/screenshots` require public internet access for visual comparison | Open — no automated download/comparison implemented | Human Developer |
| PostgreSQL Database | Local admin | Database requires manual `psql` initialization with `init-db.sql`; no automated provisioning | Documented in README | Human Developer |

### 1.6 Recommended Next Steps

1. **[High]** Build screenshot comparison utility (`tests/screenshots/comparison.ts`) to enable automated visual fidelity verification against the 1,000 reference screenshots
2. **[High]** Perform visual fidelity audit — compare 27 captured screenshots with closest reference images and adjust CSS for pixel-level matching
3. **[Medium]** Create `.env.example` template with documented environment variables for team onboarding
4. **[Medium]** Add Docker configuration (Dockerfile + docker-compose.yml) for containerized deployment with PostgreSQL
5. **[Medium]** Set up CI/CD pipeline (GitHub Actions) for automated build, lint, test, and deployment

---

## 2. Project Hours Breakdown

### 2.1 Completed Work Detail

| Component | Hours | Description |
|-----------|-------|-------------|
| CONTRACTS.md (API Documentation) | 12 | Primary deliverable — 2,734 lines documenting 36 API endpoints across 20 screen categories with TypeScript interfaces, request/response schemas, status codes, and example payloads |
| UI Component Library (20 components) | 48 | 8,549 lines — Sidebar, ChannelHeader, MessageBubble, MessageInput, ThreadPanel, UserAvatar, SearchResults, ActivityFeed, FileBrowser, PeopleDirectory, ChannelBrowser, SavedItems, UserProfile, PreferencesModal, EmojiPicker, ModalDialog, BookmarksBar, HuddleOverlay, CanvasEditor, StatusSelector |
| API Route Handlers (17 new + 3 updated) | 30 | 3,196 lines — DMs (GET/POST), DM messages, reactions (GET/POST/DELETE), thread replies, pin/unpin, channel members, channel pins, channel files, channel browse, search, activity, files, saved items, user profile, user status, workspace, preferences; plus extensions to channels, messages, users routes |
| Page Routes (13 pages + workspace layout) | 16 | 1,703 lines — channel/[id], dm/[id], dm listing, thread/[id], search, activity, files, people, saved, channels/browse, canvas, preferences pages + shared workspace layout with persistent sidebar |
| Database Schema Expansion | 6 | Expanded init-db.sql from 3 to 16 tables (threads, reactions, pins, direct_messages, dm_members, dm_messages, files, channel_members, user_statuses, workspace, user_preferences, saved_items, mentions) with 14 indexes and comprehensive seed data |
| Library Modules | 10 | types.ts (481 lines — 15+ shared TypeScript interfaces), mock-data.ts (1,170 lines — 16 typed mock data exports), validation.ts (155 lines — input validation utilities), providers.tsx (192 lines — WorkspaceProvider context) |
| Test Suite (120 tests) | 8 | contracts.spec.ts (1,189 lines — 93 API contract tests covering all 17 endpoints), screenshots.spec.ts (606 lines — 27 screenshot capture tests covering all 20 screen categories) |
| Configuration and Styling | 4 | playwright.config.ts (78 lines), next.config.ts security headers update (40 lines), globals.css Slack design token expansion (182 lines), package.json dependency and script updates |
| Monolith Refactoring | 2 | Decomposed 248-line page.tsx into redirect shell; updated layout.tsx with WorkspaceProvider wrapping |
| QA Fixes and Code Review Resolutions | 8 | 12 fix commits addressing 160+ findings: API schema alignment, search robustness, UI data-testid attributes, security headers, input validation, emoji picker viewport, reaction toggle, message overflow, sidebar active state, type safety, error handling, LIMIT clauses |
| README.md Update | 2 | Updated from basic setup guide to comprehensive project documentation with feature list, CONTRACTS.md reference, expanded setup instructions, architecture overview, and API route table |
| **Total Completed** | **146** | |

### 2.2 Remaining Work Detail

| Category | Hours | Priority |
|----------|-------|----------|
| Screenshot Comparison Utility | 3 | High |
| Visual Fidelity Verification & CSS Adjustments | 4 | High |
| Screenshot-to-Reference Mapping Documentation | 1 | Medium |
| Environment Configuration Template (.env.example) | 1 | Medium |
| Docker Deployment Configuration | 4 | Medium |
| CI/CD Pipeline Setup | 4 | Medium |
| Security Hardening (rate limiting, production CORS) | 3 | Medium |
| Production Database Migration Strategy | 2 | Low |
| Monitoring & Logging Setup | 2 | Low |
| Performance Testing & Optimization | 2 | Low |
| **Total Remaining** | **26** | |

### 2.3 Hours Reconciliation

- **Section 2.1 Total (Completed):** 146 hours
- **Section 2.2 Total (Remaining):** 26 hours
- **Grand Total:** 146 + 26 = **172 hours** (matches Section 1.2 Total Project Hours)
- **Completion:** 146 / 172 = **84.9%** (matches Section 1.2 percentage)

---

## 3. Test Results

| Test Category | Framework | Total Tests | Passed | Failed | Coverage % | Notes |
|---------------|-----------|-------------|--------|--------|------------|-------|
| API Contract Validation | Playwright (API mode) | 93 | 93 | 0 | N/A | Validates all 17 API endpoints: HTTP methods, response schemas, status codes, error handling, pagination, and filtering. Completed in 10.4s |
| Screenshot Capture | Playwright (Browser) | 27 | 27 | 0 | N/A | Captures all 20 screen categories at 1440×900 viewport: channel views (3), DM views (2), thread panel + dedicated, channel browser, people, search (3 tabs), activity, saved, files, apps, settings, preferences, channel details (2), profile, emoji, huddle, canvas, create channel, invite, compose. Completed in 1.1m |
| TypeScript Compilation | tsc --noEmit | N/A | ✅ | 0 | 100% | Zero errors under strict mode across all 65+ source files |
| ESLint Static Analysis | eslint 9.x | N/A | ✅ | 0 | 100% | Zero errors, zero warnings across entire codebase |
| Next.js Production Build | next build | 35 routes | ✅ | 0 | 100% | 23 static + 12 dynamic routes generated successfully in 3.0s |
| **Total** | | **120** | **120** | **0** | **100%** | **All gates passed** |

---

## 4. Runtime Validation & UI Verification

### Runtime Health

- ✅ **Next.js Dev Server** — Starts successfully on port 3000
- ✅ **PostgreSQL Connection** — Pool connects to `slack_app` database with 16 tables populated
- ✅ **Root Route (/)** — Returns HTTP 307 redirect to `/channel/1` (default channel)
- ✅ **Channel View (/channel/[id])** — HTTP 200, renders sidebar + message list + composer
- ✅ **DM View (/dm/[id])** — HTTP 200, renders DM conversation with participant info
- ✅ **Thread View (/thread/[id])** — HTTP 200, renders parent message + thread replies
- ✅ **Search (/search)** — HTTP 200, renders search with tabs (Messages/Channels/Files)
- ✅ **Activity (/activity)** — HTTP 200, renders activity feed with mentions and thread replies
- ✅ **Files (/files)** — HTTP 200, renders file browser with type/channel filtering
- ✅ **People (/people)** — HTTP 200, renders people directory with user profiles
- ✅ **Saved Items (/saved)** — HTTP 200, renders bookmarked messages and files
- ✅ **Channel Browser (/channels/browse)** — HTTP 200, renders browseable channel list
- ✅ **Canvas (/canvas)** — HTTP 200, renders visual canvas editor mockup
- ✅ **Preferences (/preferences)** — HTTP 200, renders tabbed preferences modal

### API Integration

- ✅ **GET /api/channels** — Returns 5 channels with member_count, unread_count, last_message_preview
- ✅ **GET /api/channels/1/messages** — Returns 12 messages with thread_reply_count, reaction_summary, is_pinned
- ✅ **POST /api/channels/1/messages** — Creates message and returns enriched response (201)
- ✅ **GET /api/users** — Returns 4 users with status_emoji, status_text, display_name, title
- ✅ **GET /api/dms** — Returns DM conversations with member info and last message preview
- ✅ **GET /api/search** — Returns search results filtered by type (messages/channels/files)
- ✅ **GET /api/activity** — Returns activity feed items (mentions, thread replies)
- ✅ **GET /api/files** — Returns workspace files with metadata
- ✅ **GET /api/saved** — Returns saved items (messages and files)
- ✅ **GET /api/workspace** — Returns workspace metadata (name, member count, plan)
- ✅ **GET /api/preferences** — Returns user preference settings
- ✅ **All 17 endpoint groups** return valid JSON with correct schemas

### UI Verification (Screenshots Captured)

- ✅ 27 screenshots captured at 1440×900 in `screenshots/output/`
- ✅ All 20 screen categories represented
- ⚠ **Visual fidelity comparison with reference screenshots not yet performed** — requires human review

---

## 5. Compliance & Quality Review

| AAP Deliverable | Status | Evidence | Notes |
|-----------------|--------|----------|-------|
| CONTRACTS.md at project root | ✅ Complete | 2,734-line file with 20 screen sections, 36 endpoints | Primary deliverable — standalone API contract document |
| 20 UI Components | ✅ Complete | 20 files in `src/app/components/` totaling 8,549 lines | All components from AAP Section 0.5.2 implemented |
| 17 New API Route Handlers | ✅ Complete | 17 route files in `src/app/api/` | All endpoints from AAP Section 0.6.1 created |
| 3 Existing API Routes Extended | ✅ Complete | channels, messages, users routes updated | member_count, thread_reply_count, status fields added |
| 13 Page Routes (workspace group) | ✅ Complete | 13 pages + layout in `src/app/(workspace)/` | All screen categories have dedicated routes |
| Database Schema (16 tables) | ✅ Complete | init-db.sql expanded to 297 lines | 13 new tables + indexes + seed data |
| Shared TypeScript Types | ✅ Complete | `src/lib/types.ts` — 481 lines, 15+ interfaces | Extracted from page.tsx + new domain types |
| Mock Data Module | ✅ Complete | `src/lib/mock-data.ts` — 1,170 lines, 16 exports | Typed mock objects matching seed data |
| Playwright Configuration | ✅ Complete | `playwright.config.ts` — 1440×900, Chromium, auto-server | Matches AAP viewport and browser specs |
| Contract Validation Tests | ✅ Complete | 93/93 tests passing | All 17 endpoints validated |
| Screenshot Capture Tests | ✅ Complete | 27/27 tests passing, 27 PNGs generated | All 20 screen categories captured |
| page.tsx Monolith Refactored | ✅ Complete | 248→19 lines, redirects to /channel/1 | Components decomposed into reusable modules |
| Existing API Backward Compatibility | ✅ Complete | Extended fields are additive only | Original response shapes preserved |
| Slack Color Palette Preserved | ✅ Complete | globals.css has 20+ Slack color tokens | #3F0E40, #1164A3, #007A5A, etc. |
| TypeScript Strict Mode | ✅ Complete | `tsc --noEmit` — 0 errors | All 65+ source files compile cleanly |
| No Authentication (by design) | ✅ Complete | User switching via dropdown, unauthenticated APIs | Per AAP constraint C-001 |
| 3-Second Polling Preserved | ✅ Complete | Channel and DM pages poll at 3s intervals | No WebSocket introduction per AAP rules |
| Security Headers | ✅ Complete | next.config.ts with X-Frame-Options, CSP, etc. | Added during QA security fixes |
| Input Validation | ✅ Complete | `src/lib/validation.ts` — 155 lines | Centralized sanitization and length enforcement |
| Screenshot Comparison Utility | ❌ Not Started | — | `tests/screenshots/comparison.ts` not created |
| Visual Fidelity Verification | ⚠ Partial | 27 screenshots captured but no comparison | Pixel-level matching against references needed |

### Quality Metrics

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| TypeScript Errors | 0 | 0 | ✅ Pass |
| ESLint Errors | 0 | 0 | ✅ Pass |
| Test Pass Rate | 100% | 100% (120/120) | ✅ Pass |
| Build Success | Yes | Yes (35 routes) | ✅ Pass |
| API Routes Documented | 36 | 36 | ✅ Pass |
| Screen Categories Covered | 20 | 20 | ✅ Pass |
| Database Tables | 16 | 16 | ✅ Pass |

---

## 6. Risk Assessment

| Risk | Category | Severity | Probability | Mitigation | Status |
|------|----------|----------|-------------|------------|--------|
| Visual fidelity deviation from reference screenshots | Technical | High | Medium | Capture comparison screenshots; CSS adjustments per screen | Open — screenshots captured, comparison pending |
| Destructive database initialization (DROP TABLE IF EXISTS) | Operational | High | High | Implement proper migration tooling (e.g., node-pg-migrate); add backup before re-init | Open — current pattern destroys all data on re-run |
| No rate limiting on API endpoints | Security | Medium | Medium | Add express-rate-limit or Next.js middleware-based rate limiting for production | Open — not implemented |
| No secrets management | Security | Medium | Medium | Use environment variable validation at startup; add .env.example template | Open — DATABASE_URL only documented in README |
| No Docker or container support | Operational | Medium | Low | Add Dockerfile + docker-compose.yml for PostgreSQL + Next.js | Open — local development only |
| No CI/CD pipeline | Operational | Medium | Low | Add GitHub Actions workflow for build, lint, test on PR/push | Open — manual testing only |
| Mock data only — no real data ingestion | Technical | Low | High | By design per AAP — application uses seeded PostgreSQL data only | Accepted — mock-data architecture is intentional |
| No WebSocket real-time updates | Technical | Low | High | 3-second polling preserved per AAP — acceptable for demo/reference app | Accepted — per AAP constraint |
| No error monitoring in production | Operational | Medium | Medium | Integrate Sentry or similar APM for production error tracking | Open — not implemented |
| Package version drift over time | Technical | Low | Medium | Lock exact versions in package-lock.json (committed); periodic dependency updates | Mitigated — lock file committed |

---

## 7. Visual Project Status

```mermaid
pie title Project Hours Breakdown
    "Completed Work" : 146
    "Remaining Work" : 26
```

### Remaining Work by Priority

| Priority | Hours | Categories |
|----------|-------|------------|
| High | 7 | Screenshot Comparison Utility (3h), Visual Fidelity Verification (4h) |
| Medium | 13 | Screenshot Mapping (1h), Env Template (1h), Docker (4h), CI/CD (4h), Security Hardening (3h) |
| Low | 6 | DB Migration Strategy (2h), Monitoring (2h), Performance Testing (2h) |
| **Total** | **26** | |

---

## 8. Summary & Recommendations

### Achievement Summary

The project has achieved **84.9% completion** (146 hours completed out of 172 total project hours). All core AAP deliverables have been successfully implemented:

- The **primary deliverable CONTRACTS.md** is complete — a 2,734-line standalone API contract document covering 36 endpoints across 20 screen categories
- All **20 UI components** specified in the AAP are implemented with Slack-faithful styling (8,549 lines)
- All **17 new API route handlers** and **3 updated routes** are operational with full CRUD support
- The **database schema** expanded from 3 to 16 tables with comprehensive seed data
- **120 out of 120 tests pass** (93 contract + 27 screenshot tests) with zero compilation or lint errors
- **27 post-implementation screenshots** captured at 1440×900 viewport
- The monolithic 248-line `page.tsx` was successfully decomposed into a modular component architecture

### Remaining Gaps

The 26 remaining hours (15.1%) are concentrated in two areas:
1. **Visual verification** (7h, High priority) — Screenshot comparison utility and pixel-level fidelity verification against reference images
2. **Production infrastructure** (19h, Medium/Low priority) — Docker, CI/CD, security hardening, database migration strategy, monitoring, and performance testing

### Critical Path to Production

1. **Immediate (7h):** Build screenshot comparison utility and perform visual fidelity audit against reference screenshots
2. **Short-term (9h):** Create environment template, Docker configuration, and CI/CD pipeline
3. **Pre-launch (10h):** Security hardening, database migration strategy, monitoring, and performance testing

### Production Readiness Assessment

The application is **development-ready** and **demo-ready** — all screens render correctly, all APIs return valid data, and the test suite provides comprehensive coverage. For production deployment, the remaining infrastructure items (Docker, CI/CD, monitoring, rate limiting) must be addressed.

---

## 9. Development Guide

### System Prerequisites

| Requirement | Version | Verification Command |
|-------------|---------|---------------------|
| Node.js | 20+ | `node --version` |
| npm | 9+ | `npm --version` |
| PostgreSQL | 16+ | `psql --version` |
| Git | 2.x+ | `git --version` |

### Environment Setup

#### 1. Clone and Install

```bash
git clone <repository-url>
cd slack-nextjs-app
npm install
```

#### 2. Install Playwright Browsers

```bash
npx playwright install chromium
```

#### 3. Configure Database Connection

Create a `.env.local` file in the project root:

```bash
echo 'DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/slack_app' > .env.local
```

Replace `YOUR_PASSWORD` with your PostgreSQL password. If using local peer authentication:

```bash
echo 'DATABASE_URL=postgresql://postgres@localhost:5432/slack_app' > .env.local
```

#### 4. Initialize the Database

Create the database and run the initialization script:

```bash
createdb -U postgres slack_app
psql -U postgres -d slack_app -f init-db.sql
```

This creates 16 tables (users, channels, messages, threads, reactions, pins, direct_messages, dm_members, dm_messages, files, channel_members, user_statuses, workspace, user_preferences, saved_items, mentions) and seeds demo data including 4 users, 5 channels, 12 messages, DM conversations, reactions, pins, files, and more.

#### 5. Verify Database

```bash
psql -U postgres -d slack_app -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"
```

Expected output: 16 tables listed alphabetically from `channel_members` to `workspace`.

### Application Startup

#### Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the app redirects to the default channel view (`/channel/1`).

#### Verify Application

```bash
# Check server is running
curl -sI http://localhost:3000 | head -5

# Verify API endpoints
curl -s http://localhost:3000/api/channels | python3 -m json.tool | head -20
curl -s http://localhost:3000/api/users | python3 -m json.tool | head -20
curl -s http://localhost:3000/api/workspace | python3 -m json.tool
```

### Running Tests

#### All Tests (120 total)

```bash
DATABASE_URL="postgresql://postgres@localhost:5432/slack_app" npx playwright test
```

#### Contract Tests Only (93 tests)

```bash
DATABASE_URL="postgresql://postgres@localhost:5432/slack_app" npx playwright test tests/contracts.spec.ts
```

#### Screenshot Capture Only (27 tests)

```bash
DATABASE_URL="postgresql://postgres@localhost:5432/slack_app" npx playwright test tests/screenshots.spec.ts
```

Screenshots are saved to `screenshots/output/`.

### Build and Static Analysis

```bash
# TypeScript compilation check
npx tsc --noEmit

# ESLint
npx eslint --no-fix .

# Production build
npm run build
```

### Troubleshooting

| Issue | Resolution |
|-------|-----------|
| `ECONNREFUSED` on database connection | Ensure PostgreSQL is running: `pg_isready` |
| Empty API responses | Run `psql -U postgres -d slack_app -f init-db.sql` to re-seed data |
| Port 3000 already in use | Kill existing process: `lsof -ti:3000 \| xargs kill` |
| Playwright browser missing | Run `npx playwright install chromium` |
| TypeScript errors after changes | Run `npx tsc --noEmit` to identify issues |
| Tests fail with 500 errors | Check DATABASE_URL env var is set correctly |

---

## 10. Appendices

### A. Command Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Next.js development server with Turbopack |
| `npm run build` | Create production build (35 routes) |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test:screenshots` | Run Playwright screenshot capture tests |
| `npx playwright test` | Run all Playwright tests (contracts + screenshots) |
| `npx tsc --noEmit` | TypeScript type-check without emitting files |
| `psql -U postgres -d slack_app -f init-db.sql` | Initialize/reset database with schema and seed data |

### B. Port Reference

| Service | Port | Protocol |
|---------|------|----------|
| Next.js Dev Server | 3000 | HTTP |
| PostgreSQL | 5432 | TCP |

### C. Key File Locations

| File | Purpose |
|------|---------|
| `CONTRACTS.md` | Primary deliverable — API contract documentation |
| `init-db.sql` | Database schema (16 tables) and seed data |
| `src/lib/types.ts` | Shared TypeScript interfaces (15+ types) |
| `src/lib/mock-data.ts` | Centralized mock data objects (16 exports) |
| `src/lib/validation.ts` | Input validation utilities |
| `src/lib/db.ts` | PostgreSQL connection pool and query helper |
| `src/app/providers.tsx` | WorkspaceProvider React context |
| `src/app/(workspace)/layout.tsx` | Shared workspace layout with persistent sidebar |
| `src/app/components/` | 20 reusable UI components |
| `src/app/api/` | 20 API route handler files (17 new + 3 updated) |
| `playwright.config.ts` | Playwright test configuration |
| `tests/contracts.spec.ts` | 93 API contract validation tests |
| `tests/screenshots.spec.ts` | 27 screenshot capture tests |
| `screenshots/output/` | Captured post-implementation screenshots |
| `next.config.ts` | Next.js configuration with security headers |

### D. Technology Versions

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.2.1 | Full-stack React framework (App Router) |
| React | 19.2.4 | UI component library |
| TypeScript | 5.9.3 | Type-safe JavaScript |
| PostgreSQL | 16+ | Relational database |
| Node.js | 20.20.1 | JavaScript runtime |
| Tailwind CSS | 4.x | Utility-first CSS framework |
| Playwright | 1.58.2 | End-to-end testing and screenshot capture |
| pg | 8.20.0 | PostgreSQL client driver |
| ESLint | 9.x | Code linting |

### E. Environment Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `postgresql://postgres@localhost:5432/slack` | PostgreSQL connection string |
| `PORT` | No | `3000` | Next.js server port |
| `NODE_ENV` | No | `development` | Node.js environment |
| `CI` | No | — | Set to `true` in CI/CD environments |

### F. Developer Tools Guide

| Tool | Command | Notes |
|------|---------|-------|
| TypeScript Check | `npx tsc --noEmit --pretty` | Run before committing — must produce 0 errors |
| ESLint | `npx eslint --no-fix .` | Never use `--fix` to avoid unintended changes |
| Playwright UI | `npx playwright test --ui` | Interactive test runner for debugging |
| Playwright Debug | `npx playwright test --debug` | Step-through test execution |
| DB Console | `psql -U postgres -d slack_app` | Interactive PostgreSQL shell |
| Build Analysis | `npm run build` | Check route generation and bundle sizes |

### G. Glossary

| Term | Definition |
|------|-----------|
| AAP | Agent Action Plan — the specification document defining all project requirements |
| App Router | Next.js routing paradigm using the `app/` directory with file-based routing |
| Route Group | Next.js `(workspace)` parenthesized folder — organizes routes without adding URL segments |
| CONTRACTS.md | Primary deliverable — API contract documentation for all 20 screen categories |
| Mock Data | Pre-seeded PostgreSQL data matching Slack-like content for all screens |
| Screen Category | One of 20 distinct Slack UI views (channel, DM, thread, search, etc.) |
| Workspace Provider | React context providing shared state (users, channels, workspace) to all pages |
| Polling | 3-second interval fetch for near-real-time message updates (no WebSocket) |