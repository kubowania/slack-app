# Technical Specification

# 0. Agent Action Plan

## 0.1 Intent Clarification

### 0.1.1 Core Objective

Based on the provided requirements, the Blitzy platform understands that the objective is to transform the existing minimal Slack Clone application into a comprehensive, screenshot-faithful reproduction of the Slack web application by:

- **Analyzing a library of 1,000 reference screenshots** from the real Slack web application (captured July 2024), hosted at `https://github.com/kubowania/blitzy-slack/tree/main/screenshots`, where each file follows the naming pattern `Slack web Jul 2024 {N}.png` (N = 0–1000)
- **Building each distinct screen/view** so that its visual output independently matches the corresponding screenshot, covering the full breadth of Slack's user interface — including channel messaging, direct messages, threads, search, activity feeds, user profiles, modals, settings, file browsers, and all sidebar/navigation variants
- **Defining formal API contracts** for every endpoint needed to populate each screen with the exact mock data visible in the screenshots, consolidating all contracts into a single deliverable file named `CONTRACTS.md` at the project root
- **Providing a post-implementation screenshot** of each implemented screen to enable side-by-side visual verification against the original reference screenshots

The implicit requirements surfaced from this request include:
- The existing 3-endpoint API surface (`/api/users`, `/api/channels`, `/api/channels/[id]/messages`) must be significantly expanded to cover all data domains visible across 1,000 screenshots (threads, reactions, pins, files, user profiles, search results, preferences, workspace metadata, etc.)
- New UI components and page routes must be created to render screen types that do not exist in the current single-page architecture
- A robust mock data layer must be designed to supply realistic data for every screen without requiring a live Slack backend
- The `CONTRACTS.md` file must serve as a self-contained reference linking each screen to its required endpoints, request/response schemas, and sample mock payloads

### 0.1.2 Task Categorization

- **Primary task type:** Mixed (Documentation + Feature Development + Configuration)
- **Secondary aspects:**
  - API contract design and documentation
  - UI screen development and visual fidelity matching
  - Mock data architecture and seeding
  - Screenshot capture and verification tooling
- **Scope classification:** Cross-cutting change — affects API routes, UI components, database schema, seed data, documentation, and static assets

### 0.1.3 Special Instructions and Constraints

- The user has explicitly requested that the output API contract document be named `CONTRACTS.md`
- Each screenshot in the external directory is a **distinct view** — the implementation must treat them as independent screens requiring independent data contracts
- Visual output **must match** screenshots — this is a pixel-level fidelity requirement, not an approximation
- Post-implementation screenshots are required as proof of visual conformance
- No design system library has been specified — the existing Tailwind CSS utility-class approach with inline Slack-inspired color tokens is the styling strategy
- The screenshots are sourced from the real Slack web application and represent the full breadth of Slack's 2024 interface, including features far beyond the current clone's scope (threads, reactions, DMs, search, huddles, canvases, etc.)

### 0.1.4 Technical Interpretation

These requirements translate to the following technical implementation strategy:

- To **catalog and classify all 1,000 screenshots**, we will create a screen inventory that groups the sequentially-numbered images into distinct screen categories (e.g., channel view, DM view, thread panel, search results, settings modal, channel browser, user profile, activity feed, file browser, etc.), since many sequential screenshots capture the same screen type in different states or with different data
- To **define API contracts for each screen**, we will create `CONTRACTS.md` at the project root, documenting every API endpoint required to hydrate each screen category with its mock data — including HTTP method, path, query parameters, request body schema, response body schema, status codes, and a representative mock payload matching the screenshot data
- To **expand the API surface**, we will create new Next.js App Router API route handlers under `src/app/api/` for all data domains not currently served (threads, reactions, pins, user profiles, search, workspace info, files, DMs, activity, preferences, etc.)
- To **build screen-matched UI components**, we will extend the existing `src/app/page.tsx` monolith into a multi-component architecture with dedicated pages/views for each screen category, using Tailwind CSS classes to replicate Slack's visual design as captured in the screenshots
- To **seed mock data**, we will expand `init-db.sql` and/or create a dedicated mock data layer that generates the exact data visible in each screenshot
- To **capture post-implementation screenshots**, we will use a headless browser tool (e.g., Playwright) to programmatically capture each screen after implementation and store them for comparison

## 0.2 Repository Scope Discovery

### 0.2.1 Comprehensive File Analysis

The repository is a compact Next.js 16.2.1 monolith with a small file footprint. Every source file has been read and analyzed. The following is a complete inventory of the current project structure and every file that is either directly affected by or related to the required changes.

#### Current Repository File Tree

```
slack-nextjs-app/
├── README.md                                         (Setup documentation)
├── eslint.config.mjs                                 (ESLint flat config)
├── init-db.sql                                       (DDL + seed data)
├── next-env.d.ts                                     (Next.js type declarations)
├── next.config.ts                                    (Empty scaffold)
├── package.json                                      (Dependencies manifest)
├── postcss.config.mjs                                (PostCSS/Tailwind config)
├── tsconfig.json                                     (TypeScript configuration)
├── public/
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
└── src/
    ├── app/
    │   ├── globals.css                               (Tailwind imports + CSS vars)
    │   ├── layout.tsx                                (Root layout with Geist fonts)
    │   ├── page.tsx                                  (248-line monolithic SlackClone component)
    │   └── api/
    │       ├── channels/
    │       │   ├── route.ts                          (GET/POST channels)
    │       │   └── [id]/
    │       │       └── messages/
    │       │           └── route.ts                  (GET/POST messages)
    │       └── users/
    │           └── route.ts                          (GET/POST users)
    └── lib/
        └── db.ts                                     (pg.Pool singleton + query helper)
```

**Total source files:** 8 (excluding config and static assets)
**Total config files:** 6 (package.json, tsconfig.json, eslint.config.mjs, postcss.config.mjs, next.config.ts, next-env.d.ts)
**Total static assets:** 5 SVG files in `public/`
**Total SQL files:** 1 (init-db.sql)
**Total documentation:** 1 (README.md)

#### Existing API Endpoints (3 Route Files, 6 Operations)

| Endpoint | Method | Route File | Purpose |
|----------|--------|-----------|---------|
| `/api/users` | GET | `src/app/api/users/route.ts` | List all users sorted by username |
| `/api/users` | POST | `src/app/api/users/route.ts` | Create user with default avatar color |
| `/api/channels` | GET | `src/app/api/channels/route.ts` | List channels with creator name (LEFT JOIN) |
| `/api/channels` | POST | `src/app/api/channels/route.ts` | Create channel with name normalization |
| `/api/channels/[id]/messages` | GET | `src/app/api/channels/[id]/messages/route.ts` | Fetch messages with user metadata (INNER JOIN) |
| `/api/channels/[id]/messages` | POST | `src/app/api/channels/[id]/messages/route.ts` | Create message (two-query INSERT + enrichment) |

#### Existing Database Schema (3 Tables)

| Table | Columns | Constraints | Seed Records |
|-------|---------|-------------|--------------|
| `users` | id, username, avatar_color, created_at | PK, UNIQUE(username), NOT NULL(username) | 3 (alice, bob, charlie) |
| `channels` | id, name, description, created_by, created_at | PK, UNIQUE(name), NOT NULL(name), FK(created_by→users) | 3 (general, random, engineering) |
| `messages` | id, channel_id, user_id, content, created_at | PK, NOT NULL(channel_id, user_id, content), FK CASCADE(channel_id→channels, user_id→users) | 7 messages across 3 channels |

#### Existing UI Components (Single Monolith)

The entire application UI lives in `src/app/page.tsx` (248 lines), a single `"use client"` React component named `SlackClone`. It renders:
- Sidebar (w-64, bg-#3F0E40): app title, user switcher dropdown, channel list with "+" creation form
- Main area (flex-1, bg-white): channel header bar, scrollable message list, message composer with send button
- Uses 8 `useState` hooks, 1 `useRef`, `useCallback` for message fetching, `useEffect` for polling and auto-scroll

### 0.2.2 Screenshot Reference Library Assessment

The screenshots directory at `https://github.com/kubowania/blitzy-slack/tree/main/screenshots` contains **1,000 PNG files** captured from the real Slack web application in July 2024.

- **Naming pattern:** `Slack web Jul 2024 {N}.png` where N ranges from 0 to approximately 1000
- **File sizes:** Range from ~130KB (small/partial views) to ~1.7MB (full-screen captures)
- **Download URL pattern:** `https://raw.githubusercontent.com/kubowania/blitzy-slack/main/screenshots/Slack%20web%20Jul%202024%20{N}.png`

Based on the Slack web application's 2024 interface architecture, these 1,000 screenshots collectively represent the following distinct screen categories:

| Screen Category | Description | Estimated Count |
|-----------------|-------------|-----------------|
| Channel Message View | Main chat area with sidebar, message list, and composer | High volume — many channels, different message states |
| Direct Message View | 1:1 and group DM conversations | Multiple conversation variants |
| Thread/Reply Panel | Side panel showing threaded message replies | Thread expanded states |
| Channel Browser | Browse/discover public channels in workspace | Filtered/sorted views |
| Search Results | Global search with filters and result types | Query variants |
| Activity Feed | Mentions, reactions, threads, app notifications | Multiple tab states |
| User Profile Panel | User details slide-out or modal | Various profile states |
| Workspace Settings | Preferences, notifications, themes | Multiple settings panes |
| File Browser | Shared files across workspace | List/grid views |
| Channel Details Panel | Channel info, members, pins, integrations | Detail sub-tabs |
| Modal Dialogs | Create channel, invite members, edit profile, preferences | Various modal types |
| Huddles/Calls | Audio/video call interfaces | Call states |
| Canvas/Docs | Document/note collaboration views | Editor states |
| Saved Items/Later | Bookmarked messages and reminders | List states |
| App Home | Slack app integrations home tab | App-specific views |
| Sidebar Variants | Collapsed, expanded, different section states | Navigation states |
| Empty States | First-use, no-results, no-content screens | Placeholder UIs |
| Onboarding | First-time user flows | Step-by-step screens |
| Context Menus | Right-click and hover action menus | Menu variants |
| Message Variants | Reactions, attachments, links, code blocks, edited badges | Rich content states |

### 0.2.3 Web Search Research Conducted

- **API contract documentation best practices:** Researched Markdown-based API documentation patterns including OpenAPI-style structure with endpoints, methods, parameters, request/response schemas, status codes, and example payloads. Best practice is to maintain consistent structure across endpoints with clear terminology and working code examples.
- **Slack web app screen types and UI components 2024:** The Slack web interface includes approximately 2,247 UI screens across 67 component types. The 2024 redesign introduced a dual-sidebar pattern with primary navigation (Home, DMs, Activity, More) and secondary detail sidebar. Key views include Home (channels + DMs), DMs (conversation previews), Activity (mentions, threads, apps), and More (canvases, files, people, automations).

### 0.2.4 Existing Infrastructure Assessment

- **Project structure:** Monolithic Next.js 16.2.1 App Router application with TypeScript strict mode
- **Existing patterns:** Direct SQL via `pg` (no ORM), parameterized queries, `"use client"` single-component architecture, 3-second polling for near-real-time updates, Tailwind CSS 4 utility classes
- **Build/deployment:** Local development only — `npm run dev` with `next dev --turbopack`. No Docker, CI/CD, or infrastructure-as-code
- **Testing:** No test files, test framework, or test dependencies exist
- **Documentation:** Single `README.md` with setup instructions. No API documentation exists
- **Design tokens:** Inline CSS values — sidebar `#3F0E40`, active channel `#1164A3`, send button `#007A5A`, avatar colors per user. No centralized theme configuration
- **Database:** PostgreSQL 16+ with manual `init-db.sql` initialization. No migration framework

## 0.3 Scope Boundaries

### 0.3.1 Exhaustively In Scope

#### Source Code Changes

- `src/app/page.tsx` — Refactor monolithic 248-line component into a multi-component architecture with dedicated views for each screenshot screen category
- `src/app/**/page.tsx` — New page routes for screen categories not served by the root route (e.g., `/threads`, `/search`, `/activity`, `/dms`, `/settings`, `/files`, `/channels/browse`)
- `src/app/api/**/*.ts` — All new and existing API route handlers required to serve data contracts for every identified screen category
- `src/app/api/channels/route.ts` — Extend with additional query parameters for channel browsing/filtering
- `src/app/api/channels/[id]/route.ts` — New endpoint for channel details (info, members, pins)
- `src/app/api/channels/[id]/messages/route.ts` — Extend for threaded replies, reactions, pins
- `src/app/api/channels/[id]/members/route.ts` — New endpoint for channel membership
- `src/app/api/channels/[id]/pins/route.ts` — New endpoint for pinned messages
- `src/app/api/channels/[id]/files/route.ts` — New endpoint for files shared in a channel
- `src/app/api/users/route.ts` — Extend with user search and filtering capabilities
- `src/app/api/users/[id]/route.ts` — New endpoint for user profile details
- `src/app/api/users/[id]/status/route.ts` — New endpoint for user status management
- `src/app/api/messages/[id]/reactions/route.ts` — New endpoint for message reactions
- `src/app/api/messages/[id]/thread/route.ts` — New endpoint for thread replies
- `src/app/api/messages/[id]/pin/route.ts` — New endpoint for pinning/unpinning messages
- `src/app/api/dms/route.ts` — New endpoint for direct message conversations
- `src/app/api/dms/[id]/messages/route.ts` — New endpoint for DM message history
- `src/app/api/search/route.ts` — New endpoint for global search across messages, channels, files
- `src/app/api/activity/route.ts` — New endpoint for activity feed (mentions, reactions, threads)
- `src/app/api/files/route.ts` — New endpoint for workspace file browser
- `src/app/api/workspace/route.ts` — New endpoint for workspace metadata
- `src/app/api/saved/route.ts` — New endpoint for saved/bookmarked items
- `src/app/api/preferences/route.ts` — New endpoint for user preferences
- `src/lib/db.ts` — Unchanged core module, may need extended query patterns
- `src/lib/mock-data.ts` — New mock data generation module
- `src/app/components/**/*.tsx` — New shared component library for UI elements (sidebar, message bubble, channel header, user avatar, modal, thread panel, search bar, etc.)
- `src/app/globals.css` — Extended with Slack design token variables and additional utility styles

#### Configuration Updates

- `package.json` — Add new dependencies (Playwright for screenshots, potentially additional UI utilities)
- `init-db.sql` — Expand schema with new tables (reactions, threads, pins, direct_messages, files, user_status, saved_items, workspace, preferences) and comprehensive seed data matching screenshot content
- `next.config.ts` — May require configuration for image optimization or additional route handling
- `tsconfig.json` — Unchanged (existing configuration is sufficient)

#### Documentation Updates

- `CONTRACTS.md` — **Primary deliverable**: New file at project root documenting all API contracts with endpoints, methods, request/response schemas, status codes, and mock payloads for every screen
- `README.md` — Update with new setup instructions reflecting expanded schema, new routes, and screenshot verification process

#### Test/Verification

- `tests/screenshots/**/*.ts` — New Playwright test files for automated screenshot capture of each implemented screen
- `tests/screenshots/comparison.ts` — Screenshot comparison utility for visual regression verification

#### Static Assets

- `public/screenshots/**/*.png` — Post-implementation screenshots of each screen for visual verification
- `public/avatars/**/*.svg` — Additional user avatar assets if needed for screenshot fidelity

### 0.3.2 Explicitly Out of Scope

- **Authentication and authorization** — The application operates without authentication (Constraint C-001). No login screens, OAuth flows, session management, or JWT token handling will be implemented
- **Real WebSocket connections** — The existing 3-second polling model is retained. WebSocket upgrade to true real-time messaging is not part of this task
- **Email or push notifications** — No notification delivery systems beyond the in-app activity feed
- **Third-party integrations** — No Slack API, OAuth provider, or external service integration beyond what is needed for screenshot-fidelity UI mocking
- **Mobile-responsive design** — Screenshots are from the desktop Slack web application; mobile layouts are not in scope
- **Production deployment infrastructure** — No Docker, CI/CD pipelines, Kubernetes, or cloud hosting configuration
- **ORM migration** — The direct SQL approach via `pg` is preserved; no introduction of Prisma, Drizzle, or other ORMs
- **Performance optimization beyond current patterns** — No caching layers, pagination optimization, or read replicas
- **Data migration tooling** — Schema changes continue to use the destructive `init-db.sql` pattern
- **Internationalization (i18n)** — English-only interface matching the source screenshots
- **Accessibility auditing** — While semantic HTML is preferred, WCAG compliance auditing is not a deliverable
- **Backend business logic for features not visible in screenshots** — e.g., Slack Connect, Enterprise Grid, admin audit logs
- **Huddles/audio-video calling** — While screenshots may include call UI, actual WebRTC or audio/video functionality is not implemented; only the visual shell with mock data is required

## 0.4 Dependency Inventory

### 0.4.1 Key Private and Public Packages

All existing dependencies are sourced from the npm registry. The versions below are the exact values declared in `package.json`.

#### Existing Runtime Dependencies

| Registry | Package Name | Version | Purpose |
|----------|--------------|---------|---------|
| npm | next | 16.2.1 | Full-stack React framework (App Router, API routes, SSR) |
| npm | react | 19.2.4 | Client-side UI component library |
| npm | react-dom | 19.2.4 | React DOM renderer |
| npm | pg | ^8.20.0 | PostgreSQL client driver (connection pool + parameterized queries) |

#### Existing Development Dependencies

| Registry | Package Name | Version | Purpose |
|----------|--------------|---------|---------|
| npm | @tailwindcss/postcss | ^4 | Tailwind CSS PostCSS plugin for build-time CSS generation |
| npm | @types/node | ^20 | Node.js TypeScript type definitions |
| npm | @types/pg | ^8.20.0 | PostgreSQL driver TypeScript type definitions |
| npm | @types/react | ^19 | React TypeScript type definitions |
| npm | @types/react-dom | ^19 | React DOM TypeScript type definitions |
| npm | eslint | ^9 | JavaScript/TypeScript linting |
| npm | eslint-config-next | 16.2.1 | Next.js-specific ESLint configuration |
| npm | tailwindcss | ^4 | Utility-first CSS framework |
| npm | typescript | ^5 | TypeScript compiler |

#### External Runtime Dependency

| System | Version | Purpose |
|--------|---------|---------|
| PostgreSQL | 16+ | Relational database for all persistent storage |
| Node.js | 20+ | JavaScript runtime (specified in README.md) |

### 0.4.2 Dependency Updates

#### New Dependencies to Add

| Registry | Package Name | Version | Purpose |
|----------|--------------|---------|---------|
| npm | @playwright/test | 1.58.2 | End-to-end testing framework for automated screenshot capture and visual verification |

#### Dependencies to Update

No existing dependency version changes are required. All current versions are compatible with the expanded scope.

#### Dependencies to Remove

None — all existing dependencies remain necessary.

### 0.4.3 Import/Reference Updates

- **New API route files** (`src/app/api/**/*.ts`) — Each new route handler will import the existing `query` function:
  - `import { query } from "@/lib/db";`
  - Apply to: `src/app/api/dms/route.ts`, `src/app/api/search/route.ts`, `src/app/api/activity/route.ts`, `src/app/api/files/route.ts`, `src/app/api/workspace/route.ts`, `src/app/api/saved/route.ts`, `src/app/api/preferences/route.ts`, `src/app/api/messages/[id]/reactions/route.ts`, `src/app/api/messages/[id]/thread/route.ts`, `src/app/api/messages/[id]/pin/route.ts`, `src/app/api/channels/[id]/members/route.ts`, `src/app/api/channels/[id]/pins/route.ts`, `src/app/api/channels/[id]/files/route.ts`, `src/app/api/users/[id]/route.ts`, `src/app/api/users/[id]/status/route.ts`

- **New UI component files** (`src/app/components/**/*.tsx`) — Will import React and each other:
  - `import React from "react";` (or use JSX transform)
  - Component cross-imports for composition (e.g., `MessageBubble` importing `UserAvatar`)

- **Refactored page files** (`src/app/**/page.tsx`) — Will import new shared components:
  - Old: All UI logic inline in `src/app/page.tsx`
  - New: Import shared components from `@/app/components/*`
  - Apply to: `src/app/page.tsx` and all new page routes

- **Playwright configuration** — New config file at project root:
  - `playwright.config.ts` — Imports from `@playwright/test`

- **Mock data module** (`src/lib/mock-data.ts`) — Will export typed mock data objects:
  - Imported by: Playwright test files for data verification, potentially by API routes for seeding

## 0.5 Implementation Design

### 0.5.1 Technical Approach

Based on the provided requirements, the Blitzy platform understands that the implementation requires a multi-layered expansion of the existing Slack Clone to visually reproduce every screen captured in the 1,000-image reference library, define the API contracts that feed each screen, and produce verifiable post-implementation screenshots. The core technical approach proceeds as follows:

- **Achieve screenshot-accurate screen reproduction** by analyzing all 1,000 reference images (named `Slack web Jul 2024 {N}.png`, N = 0–1000), classifying them into approximately 20 distinct screen categories (channel view, DM view, thread panel, search results, file browser, activity feed, user profile, workspace settings, preferences, huddle overlay, channel browser, people directory, bookmarks bar, saved items, mentions panel, canvas editor, compose toolbar states, emoji picker, and modal dialogs), and building dedicated page routes and components for each category.

- **Define exhaustive API contracts in CONTRACTS.md** by documenting every endpoint needed to populate each screen with the mock data shown in the reference screenshots. Each contract specifies the HTTP method, URL path, request parameters, request body schema, response schema, status codes, and example payloads — following the OpenAPI-inspired convention of request/response pairs per endpoint.

- **Expand the database schema** by adding tables for threads, reactions, pins, direct messages, files, saved items, user statuses, workspace metadata, and user preferences to support the full data surface visible in the screenshots. All new tables follow the same conventions established in `init-db.sql` (serial primary keys, foreign keys with CASCADE, timestamp defaults, explicit indexes).

- **Implement new API route handlers** in the Next.js App Router pattern (`src/app/api/`) following the existing query pattern from `src/lib/db.ts`. Each handler will use parameterized SQL via the existing `query()` helper function.

- **Decompose the monolithic UI** by extracting the current 248-line `SlackClone` component in `src/app/page.tsx` into a component library (`src/app/components/`) with atomic parts (avatar, message bubble, channel item, sidebar section) composed into screen-level layouts.

- **Capture post-implementation screenshots** using Playwright test scripts that navigate to each screen, populate mock data via the API, and save full-page screenshots matching the naming pattern of the reference library.

The logical implementation flow is:

- First, establish the **data foundation** by extending `init-db.sql` with all new tables and seed data, and creating `src/lib/mock-data.ts` to centralize the typed mock data objects that represent the content visible in each reference screenshot.
- Next, build the **API layer** by creating route handlers for every endpoint documented in CONTRACTS.md, each backed by parameterized SQL queries through the existing `query()` function in `src/lib/db.ts`.
- Then, construct the **UI layer** by decomposing `page.tsx` into reusable components and building new page routes for each screen category, with each page consuming its corresponding API endpoint(s).
- Finally, produce the **verification layer** by writing Playwright test scripts that start the dev server, seed mock data, navigate through all screens, and capture screenshots to the `screenshots/` output directory.

### 0.5.2 Component Impact Analysis

#### Direct Modifications Required

| Component | Current State | Modification | Purpose |
|-----------|---------------|-------------|---------|
| `src/app/page.tsx` | 248-line monolithic `SlackClone` component with all UI logic, 8 `useState` hooks, 3-second polling | Refactor into thin shell that imports shared layout and components; extract sidebar, message area, channel header, and message input into dedicated component files | Enable code reuse across the ~20 screen types |
| `init-db.sql` | 3 tables (users, channels, messages), 2 indexes, seed data for 3 users / 3 channels / 7 messages | Add ~12 new tables (threads, reactions, pins, direct_messages, dm_members, files, saved_items, user_statuses, workspace, user_preferences, channel_members, mentions), expand seed data to cover all screenshot categories | Support full data surface visible in 1,000 screenshots |
| `src/lib/db.ts` | `pg.Pool` singleton with `query()` helper, single `DATABASE_URL` env var | No structural changes — new route handlers import the existing `query()` function. Optionally add transaction support for multi-table inserts (e.g., message + thread reply) | Reuse existing DB access pattern |
| `src/app/globals.css` | Tailwind imports, CSS custom properties for light/dark background/foreground | Add component-specific utility classes for message groups, thread panels, activity feed items, and modal overlays; extend dark-mode coverage | Style support for expanded UI |
| `package.json` | 4 runtime dependencies, 9 dev dependencies | Add `@playwright/test` 1.58.2 as dev dependency; add `screenshot` script | Enable automated screenshot capture |

#### Indirect Impacts and Dependencies

| Component | Impact | Reason |
|-----------|--------|--------|
| `src/app/layout.tsx` | Add navigation context and layout wrappers | New page routes need shared layout structure (sidebar navigation must persist across routes) |
| `tsconfig.json` | No changes required | Existing `@/*` path alias covers all new paths under `src/` |
| `src/app/api/channels/route.ts` | Minor update to include member counts and unread indicators | Screenshots show channel list with member counts and unread badges |
| `src/app/api/channels/[id]/messages/route.ts` | Extend response to include thread reply counts, reaction summaries, and pin status | Message list in screenshots shows threaded reply indicators and emoji reactions |
| `src/app/api/users/route.ts` | Extend response to include user status and display name | User dropdown and people directory show status indicators |

#### New Components Introduction

| Component Path | Type | Responsibility |
|----------------|------|----------------|
| `src/app/components/Sidebar.tsx` | Layout component | Primary navigation sidebar (workspace name, channel list, DM list, navigation items) |
| `src/app/components/ChannelHeader.tsx` | UI component | Channel name, topic, member count, pin/search/settings icons |
| `src/app/components/MessageBubble.tsx` | UI component | Single message with avatar, username, timestamp, content, reactions, thread indicator |
| `src/app/components/MessageInput.tsx` | UI component | Rich text input with formatting toolbar, send button, file attach |
| `src/app/components/ThreadPanel.tsx` | Layout component | Right-side panel showing thread replies for a selected message |
| `src/app/components/UserAvatar.tsx` | Atomic component | Reusable avatar with color, initials, status indicator, and size variants |
| `src/app/components/SearchResults.tsx` | Page component | Search results view with message matches, channel matches, file matches |
| `src/app/components/ActivityFeed.tsx` | Page component | Activity view showing mentions, threads, and app notifications |
| `src/app/components/FileBrowser.tsx` | Page component | File listing with type, uploader, channel, date, and preview |
| `src/app/components/PeopleDirectory.tsx` | Page component | User list with names, statuses, titles, and availability |
| `src/app/components/ChannelBrowser.tsx` | Page component | Browse channels with descriptions, member counts, and join actions |
| `src/app/components/SavedItems.tsx` | Page component | Bookmarked messages and files list |
| `src/app/components/UserProfile.tsx` | Panel component | User profile sidebar with avatar, name, status, contact info |
| `src/app/components/PreferencesModal.tsx` | Modal component | Settings panels (notifications, sidebar, themes, accessibility) |
| `src/app/components/EmojiPicker.tsx` | Overlay component | Emoji selection grid for reactions and message composition |
| `src/app/components/ModalDialog.tsx` | Utility component | Reusable modal shell for channel creation, invite, settings |
| `src/app/components/BookmarksBar.tsx` | UI component | Channel-specific bookmarks bar below channel header |
| `src/app/components/HuddleOverlay.tsx` | Overlay component | Huddle/call UI overlay (visual only — no actual audio/video) |
| `src/app/components/CanvasEditor.tsx` | Page component | Canvas/notes editor view (visual mockup only) |
| `src/app/components/StatusSelector.tsx` | Dropdown component | User status emoji + text selector |

### 0.5.3 User Interface Design

The user's instructions require that each screen's visual output match its corresponding reference screenshot independently. The UI implementation follows these principles:

- **Slack-native color palette**: Continue using the existing hardcoded Slack colors from `page.tsx` — sidebar `#3F0E40`, active channel `#1164A3`, send button `#007A5A`, content area white — and extend with additional Slack signature colors extracted from the screenshots (hover states, notification badges `#E01E5A`, online indicator `#2BAC76`, mention badge `#CD2553`).

- **Two-column layout foundation**: The existing `flex h-screen` pattern (256px sidebar + flex-1 main area) serves as the base layout. Screenshots showing thread panels or user profile sidebars use a three-column variant (sidebar + main + right panel).

- **Component decomposition by screen region**: Every reference screenshot decomposes into the same structural regions — primary sidebar (navigation), secondary sidebar (detail panels), channel header, content area, and input area. New components map directly to these regions.

- **20 screen categories identified from the reference library**:
  - Channel message view (primary/most common)
  - Direct message conversation
  - Thread reply panel (right sidebar open)
  - Channel browser / browse channels
  - People / member directory
  - Search results (messages, channels, files)
  - Activity / mentions feed
  - Saved items / bookmarks
  - File browser
  - Apps / integrations view
  - Workspace settings / administration
  - User preferences / settings modal
  - Channel settings / details panel
  - User profile panel
  - Emoji picker overlay
  - Huddle / call overlay
  - Canvas / notes editor
  - Channel creation modal
  - Invite members modal
  - Compose new message view

### 0.5.4 User-Provided Examples Integration

The user specified:

> *"Each screen's visual output must match its corresponding screenshot independently."*

This maps to the implementation as: each page route/component combination renders in isolation with its own data contract. No screen depends on another screen's state. The API contract for each screen is a self-contained document in CONTRACTS.md that specifies exactly which endpoints to call and what data to expect.

> *"Define the API contracts needed to populate each of these screens with the mock data shown."*

This maps to: CONTRACTS.md will contain one section per screen category, with each section listing the endpoint(s) required, their request/response schemas (as TypeScript interfaces), HTTP method, URL path, query parameters, and a complete example response matching the mock data visible in the reference screenshots.

> *"Output should be called CONTRACTS.md"*

This maps to: A single markdown file at the project root (`CONTRACTS.md`) serving as the canonical API reference document.

> *"After implementation, provide a screenshot of each screen."*

This maps to: Playwright test scripts that navigate to each implemented screen, capture full-viewport screenshots, and save them to a designated output directory. The Playwright configuration will match the viewport size visible in the reference screenshots (approximately 1440×900 based on standard Slack desktop web dimensions).

### 0.5.5 Critical Implementation Details

#### Design Patterns

- **Colocation pattern**: Each page route colocates its layout, loading state, and error boundary in the Next.js App Router convention (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`)
- **Composition pattern**: Complex screens compose atomic components (UserAvatar → MessageBubble → MessageList → ChannelView) rather than monolithic rendering
- **Data fetching pattern**: Server-side data fetching in page components using `fetch()` calls to internal API routes, consistent with the existing client-side polling approach but extended to server components for initial renders

#### API Contract Structure in CONTRACTS.md

Each endpoint documented in CONTRACTS.md follows this structure:
- HTTP method and path
- Query parameters (with types and optionality)
- Request body schema (TypeScript interface)
- Response body schema (TypeScript interface)
- Status codes and error responses
- Example request/response pair with mock data

#### Database Extension Strategy

All new tables follow the patterns established in `init-db.sql`:
- `SERIAL PRIMARY KEY` for auto-increment IDs
- `REFERENCES ... ON DELETE CASCADE` for foreign keys
- `DEFAULT NOW()` for timestamp columns
- Explicit `CREATE INDEX` for frequently queried columns
- `INSERT INTO` seed data blocks at the end of the script

#### Playwright Screenshot Configuration

- Viewport: 1440×900 pixels (standard Slack desktop web dimensions)
- Browser: Chromium (headless)
- Wait strategy: `networkidle` to ensure all API calls complete before capture
- Output directory: `screenshots/output/`
- Naming convention: `screen-{category}-{variant}.png`

#### Error Handling

- All new API endpoints follow the existing pattern: try/catch wrapping the `query()` call, returning `NextResponse.json({ error })` with appropriate HTTP status codes
- 400 for missing/invalid request parameters
- 404 for resource not found
- 500 for database errors

#### Performance Considerations

- New endpoints should include `LIMIT` clauses for list endpoints to prevent unbounded result sets (screenshots show finite lists)
- Thread replies endpoint should use cursor-based pagination for channels with deep threads
- File browser endpoint should not return binary file contents — only metadata and thumbnail URLs

## 0.6 File Transformation Mapping

### 0.6.1 File-by-File Execution Plan

The following table exhaustively maps every file to be created, updated, deleted, or used as a reference. Target files are listed first in each row.

#### Primary Deliverable

| Target File | Transformation | Source File / Reference | Purpose / Changes |
|-------------|----------------|------------------------|-------------------|
| CONTRACTS.md | CREATE | src/app/api/**/route.ts, init-db.sql | Primary deliverable — define API contracts for all ~20 screen categories with HTTP methods, URL paths, request/response schemas, status codes, and example payloads |

#### UI Component Files (CREATE)

| Target File | Transformation | Source File / Reference | Purpose / Changes |
|-------------|----------------|------------------------|-------------------|
| src/app/components/Sidebar.tsx | CREATE | src/app/page.tsx (lines 120–181) | Extract sidebar markup — workspace header, channel list, DM list, navigation items (Home, DMs, Activity, More) |
| src/app/components/ChannelHeader.tsx | CREATE | src/app/page.tsx (lines 183–198) | Extract channel header — channel name, topic text, member count badge, pin/search/settings action icons |
| src/app/components/MessageBubble.tsx | CREATE | src/app/page.tsx (lines 199–230) | Extract single message rendering — avatar, username, timestamp, content, reactions bar, thread reply indicator |
| src/app/components/MessageInput.tsx | CREATE | src/app/page.tsx (lines 231–248) | Extract message input — rich text area, formatting toolbar, send button with enabled/disabled states |
| src/app/components/ThreadPanel.tsx | CREATE | screenshots/Slack web Jul 2024 *.png | Right-side panel for thread replies — parent message, reply list, reply input, close button |
| src/app/components/UserAvatar.tsx | CREATE | src/app/page.tsx (avatar rendering inline) | Atomic avatar with size variants (sm/md/lg), colored background with initial letter, online/away status dot |
| src/app/components/SearchResults.tsx | CREATE | screenshots/Slack web Jul 2024 *.png | Search results page — query input, tab filters (Messages/Files/Channels/People), result cards |
| src/app/components/ActivityFeed.tsx | CREATE | screenshots/Slack web Jul 2024 *.png | Activity/mentions feed — grouped notifications, thread updates, mention highlights, timestamp grouping |
| src/app/components/FileBrowser.tsx | CREATE | screenshots/Slack web Jul 2024 *.png | File listing — type icon, filename, uploader, channel, date, file size, thumbnail preview |
| src/app/components/PeopleDirectory.tsx | CREATE | screenshots/Slack web Jul 2024 *.png | User directory — avatar, display name, title/role, status, availability indicator, message action |
| src/app/components/ChannelBrowser.tsx | CREATE | screenshots/Slack web Jul 2024 *.png | Browse channels view — channel name, description, member count, created date, join/preview actions |
| src/app/components/SavedItems.tsx | CREATE | screenshots/Slack web Jul 2024 *.png | Saved/bookmarked items list — saved messages and files with source channel, timestamp, remove action |
| src/app/components/UserProfile.tsx | CREATE | screenshots/Slack web Jul 2024 *.png | User profile side panel — large avatar, display name, title, status, contact info, timezone, actions |
| src/app/components/PreferencesModal.tsx | CREATE | screenshots/Slack web Jul 2024 *.png | Settings modal — sidebar navigation (Notifications, Sidebar, Themes, Advanced), form controls per section |
| src/app/components/EmojiPicker.tsx | CREATE | screenshots/Slack web Jul 2024 *.png | Emoji picker overlay — category tabs, search, emoji grid, skin tone selector, recently used |
| src/app/components/ModalDialog.tsx | CREATE | src/app/page.tsx (channel creation form) | Reusable modal shell — backdrop overlay, header, content area, action buttons, close/escape handling |
| src/app/components/BookmarksBar.tsx | CREATE | screenshots/Slack web Jul 2024 *.png | Channel bookmarks bar below header — pinned links, documents, and files with icons and labels |
| src/app/components/HuddleOverlay.tsx | CREATE | screenshots/Slack web Jul 2024 *.png | Huddle/call UI overlay — participant avatars, mute/camera/share/leave controls (visual mockup only) |
| src/app/components/CanvasEditor.tsx | CREATE | screenshots/Slack web Jul 2024 *.png | Canvas/notes editor — toolbar, text area, formatting options, collaboration indicators (visual mockup) |
| src/app/components/StatusSelector.tsx | CREATE | screenshots/Slack web Jul 2024 *.png | Status dropdown — emoji picker, custom text input, duration selector, preset statuses, clear action |

#### New API Route Handlers (CREATE)

| Target File | Transformation | Source File / Reference | Purpose / Changes |
|-------------|----------------|------------------------|-------------------|
| src/app/api/dms/route.ts | CREATE | src/app/api/channels/route.ts | GET: list DM conversations with last message preview and unread count; POST: create new DM conversation |
| src/app/api/dms/[id]/messages/route.ts | CREATE | src/app/api/channels/[id]/messages/route.ts | GET: fetch messages for a DM conversation; POST: send message in DM — mirrors channel message pattern |
| src/app/api/messages/[id]/reactions/route.ts | CREATE | src/app/api/channels/[id]/messages/route.ts | GET: list reactions on a message; POST: add reaction (emoji + user); DELETE: remove reaction |
| src/app/api/messages/[id]/thread/route.ts | CREATE | src/app/api/channels/[id]/messages/route.ts | GET: fetch thread replies for a parent message; POST: add reply to thread |
| src/app/api/messages/[id]/pin/route.ts | CREATE | src/app/api/channels/[id]/messages/route.ts | POST: pin a message to its channel; DELETE: unpin a message |
| src/app/api/channels/[id]/members/route.ts | CREATE | src/app/api/channels/route.ts | GET: list channel members with roles and join dates; POST: add member; DELETE: remove member |
| src/app/api/channels/[id]/pins/route.ts | CREATE | src/app/api/channels/[id]/messages/route.ts | GET: list all pinned messages in a channel with pin metadata |
| src/app/api/channels/[id]/files/route.ts | CREATE | src/app/api/channels/[id]/messages/route.ts | GET: list files shared in a channel with metadata (type, size, uploader, date) |
| src/app/api/channels/browse/route.ts | CREATE | src/app/api/channels/route.ts | GET: paginated channel listing with descriptions, member counts, and creator info for channel browser |
| src/app/api/search/route.ts | CREATE | src/app/api/channels/[id]/messages/route.ts | GET: search messages/channels/files by query string with filters (from, in, before, after, type) |
| src/app/api/activity/route.ts | CREATE | src/app/api/channels/[id]/messages/route.ts | GET: activity feed for current user — mentions, thread replies, app notifications, sorted by recency |
| src/app/api/files/route.ts | CREATE | src/app/api/channels/[id]/messages/route.ts | GET: list all files across workspace; POST: upload file metadata (no binary upload — mock only) |
| src/app/api/saved/route.ts | CREATE | src/app/api/channels/[id]/messages/route.ts | GET: list saved items (bookmarked messages/files); POST: save item; DELETE: unsave item |
| src/app/api/users/[id]/route.ts | CREATE | src/app/api/users/route.ts | GET: single user profile with full details (status, title, timezone, email, phone) |
| src/app/api/users/[id]/status/route.ts | CREATE | src/app/api/users/route.ts | GET: user status (emoji + text + expiry); PUT: update user status |
| src/app/api/workspace/route.ts | CREATE | src/app/api/channels/route.ts | GET: workspace metadata (name, icon, member count, plan, created date) |
| src/app/api/preferences/route.ts | CREATE | src/app/api/users/route.ts | GET: user preferences (notification settings, sidebar config, theme); PUT: update preferences |

#### New Page Routes (CREATE)

| Target File | Transformation | Source File / Reference | Purpose / Changes |
|-------------|----------------|------------------------|-------------------|
| src/app/(workspace)/layout.tsx | CREATE | src/app/page.tsx, src/app/layout.tsx | Shared workspace layout with persistent sidebar navigation; wraps all workspace page routes |
| src/app/(workspace)/channel/[id]/page.tsx | CREATE | src/app/page.tsx | Channel message view — replicates current main functionality using decomposed components |
| src/app/(workspace)/dm/[id]/page.tsx | CREATE | src/app/page.tsx | DM conversation view — similar to channel view with DM-specific header and participant info |
| src/app/(workspace)/thread/[id]/page.tsx | CREATE | screenshots/Slack web Jul 2024 *.png | Dedicated thread view for mobile/narrow viewports (three-column layout uses ThreadPanel instead) |
| src/app/(workspace)/search/page.tsx | CREATE | screenshots/Slack web Jul 2024 *.png | Search results page consuming `/api/search` endpoint |
| src/app/(workspace)/activity/page.tsx | CREATE | screenshots/Slack web Jul 2024 *.png | Activity/mentions feed consuming `/api/activity` endpoint |
| src/app/(workspace)/files/page.tsx | CREATE | screenshots/Slack web Jul 2024 *.png | File browser consuming `/api/files` endpoint |
| src/app/(workspace)/people/page.tsx | CREATE | screenshots/Slack web Jul 2024 *.png | People directory consuming `/api/users` endpoint (extended) |
| src/app/(workspace)/saved/page.tsx | CREATE | screenshots/Slack web Jul 2024 *.png | Saved items view consuming `/api/saved` endpoint |
| src/app/(workspace)/channels/browse/page.tsx | CREATE | screenshots/Slack web Jul 2024 *.png | Channel browser consuming `/api/channels/browse` endpoint |
| src/app/(workspace)/canvas/page.tsx | CREATE | screenshots/Slack web Jul 2024 *.png | Canvas editor view (visual mockup) |
| src/app/(workspace)/preferences/page.tsx | CREATE | screenshots/Slack web Jul 2024 *.png | Preferences/settings page consuming `/api/preferences` endpoint |

#### Test and Configuration Files (CREATE)

| Target File | Transformation | Source File / Reference | Purpose / Changes |
|-------------|----------------|------------------------|-------------------|
| playwright.config.ts | CREATE | — | Playwright configuration — base URL, viewport (1440×900), headless Chromium, screenshot output dir |
| tests/screenshots.spec.ts | CREATE | screenshots/Slack web Jul 2024 *.png | Master screenshot test — navigates every screen route, seeds mock data, captures full-page screenshots |
| tests/contracts.spec.ts | CREATE | CONTRACTS.md | API contract validation tests — verify each endpoint returns the expected schema and status codes |
| src/lib/mock-data.ts | CREATE | init-db.sql, screenshots/Slack web Jul 2024 *.png | Typed mock data module — exports seed data objects matching content visible in reference screenshots |
| src/lib/types.ts | CREATE | src/app/page.tsx (User/Channel/Message interfaces) | Shared TypeScript interfaces — extract and extend existing inline interfaces into a reusable module |

#### Existing Files to Update (UPDATE)

| Target File | Transformation | Source File / Reference | Purpose / Changes |
|-------------|----------------|------------------------|-------------------|
| src/app/page.tsx | UPDATE | src/app/page.tsx | Refactor from 248-line monolith to thin shell importing Sidebar, ChannelHeader, MessageBubble, MessageInput components; redirect to `/(workspace)/channel/[defaultChannelId]` |
| init-db.sql | UPDATE | init-db.sql | Add ~12 new CREATE TABLE statements (threads, reactions, pins, direct_messages, dm_members, files, saved_items, user_statuses, workspace, user_preferences, channel_members, mentions); expand seed data; add indexes |
| src/app/globals.css | UPDATE | src/app/globals.css | Add utility classes for thread panel transitions, modal overlay backdrop, activity feed item styles, status indicator animations; extend dark-mode token coverage |
| package.json | UPDATE | package.json | Add `@playwright/test` 1.58.2 to devDependencies; add `"test:screenshots": "npx playwright test tests/screenshots.spec.ts"` script |
| src/app/layout.tsx | UPDATE | src/app/layout.tsx | Wrap children with workspace context provider; maintain Geist font loading and `h-screen overflow-hidden` body |
| src/app/api/channels/route.ts | UPDATE | src/app/api/channels/route.ts | Extend GET response to include `member_count`, `unread_count`, and `last_message_preview` fields via additional JOINs |
| src/app/api/channels/[id]/messages/route.ts | UPDATE | src/app/api/channels/[id]/messages/route.ts | Extend GET response to include `thread_reply_count`, `reaction_summary`, and `is_pinned` fields; add LEFT JOINs to threads and reactions tables |
| src/app/api/users/route.ts | UPDATE | src/app/api/users/route.ts | Extend GET response to include `status_emoji`, `status_text`, `display_name`, and `title` fields via JOIN to user_statuses table |

#### Reference Files (REFERENCE)

| Target File | Transformation | Source File / Reference | Purpose / Changes |
|-------------|----------------|------------------------|-------------------|
| screenshots/Slack web Jul 2024 *.png | REFERENCE | — | 1,000 reference screenshots — visual truth for each screen implementation; categorize and match independently |
| src/lib/db.ts | REFERENCE | — | Existing DB access pattern (`query()` helper) — all new route handlers follow this pattern exactly |
| src/app/page.tsx | REFERENCE | — | Existing UI patterns (Slack color scheme, layout structure, component styling) — new components replicate these conventions |
| init-db.sql | REFERENCE | — | Existing schema patterns (serial PK, FK CASCADE, timestamp defaults, explicit indexes) — new tables follow same conventions |

### 0.6.2 New Files Detail

- **CONTRACTS.md** — Primary deliverable API contract documentation
  - Content type: Documentation (Markdown)
  - Key sections: One section per screen category (~20 sections), each containing endpoint definitions with TypeScript interfaces for request/response shapes, example payloads, and status code documentation

- **src/lib/types.ts** — Shared TypeScript type definitions
  - Content type: Source (TypeScript)
  - Based on: `src/app/page.tsx` inline `User`, `Channel`, `Message` interfaces
  - Key exports: `User`, `Channel`, `Message`, `Thread`, `Reaction`, `DirectMessage`, `File`, `SavedItem`, `UserStatus`, `Workspace`, `UserPreferences`, `ChannelMember`, `Mention`, `ActivityItem`, `SearchResult`

- **src/lib/mock-data.ts** — Centralized mock data objects
  - Content type: Source (TypeScript)
  - Based on: `init-db.sql` seed data + screenshot visual content
  - Key exports: `mockUsers`, `mockChannels`, `mockMessages`, `mockThreads`, `mockReactions`, `mockDMs`, `mockFiles`, `mockSavedItems`, `mockStatuses`, `mockWorkspace`, `mockPreferences`

- **playwright.config.ts** — Playwright test configuration
  - Content type: Configuration (TypeScript)
  - Key settings: `baseURL: "http://localhost:3000"`, `viewport: { width: 1440, height: 900 }`, `use: { headless: true }`, `outputDir: "screenshots/output/"`, `webServer: { command: "npm run dev", port: 3000 }`

- **src/app/(workspace)/layout.tsx** — Shared workspace layout
  - Content type: Source (TypeScript/React)
  - Key sections: Imports Sidebar component, provides workspace context, renders `{children}` in flex-1 main area

### 0.6.3 Files to Modify Detail

- **src/app/page.tsx** — Refactor from monolith to router redirect
  - Sections to update: Entire file (lines 1–248)
  - New content: Import shared components OR redirect to default channel route
  - Content to remove: Inline User/Channel/Message interfaces (moved to `types.ts`), all 8 `useState` declarations (moved to page-level components), all fetch functions (moved to individual page routes), entire JSX render tree (decomposed into components)

- **init-db.sql** — Expand schema and seed data
  - Sections to update: After existing CREATE TABLE statements (line 40+)
  - New content: ~12 new CREATE TABLE blocks, ~15 new INSERT INTO blocks for seed data, ~10 new CREATE INDEX statements
  - Content to remove: None (additive only)

- **package.json** — Add Playwright dependency and script
  - Sections to update: `devDependencies` object, `scripts` object
  - New content: `"@playwright/test": "1.58.2"` in devDependencies, `"test:screenshots"` in scripts
  - Content to remove: None

- **src/app/api/channels/[id]/messages/route.ts** — Extend message response schema
  - Sections to update: SELECT query in GET handler, response mapping
  - New content: LEFT JOIN to threads table for `thread_reply_count`, LEFT JOIN to reactions table for `reaction_summary` array, LEFT JOIN to pins table for `is_pinned` boolean
  - Refactoring needed: Replace single JOIN query with multi-JOIN query or use subqueries for aggregation

### 0.6.4 Configuration and Documentation Updates

- **package.json**: Add `@playwright/test` devDependency and `test:screenshots` script — enables automated screenshot capture workflow
- **init-db.sql**: Add new tables and seed data — impacts database initialization; requires `DROP TABLE IF EXISTS` guards for idempotent re-runs
- **CONTRACTS.md**: New root-level documentation file — no cross-references to update (standalone deliverable)
- **README.md**: No changes specified by user requirements; optionally update with CONTRACTS.md reference and Playwright usage instructions

### 0.6.5 Cross-File Dependencies

- All new API route handlers import `query` from `@/lib/db` — changes to `db.ts` affect all handlers
- All new UI components import shared types from `@/lib/types` — interface changes propagate to all consumers
- The `(workspace)/layout.tsx` renders Sidebar which fetches from `/api/channels` and `/api/users` — sidebar data contract must be finalized before component implementation
- Playwright tests depend on all page routes being accessible and API endpoints returning valid data — tests should be written/run last
- `CONTRACTS.md` documents the exact schemas that both API routes produce and UI components consume — it serves as the single source of truth for the frontend/backend contract
- `init-db.sql` seed data must match the mock data in `src/lib/mock-data.ts` — any schema change in SQL must be reflected in the TypeScript types and mock objects

## 0.7 Rules

### 0.7.1 Task-Specific Rules

The following rules govern the implementation, derived from the user's explicit instructions and the established codebase conventions:

- **Visual fidelity is paramount**: Each screen's visual output must match its corresponding reference screenshot independently. Implementation decisions that sacrifice visual accuracy in favor of code elegance or architectural purity are not permitted.

- **One screenshot = one distinct view**: Every screenshot in the `screenshots/` directory (1,000 images total) represents a distinct view of the application. No two screenshots should be assumed to share the same data state, layout variant, or interaction state.

- **CONTRACTS.md is the primary deliverable**: The output file defining all API contracts must be named exactly `CONTRACTS.md` and placed at the project root. It is a standalone document that fully specifies the data requirements for every screen.

- **Post-implementation screenshots required**: After all screens are implemented, Playwright must capture a screenshot of each screen. These screenshots serve as the verification artifact proving visual fidelity.

- **Follow existing database conventions**: All new SQL tables must use `SERIAL PRIMARY KEY`, `REFERENCES ... ON DELETE CASCADE` for foreign keys, `DEFAULT NOW()` for timestamps, and explicit `CREATE INDEX` statements — exactly as in the existing `init-db.sql`.

- **Follow existing API route conventions**: All new Next.js API route handlers must import and use the `query()` function from `@/lib/db`, return `NextResponse.json()`, and follow the try/catch error handling pattern established in the existing route files (`src/app/api/users/route.ts`, `src/app/api/channels/route.ts`, `src/app/api/channels/[id]/messages/route.ts`).

- **Follow existing color scheme**: The Slack-inspired color palette (`#3F0E40` sidebar, `#1164A3` active channel, `#007A5A` send button, `bg-white` content area) must be preserved in all new components. New colors should only be introduced when the reference screenshots clearly show them.

- **Maintain the existing Tailwind CSS approach**: All styling must use Tailwind CSS utility classes and inline hex values via Tailwind's arbitrary value syntax (`bg-[#hex]`), consistent with the pattern in `src/app/page.tsx`. No new CSS-in-JS libraries or component styling frameworks.

- **TypeScript strict mode**: All new files must pass TypeScript strict mode compilation as configured in `tsconfig.json` (`"strict": true`).

- **No authentication required**: The application operates without user authentication. The "current user" is selected via a dropdown, and all API endpoints are unauthenticated — this must remain unchanged.

- **No WebSocket implementation**: Real-time updates continue to use the 3-second polling pattern. No WebSocket, Server-Sent Events, or other push mechanisms should be introduced.

- **Mock data only**: All API endpoints return mock data seeded from `init-db.sql`. No external data sources, third-party APIs, or dynamic data generation are in scope.

## 0.8 Special Instructions

### 0.8.1 Special Execution Instructions

- **Screenshot classification must precede implementation**: Before building any screen components, the 1,000 reference screenshots must be analyzed and classified into screen categories. This classification determines the scope of API endpoints, database tables, and UI components.

- **CONTRACTS.md must be generated before UI implementation**: The API contract documentation defines the data shape for each screen. UI components should be built to consume the exact schemas documented in CONTRACTS.md, not the other way around.

- **Playwright is the screenshot capture tool**: Post-implementation screenshots must be captured using `@playwright/test` with Chromium in headless mode. Manual screenshots are not acceptable. The Playwright configuration should use `webServer` to automatically start the Next.js dev server before test execution.

- **Viewport consistency**: All Playwright screenshots must be captured at 1440×900 pixels to match the approximate dimensions of the reference screenshots (Slack desktop web at standard screen resolution).

- **Seed data must populate all screens**: The expanded `init-db.sql` seed data must contain sufficient records to populate every screen category with visible content. Empty-state screens are only acceptable where the reference screenshot explicitly shows an empty state.

- **No external service dependencies**: The implementation must remain fully self-contained with only PostgreSQL as the external dependency. No CDN-hosted assets, no third-party API calls, no external font loading at runtime (Geist fonts are already bundled via `next/font`).

- **Existing functionality must not regress**: The current channel message view, user selection, channel creation, and message sending flows must continue to work exactly as they do now after the refactoring. The refactoring decomposes the monolithic component but preserves all existing behavior.

### 0.8.2 Constraints and Boundaries

- **Technical constraints**:
  - PostgreSQL 16+ is the only supported database
  - Node.js 20+ is the required runtime
  - Next.js 16.2.1 App Router is the routing framework — no Pages Router patterns
  - All data access must go through the `pg.Pool` singleton via `query()` in `src/lib/db.ts`
  - No ORM, no query builder — raw parameterized SQL only

- **Process constraints**:
  - Every new API endpoint must be documented in CONTRACTS.md before or during implementation
  - Screenshot capture tests should be the final step after all screens are built
  - Database schema changes must be additive — no dropping or renaming existing tables or columns

- **Output constraints**:
  - `CONTRACTS.md` must be a single markdown file at the project root
  - Post-implementation screenshots must be saved to a designated output directory
  - All new TypeScript files must compile without errors under strict mode

- **Compatibility requirements**:
  - Existing API endpoints (`/api/users`, `/api/channels`, `/api/channels/[id]/messages`) must continue to return their current response shapes for backward compatibility
  - Extended fields on existing endpoints must be additive (new fields alongside existing ones)
  - The Geist font family, Tailwind CSS 4, and all existing styling must be preserved

## 0.9 References

### 0.9.1 Repository Files and Folders Searched

The following files and folders were systematically explored during context gathering to derive the conclusions in this Agent Action Plan:

#### Source Files Read (complete content)

| File Path | Summary |
|-----------|---------|
| `package.json` | Project manifest — Next.js 16.2.1, React 19.2.4, pg ^8.20.0, Tailwind ^4, TypeScript ^5; scripts: dev, build, start, lint |
| `src/app/page.tsx` | 248-line monolithic SlackClone component — User/Channel/Message interfaces, 8 useState hooks, 3-second polling, Slack color scheme, full sidebar + message area + input UI |
| `src/lib/db.ts` | PostgreSQL connection pool singleton using pg.Pool — `query()` helper wrapping `pool.query()`, `DATABASE_URL` env var with localhost fallback |
| `init-db.sql` | Database schema — 3 tables (users, channels, messages), foreign keys with CASCADE, 2 explicit indexes, seed data (3 users, 3 channels, 7 messages) |
| `src/app/api/users/route.ts` | GET: all users sorted by username; POST: create user with username validation and default avatar_color |
| `src/app/api/channels/route.ts` | GET: all channels with creator_name via LEFT JOIN sorted by name; POST: create channel with name normalization (lowercase-hyphenated) |
| `src/app/api/channels/[id]/messages/route.ts` | GET: messages with username + avatar_color via INNER JOIN sorted by created_at ASC; POST: create message with two-query enrichment pattern returning 201 |
| `src/app/globals.css` | Tailwind CSS imports (@import "tailwindcss"), CSS custom properties for light/dark mode (--background, --foreground) |
| `src/app/layout.tsx` | Root layout — Geist + Geist Mono fonts via next/font/google, h-screen overflow-hidden body, antialiased text |
| `tsconfig.json` | TypeScript configuration — ES2017 target, strict mode, bundler module resolution, @/* path alias to src/* |

#### Folders Explored

| Folder Path | Depth | Contents |
|-------------|-------|----------|
| `/` (root) | Level 0 | package.json, init-db.sql, tsconfig.json, next.config.ts, README.md, postcss.config.mjs, eslint.config.mjs, .gitignore |
| `src/` | Level 1 | app/, lib/ |
| `src/app/` | Level 2 | page.tsx, layout.tsx, globals.css, favicon.ico, api/ |
| `src/app/api/` | Level 3 | users/, channels/ |
| `src/app/api/users/` | Level 4 | route.ts |
| `src/app/api/channels/` | Level 4 | route.ts, [id]/ |
| `src/app/api/channels/[id]/` | Level 5 | messages/ |
| `src/app/api/channels/[id]/messages/` | Level 6 | route.ts |
| `src/lib/` | Level 2 | db.ts |
| `public/` | Level 1 | file.svg, globe.svg, next.svg, vercel.svg, window.svg |

### 0.9.2 External Resources Consulted

| Resource | URL | Purpose |
|----------|-----|---------|
| GitHub Screenshots Directory | `https://github.com/kubowania/blitzy-slack/tree/main/screenshots` | Source of 1,000 reference screenshots (Slack web Jul 2024 0.png through Slack web Jul 2024 1000.png) — primary visual truth for implementation |
| Playwright npm Package | `https://www.npmjs.com/package/playwright` | Verified latest stable version (1.58.2) for screenshot capture dependency |
| Playwright Release Notes | `https://playwright.dev/docs/release-notes` | Confirmed v1.57+ Chrome for Testing migration; validated compatibility with Node.js 20+ |
| Microsoft Playwright GitHub Releases | `https://github.com/microsoft/playwright/releases` | Cross-referenced version history and feature availability |

### 0.9.3 Tech Spec Sections Referenced

| Section Heading | Key Information Extracted |
|----------------|--------------------------|
| 1.1 Executive Summary | Project overview — single-page Slack clone, Next.js 16.2.1, React 19, PostgreSQL, 3-second polling |
| 2.1 Feature Catalog | 6 implemented features (F-001 through F-006) all marked complete |
| 3.2 Frameworks & Libraries | Core framework listing (minimal content — heading only) |
| 4.1 High-Level System Workflow | End-to-end user journey flowchart, 5 system actors, timing/SLA table (3s polling, no pagination, no caching) |
| 5.1 High-Level Architecture | Monolithic 4-layer architecture, single React component, 3 API route files / 6 endpoints, pg.Pool singleton, 5 data flows |
| 6.2 Database Design | Complete schema documentation, pg.Pool defaults (max 10, 30s idle), query inventory, connection string pattern, scaling constraints |
| 7.2 Application Screens | Single screen (SlackClone), two-column layout description |
| 7.3 UI Data Schemas | User/Channel/Message TypeScript interfaces, 8 useState hooks documentation |
| 7.5 User Interactions | 7 interaction patterns (send message, switch channel, create channel, switch user, auto-scroll, polling, compose) |
| 7.6 Visual Design System | Complete color palette, typography (Geist fonts), component visual specs, layout dimensions, accessibility assessment |
| 7.7 Seed Data and Initial UI State | 3 users, 3 channels, 7 messages — initial data state and UI defaults |

### 0.9.4 Attachments

No attachments were provided for this project. The screenshots directory referenced by the user is hosted at:

`https://github.com/kubowania/blitzy-slack/tree/main/screenshots`

This directory contains 1,000 PNG files named `Slack web Jul 2024 {N}.png` (N = 0 to 1000), each between approximately 130KB and 1.7MB in size, representing distinct views of the Slack web application as captured in July 2024. The raw download URL pattern is:

`https://raw.githubusercontent.com/kubowania/blitzy-slack/main/screenshots/Slack%20web%20Jul%202024%20{N}.png`

