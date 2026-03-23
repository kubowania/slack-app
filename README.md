# Slack Clone

A Slack-like messaging app built with Next.js and PostgreSQL.

## Features

- **Channels** — create and switch between channels
- **Real-time messaging** — send messages with 3-second polling
- **Multiple users** — switch between demo users via the sidebar
- **Persistent storage** — all messages stored in PostgreSQL

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
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/slack_app
```

### 4. Initialize the Database

This creates the tables and seeds demo data (3 users, 3 channels, sample messages):

```bash
psql -U postgres -d slack_app -f init-db.sql
```

### 5. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start chatting.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── users/route.ts               # GET/POST users
│   │   └── channels/
│   │       ├── route.ts                 # GET/POST channels
│   │       └── [id]/messages/route.ts   # GET/POST messages per channel
│   ├── layout.tsx                       # Root layout
│   └── page.tsx                         # Slack-like chat UI
└── lib/
    └── db.ts                            # PostgreSQL connection pool
```
