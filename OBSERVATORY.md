# Granaide Observatory Lane

Research & suggestions lane. Never merged, never a PR. Suggestions here have zero authority until pulled into a task packet by the owner/Claude.

Newest entries on top, dated.

## 2026-08-09 — Instagram Agentic Market Audit (5 posts)

Curious audit of five Instagram posts against Granaide’s agentic-business thesis. **Zero product authority** — marketing/research signal only. Do not expand Phase 1 scope from this.

### Sources examined

1. [@alassafi.ai /p/DbdtyloN-0F](https://www.instagram.com/p/DbdtyloN-0F/) — “137 AI agents / 7 departments” live company map; CTA comment **MAP**
2. [@glovejones /p/DYVc_9qSUdH](https://www.instagram.com/p/DYVc_9qSUdH/) — **Polsia**: 1 founder, ops for ~7,000 companies via agents; CTA comment **polsia** → polsia.com/live
3. [@atlasberry008 /p/Da5zmVEpFXm](https://www.instagram.com/p/Da5zmVEpFXm/) — **BenchmarkList** AI Human Work Map (job × AI capability); gaps = businesses; CTA comment **MAP**
4. [@repl.it /p/DbwQhO4iGls](https://www.instagram.com/p/DbwQhO4iGls/) — “Self-driving company”; agents in eng/support/sales; blog: https://replit.com/blog/self-driving-company
5. [@glovejones /p/Dbvseg6NH60](https://www.instagram.com/p/Dbvseg6NH60/) — **Base Power** home-battery network / $13B valuation — **not agentic product** (energy/infra news)

### How these posts are made (craft pattern)

- One hard claim in first seconds (“137 agents,” “7,000 companies,” “self-driving company”)
- One visual metaphor (org map, magazine cover, live dashboard) — not a feature dump
- Comment-keyword → DM lead magnet (MAP / polsia)
- Soft proof: live map, blog graphs, “click and run”
- Honest framing when present (Replit): people set destination; agents do steps

### Competitive read vs Granaide

| Player | What they sell | Vs Granaide |
|--------|----------------|-------------|
| Alassafi MAP | Packaged agent team + map UI | Template/swarm story; Granaide = **maker** so any business configures its own |
| Polsia | Ops-as-service (“we run it”) | Service model; Granaide = **platform** customers own |
| BenchmarkList | Where AI can replace/augment jobs | Research/map; Granaide = **execution** |
| Replit | Code platform + internal self-driving | Dev/infra; Granaide = **business agents without code** |
| Base Power | Energy hardware network | Irrelevant to product |

### Verdict

- Market narrative **validates** Granaide’s thesis (configure → generate → deploy agentic companies). Nothing here makes the product obsolete.
- Risk if we drift: chasing 137-agent spectacle before one boring niche agent that does real work.
- Stay on **Phase 1 foundation**. Treat this as a marketing inspiration queue, not a rebuild brief.

### Useful steal later (not now)

1. Positioning language: “self-driving company” + department map > “low-code AI platform” in feeds (landing/messaging later).
2. Autonomy ladder (manual → assisted → autonomous) for future agent config honesty.
3. Show a live map of *our* agents (StallVix internal first) as proof.
4. Don’t compete with Replit on coding agents; compete on non-dev businesses running agents.
5. Optional metaphor only: many small coordinated agents > one giant bot (from Base Power network idea — messaging only).

### Suggested first niche (when Phase 2 starts — not authorized yet)

Pick one job Granaide’s studio already feels from Alassafi’s department list, e.g. client onboarding, status reporting, or proposal writing — ship one real agent before any “137” story.

**Status:** Parked in observatory. Ready for owner to pull into a task packet if desired.

## 2026-08-08 — Database Schema Design Completed

Comprehensive database schema design completed and committed to docs/SCHEMA_DESIGN.md.

**Completed:**
- Core tables: agents, agent_executions, conversations, messages, tool_calls
- Moat infrastructure: proprietary_data table for competitive advantage
- User management: profiles, usage_metrics, api_integrations
- Template system: agent_templates for marketplace foundation
- Complete RLS policies for multi-tenant isolation
- Functions, triggers, and views for analytics
- Initial seed data for agent templates

**Schema highlights:**
- JSONB fields for flexible agent configuration
- Comprehensive execution tracking for proprietary data collection
- Tool usage tracking for integration data moat
- Usage metrics for billing and analytics
- Template marketplace structure

**Status:** Schema design complete, ready for Supabase implementation in Phase 1.

## 2026-08-08 — Observatory Lane Initialization

Created observatory lane modeled after Dating-codex-observatory pattern.

**Purpose:** Research, suggestions, and exploration for Granaide Agent Maker Platform without affecting the main codebase.

**Structure:**
- Single `OBSERVATORY.md` at repo root (this file)
- Research entries dated, newest on top
- Zero authority until pulled into task packets
- Never merged, never a PR

**Now (active):**
- Schema design research ✅ (completed)
- Proprietary data strategy exploration
- Niche-specific agent patterns
- Tool integration patterns

**Next (not yet authorized):**
- Specific niche deep-dives (real estate, legal, healthcare, restaurants)
- Multi-agent collaboration patterns
- Visual builder UX research
- Template marketplace design

**Parked:**
- Advanced AI model fine-tuning approaches
- Custom SLM training pipelines
- Enterprise deployment patterns

**Rejected:**
- Generic "one-size-fits-all" agent templates
- Unbounded tool integration without schema constraints
- Autonomous agent swarms without human oversight
