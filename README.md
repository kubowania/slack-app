# Slack Clone

A comprehensive Slack-like messaging application built with Next.js and PostgreSQL, featuring channels, direct messages, threads, reactions, search, activity feeds, file sharing, and more.

## Features

- **Channels** — create, browse, and switch between channels with member management
- **Direct Messages** — 1:1 and group DM conversations
- **Threads** — reply to messages in threaded conversations
- **Reactions** — add emoji reactions to messages
- **Search** — global search across messages, channels, files, and users
- **Activity Feed** — mentions, thread replies, and notifications
- **File Sharing** — upload and browse files across the workspace
- **Saved Items** — bookmark messages and files for later
- **User Profiles** — display names, titles, statuses, and contact info
- **Preferences** — notification, sidebar, and theme settings
- **Real-time messaging** — send messages with 3-second polling
- **Multiple users** — switch between demo users via the sidebar
- **Persistent storage** — all data stored in PostgreSQL

## API Documentation

See **[CONTRACTS.md](./CONTRACTS.md)** for the complete API contract documentation covering all 36 endpoints across 20 screen categories, including request/response schemas, status codes, and example payloads.

## Setup

### 1. Prerequisites

- Node.js 20+
- PostgreSQL 16+

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Database

Edit `.env.local` with your PostgreSQL credentials:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/slack
```

### 4. Initialize the Database

This creates all tables (users, channels, messages, threads, reactions, pins, DMs, files, and more) and seeds demo data:

```bash
psql -U postgres -d slack -f init-db.sql
```

### 5. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start chatting.

## Project Structure

```
├── CONTRACTS.md                              # API contract documentation (36 endpoints)
├── init-db.sql                               # Database schema + seed data (16 tables)
├── package.json                              # Dependencies and scripts
├── playwright.config.ts                      # Playwright screenshot test config
├── src/
│   ├── app/
│   │   ├── (workspace)/                      # Workspace-scoped page routes
│   │   │   ├── layout.tsx                    # Shared workspace layout with sidebar
│   │   │   ├── activity/page.tsx             # Activity / mentions feed
│   │   │   ├── canvas/page.tsx               # Canvas / notes editor
│   │   │   ├── channel/[id]/page.tsx         # Channel message view
│   │   │   ├── channels/browse/page.tsx      # Channel browser
│   │   │   ├── dm/[id]/page.tsx              # DM conversation view
│   │   │   ├── dm/page.tsx                   # DM list view
│   │   │   ├── files/page.tsx                # File browser
│   │   │   ├── people/page.tsx               # People / member directory
│   │   │   ├── preferences/page.tsx          # User preferences
│   │   │   ├── saved/page.tsx                # Saved items / bookmarks
│   │   │   ├── search/page.tsx               # Search results
│   │   │   └── thread/[id]/page.tsx          # Thread view
│   │   ├── api/
│   │   │   ├── activity/route.ts             # GET activity feed
│   │   │   ├── channels/
│   │   │   │   ├── route.ts                  # GET/POST channels
│   │   │   │   ├── browse/route.ts           # GET channel browser
│   │   │   │   └── [id]/
│   │   │   │       ├── files/route.ts        # GET channel files
│   │   │   │       ├── members/route.ts      # GET/POST/DELETE channel members
│   │   │   │       ├── messages/route.ts     # GET/POST channel messages
│   │   │   │       └── pins/route.ts         # GET channel pins
│   │   │   ├── dms/
│   │   │   │   ├── route.ts                  # GET/POST direct messages
│   │   │   │   └── [id]/messages/route.ts    # GET/POST DM messages
│   │   │   ├── files/route.ts                # GET/POST files
│   │   │   ├── messages/[id]/
│   │   │   │   ├── pin/route.ts              # POST/DELETE message pins
│   │   │   │   ├── reactions/route.ts        # GET/POST/DELETE reactions
│   │   │   │   └── thread/route.ts           # GET/POST thread replies
│   │   │   ├── preferences/route.ts          # GET/PUT user preferences
│   │   │   ├── saved/route.ts                # GET/POST/DELETE saved items
│   │   │   ├── search/route.ts               # GET search
│   │   │   ├── users/
│   │   │   │   ├── route.ts                  # GET/POST users
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts              # GET user profile
│   │   │   │       └── status/route.ts       # GET/PUT user status
│   │   │   └── workspace/route.ts            # GET workspace info
│   │   ├── components/                       # Shared UI components (20 components)
│   │   │   ├── Sidebar.tsx                   # Navigation sidebar
│   │   │   ├── ChannelHeader.tsx             # Channel header bar
│   │   │   ├── MessageBubble.tsx             # Message rendering
│   │   │   ├── MessageInput.tsx              # Message composer
│   │   │   ├── ThreadPanel.tsx               # Thread reply panel
│   │   │   ├── UserAvatar.tsx                # Avatar component
│   │   │   ├── SearchResults.tsx             # Search results display
│   │   │   ├── ActivityFeed.tsx              # Activity feed display
│   │   │   ├── FileBrowser.tsx               # File listing
│   │   │   ├── PeopleDirectory.tsx           # User directory
│   │   │   ├── ChannelBrowser.tsx            # Channel discovery
│   │   │   ├── SavedItems.tsx                # Saved items list
│   │   │   ├── UserProfile.tsx               # User profile panel
│   │   │   ├── PreferencesModal.tsx          # Settings modal
│   │   │   ├── EmojiPicker.tsx               # Emoji picker overlay
│   │   │   ├── ModalDialog.tsx               # Reusable modal shell
│   │   │   ├── BookmarksBar.tsx              # Channel bookmarks
│   │   │   ├── HuddleOverlay.tsx             # Huddle UI overlay
│   │   │   ├── CanvasEditor.tsx              # Canvas editor view
│   │   │   └── StatusSelector.tsx            # User status selector
│   │   ├── globals.css                       # Tailwind imports + CSS variables
│   │   ├── layout.tsx                        # Root layout with Geist fonts
│   │   ├── page.tsx                          # Root page (redirects to workspace)
│   │   └── providers.tsx                     # Client-side providers
│   └── lib/
│       ├── db.ts                             # PostgreSQL connection pool
│       ├── mock-data.ts                      # Typed mock data objects
│       ├── types.ts                          # Shared TypeScript interfaces
│       └── validation.ts                     # Input validation utilities
└── tests/
    ├── screenshots.spec.ts                   # Playwright screenshot tests
    └── contracts.spec.ts                     # API contract validation tests
```
