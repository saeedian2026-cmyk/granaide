# Granaide Documentation Index

## Repository Structure

```
Granaide/
├── src/
│   └── app/              # Next.js App Router pages
│       ├── layout.tsx    # Root layout
│       ├── page.tsx      # Home page
│       └── globals.css   # Global styles
├── public/               # Static assets
├── docs/                 # Documentation
│   ├── SCHEMA_DESIGN.md # Database schema
│   └── DOCS_INDEX.md    # This file
├── OBSERVATORY.md       # Research & suggestions lane
├── AGENTS.md           # Agent operating rules
├── CLAUDE.md           # Claude Code guidance
├── README.md           # Project overview
└── package.json        # Dependencies
```

## Core Documentation

### Project Documentation
- **README.md** - Project overview, vision, architecture, roadmap
- **OBSERVATORY.md** - Research lane for suggestions and exploration
- **AGENTS.md** - Operating rules for AI agents working on this repo
- **CLAUDE.md** - Guidance for Claude Code

### Technical Documentation
- **docs/SCHEMA_DESIGN.md** - Complete database schema with tables, RLS policies, functions, and migrations

## Lane Structure

### Observatory Lane (OBSERVATORY.md)
- Research and suggestions only
- Never merged, never a PR
- Zero authority until pulled into task packets
- Newest entries on top, dated

### Main Development
- `master` branch - main development branch
- GitHub: https://github.com/saeedian2026-cmyk/granaide

## Database Schema Overview

### Core Tables
- `profiles` - User profiles (Supabase auth)
- `agents` - Agent configurations
- `agent_executions` - Execution history (proprietary data)
- `conversations` - Chat history
- `messages` - Individual messages
- `tool_calls` - Tool usage tracking
- `agent_templates` - Pre-built templates
- `usage_metrics` - Billing/analytics
- `proprietary_data` - Competitive moat data
- `api_integrations` - Custom API endpoints

### Key Features
- Row Level Security (RLS) for multi-tenant isolation
- JSONB fields for flexible configuration
- Comprehensive indexing for performance
- Views for analytics
- Triggers for timestamp management

## Roadmap Phases

### Phase 1: Foundation (Week 1-2)
- ✅ Initialize Next.js + TypeScript project
- ✅ Set up Git repository
- ✅ Create observatory lane
- ✅ Design database schema
- ⏳ Set up Supabase
- ⏳ Configure authentication
- ⏳ Create database migrations
- ⏳ Build basic UI shell

### Phase 2: First Agent (Week 3)
- ⏳ Agent configuration form
- ⏳ Chat interface
- ⏳ Persistence (save/load agents)
- ⏳ Message history

### Phase 3: Tools & Triggers (Week 4-5)
- ⏳ Web search integration
- ⏳ Scheduled triggers
- ⏳ Webhook triggers
- ⏳ Custom API calls

### Phase 4: Polish & Ship (Week 6)
- ⏳ Multi-agent dashboard
- ⏳ Agent templates
- ⏳ Usage tracking
- ⏳ Share functionality
- ⏳ Landing page
- ⏳ Deploy to production

### Phase 5+: Scale (Month 2+)
- ⏳ More tools (email, Slack, databases)
- ⏳ Visual builder
- ⏳ Template marketplace
- ⏳ Multi-agent teams
- ⏳ Billing integration
- ⏳ Analytics

## Two-System Architecture

### StallVix (Operating Backbone)
- Internal console for running your studio
- Tracks projects, tools, QA, handoff-readiness
- Manages everything work-related
- Location: `E:\Plan M\Projects\Cube 10\StallVix`

### Granaide (Product)
- Low-code platform sold to businesses
- They build custom agents
- StallVix tracks their agents internally
- Location: `E:\Plan M\Projects\Cube 10\Granaide`

## Tech Stack

- **Frontend:** Next.js, React, TypeScript
- **Backend:** Next.js API routes
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **AI:** OpenAI/Claude APIs
- **Deployment:** Vercel

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run type checking
npm run typecheck

# Run linting
npm run lint
```

## Moat Strategy

Our defensible advantage comes from proprietary data:

1. **Process Data** — How decisions are actually made in niches
2. **Outcome Data** — What actually worked vs. what didn't
3. **Integration Data** — How to work with niche-specific systems
4. **Relationship Data** — Who works with whom, trust patterns

**Flywheel:** Users → Agent runs → Data collected → Model improves → More users
