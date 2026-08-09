# Granaide

**The Agent Maker Platform**

A low-code platform where businesses can create and deploy AI agents — without writing code.

## Vision

> "Stop thinking SaaS. Start building agentic-first companies. The next winners won't sell AI tools. They'll run businesses powered by autonomous agents from day one." — Eric Schmidt

Granaide enables businesses to:
- **Configure** agents through simple forms (personality, tools, rules)
- **Generate** running autonomous agents from configuration
- **Deploy** agents that run on schedules, respond to triggers, and do real work

## Architecture

### Two-System Design

**StallVix** (Operating Backbone)
- Internal console for running your studio
- Tracks projects, tools, QA, handoff-readiness
- Manages everything work-related

**Granaide** (Product)
- Low-code platform sold to businesses
- They build custom agents
- StallVix tracks their agents internally

### First product (spike)

**StallVix Kilo Executor Pack** — Granaide’s first shippable artifact lives at [`products/stallvix-kilo-pack/`](products/stallvix-kilo-pack/). It configures Kilo Code as a capability-gated Level-C executor for StallVix (not StallVix’s brain). Full SaaS agent-builder UI remains on the roadmap below; this pack is the near-term product proof.

## Roadmap

### Phase 1: Foundation (Week 1-2)
- [x] Initialize Next.js + TypeScript project
- [x] First product spike: StallVix Kilo Executor Pack (`products/stallvix-kilo-pack/`)
- [ ] Set up Supabase
- [ ] Set up authentication
- [ ] Create database schema
- [ ] Build basic UI shell

### Phase 2: First Agent (Week 3)
- [ ] Agent configuration form
- [ ] Chat interface
- [ ] Persistence (save/load agents)
- [ ] Message history

### Phase 3: Tools & Triggers (Week 4-5)
- [ ] Web search integration
- [ ] Scheduled triggers
- [ ] Webhook triggers
- [ ] Custom API calls

### Phase 4: Polish & Ship (Week 6)
- [ ] Multi-agent dashboard
- [ ] Agent templates
- [ ] Usage tracking
- [ ] Share functionality
- [ ] Landing page
- [ ] Deploy to production

### Phase 5+: Scale (Month 2+)
- [ ] More tools (email, Slack, databases)
- [ ] Visual builder
- [ ] Template marketplace
- [ ] Multi-agent teams
- [ ] Billing integration
- [ ] Analytics

## Moat Strategy

Our defensible advantage comes from proprietary data:

1. **Process Data** — How decisions are actually made in niches
2. **Outcome Data** — What actually worked vs. what didn't
3. **Integration Data** — How to work with niche-specific systems
4. **Relationship Data** — Who works with whom, trust patterns

**Flywheel:** Users → Agent runs → Data collected → Model improves → More users

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
```

## License

Proprietary — All rights reserved
