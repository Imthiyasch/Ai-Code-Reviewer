# CodeLens AI — AI Code Review Tool

A production-grade web application where users paste code or provide a GitHub repo URL, and Claude AI acts as a senior developer: finding bugs, suggesting improvements, scoring quality, and auto-generating documentation.

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite 5 |
| Auth | Google OAuth 2.0 + JWT |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| AI | Anthropic Claude (claude-sonnet-4-20250514) |
| Syntax Highlighting | react-syntax-highlighter (Prism) |
| Charts | Recharts |
| State | Zustand |

## Quick Start

### 1. Clone and configure environment

```bash
cp .env.example .env
# Fill in your credentials (see below)
```

### 2. Required Environment Variables

Edit `.env` in the project root and add:

```
VITE_GOOGLE_CLIENT_ID=   # From Google Cloud Console
GOOGLE_CLIENT_ID=         # Same as above
GOOGLE_CLIENT_SECRET=     # From Google Cloud Console
JWT_SECRET=               # Any long random string (64+ chars)
DATABASE_URL=             # postgresql://user:pass@host:5432/dbname
ANTHROPIC_API_KEY=        # sk-ant-...
VITE_APP_URL=http://localhost:5173
```

### 3. Set up the database

Run the schema against your PostgreSQL database:

```bash
psql $DATABASE_URL -f server/db/schema.sql
```

Or the server auto-runs migrations on startup via `runMigrations()`.

### 4. Install dependencies

```bash
# Server
cd server && npm install

# Client
cd client && npm install
```

### 5. Copy .env to server directory

```bash
cp .env server/.env
```

Also add to `client/.env`:
```
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_API_URL=http://localhost:3001
```

### 6. Run development servers

**Terminal 1 — Server:**
```bash
cd server
npm run dev
# Runs on http://localhost:3001
```

**Terminal 2 — Client:**
```bash
cd client
npm run dev
# Runs on http://localhost:5173
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable **Google+ API** / **Google Identity**
4. Go to **Credentials** → Create **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized JavaScript origins: `http://localhost:5173`
7. Authorized redirect URIs: `http://localhost:5173`
8. Copy Client ID and Client Secret into `.env`

## Set Admin Role

After first login, set yourself as admin via SQL:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

## Project Structure

```
├── client/                  # React + Vite frontend
│   └── src/
│       ├── components/      # UI + feature components
│       ├── pages/           # Route-level pages
│       ├── hooks/           # Custom hooks
│       ├── lib/             # API client, utilities
│       └── store/           # Zustand auth + theme stores
│
├── server/                  # Node.js + Express API
│   └── src/
│       ├── routes/          # auth, reviews, admin
│       ├── middleware/      # jwt, admin guard, rate limiter
│       ├── services/        # llm, github, export
│       └── db/              # schema.sql + pg client
│
└── .env.example
```

## Deployment (Vercel + Supabase/Neon)

### Database
1. Create a free [Supabase](https://supabase.com) or [Neon](https://neon.tech) PostgreSQL database
2. Copy the connection string to `DATABASE_URL`

### Backend (Vercel Serverless)
```bash
# In server/ — add vercel.json
```
Or deploy as a standalone Express app on Railway / Render.

### Frontend (Vercel)
```bash
cd client
npm run build
# Deploy dist/ to Vercel
# Set VITE_GOOGLE_CLIENT_ID and VITE_API_URL in Vercel environment
```
