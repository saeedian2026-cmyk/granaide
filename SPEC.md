# SPEC — Granaide

**Status:** DRAFT r1 — awaiting owner sign-off  
**Date:** 2026-08-08  
**Author Lane:** Claude Code  
**Source Inputs:** README.md, docs/SCHEMA_DESIGN.md, OBSERVATORY.md, AGENTS.md, CLAUDE.md

---

## A. Current Truth

**Built & Verified:**
- Next.js 15 + TypeScript project initialized at `E:\Plan M\Projects\Cube 10\Granaide`
- Git repository created: https://github.com/saeedian2026-cmyk/granaide
- Dependencies installed (358 packages)
- Database schema designed in `docs/SCHEMA_DESIGN.md` (10 tables, RLS policies, functions, triggers)
- Observatory lane created (`OBSERVATORY.md`)
- Agent guidance documents (`AGENTS.md`, `CLAUDE.md`)
- Documentation index (`docs/DOCS_INDEX.md`)
- **First product spike:** StallVix Kilo Executor Pack at `products/stallvix-kilo-pack/` (Kilo config + skills + Test A harness; not the full SaaS builder)

**Reported (Not Verified This Session):**
- StallVix operating backbone exists at `E:\Plan M\Projects\Cube 10\StallVix`
- Supabase project not yet created
- No live database, no authentication configured
- No UI screens built beyond default Next.js scaffold

**Governance State:**
- No locked spec exists (this is the first draft)
- AGENTS.md defines product boundaries and scope limits
- CLAUDE.md establishes database write authority
- OBSERVATORY.md provides research lane (zero authority until pulled into tasks)

---

## B. One-Paragraph Product Definition

Granaide is a low-code platform where businesses configure AI agents through forms (personality, tools, triggers, guardrails) without writing code. The platform stores agent configurations, execution history, and proprietary data (process, outcome, integration, relationship patterns) as a competitive moat. It refuses to pretend to be a general-purpose automation platform — it is specifically for creating and deploying AI agents that run on schedules, respond to webhooks, and perform niche-specific business tasks.

**Near-term product proof (DRAFT amendment, 2026-08-09):** Before the full web builder ships, Granaide’s first concrete product is the **StallVix Kilo Executor Pack** — a capability-gated Kilo Code agent/config pack that runs as a replaceable Level-C executor against StallVix, aligned with StallVix OBS PR #35 (Kilo is not the StallVix brain; StallVix-embedded Kilo stays parked until ordinary graph population). See `products/stallvix-kilo-pack/`.

---

## C. Primary User

**Who:** Small-to-medium business owners, solo founders, and operations managers who need automation but cannot write code.

**Context:** Alone or with a small team (1-5 people), working on desktop/laptop browsers, comfortable with SaaS tools but not development.

**Explicit Non-Users:**
- Enterprise IT departments (out of scope for MVP)
- Developers who prefer coding over low-code interfaces
- Users expecting free unlimited usage (usage-based pricing model)

---

## D. Core Workflow

1. User signs up via Supabase Auth (email/password or OAuth)
2. User creates first agent using configuration form (name, system prompt, personality, tools, triggers, guardrails)
3. User tests agent via chat interface (real-time streaming)
4. User configures trigger (schedule, webhook, or on-demand)
5. Platform executes agent autonomously based on trigger
6. Platform logs execution data (tokens used, cost, duration, output)
7. Platform extracts proprietary patterns from executions (process data, outcome data, integration data)
8. User reviews agent performance via dashboard
9. User iterates agent configuration based on results

**Binding Success Condition:** A non-technical user can create an agent, configure it to run on a schedule, and see execution results without writing any code.

---

## E. MVP Screens

1. **Auth Screen** — Sign up / sign in (Supabase Auth UI)
2. **Dashboard** — List of user's agents with status, last execution, quick actions
3. **Agent Configuration Form** — Name, description, system prompt, personality (tone, style), tools selection, triggers configuration, guardrails
4. **Chat Interface** — Real-time streaming chat with agent, message history
5. **Agent Detail View** — Configuration summary, execution history, performance metrics
6. **Template Gallery** — Pre-built agent templates (Research Assistant, Customer Support, Sales Outreach)

**Cut from MVP:**
- Multi-agent collaboration
- Visual workflow builder
- Template marketplace (community-built)
- Advanced analytics dashboards
- Billing/payment UI (free tier only for MVP)

---

## F. Data Model

**Existing Tables (from docs/SCHEMA_DESIGN.md):**
- `profiles` — Supabase auth extension
- `agents` — Agent configurations
- `agent_executions` — Execution history
- `conversations` — Chat history
- `messages` — Individual messages
- `tool_calls` — Tool usage tracking
- `agent_templates` — Pre-built templates
- `usage_metrics` — Billing/analytics
- `proprietary_data` — Competitive moat data
- `api_integrations` — Custom API endpoints

**Additions Required for MVP:**
None — schema design is complete and sufficient for MVP.

**Migration Status:**
Schema exists in `docs/SCHEMA_DESIGN.md` but has not been applied to Supabase. Must be converted to migration files in `supabase/migrations/` before database setup.

---

## G. Core Logic / Proof Rules

**Agent Configuration Validation:**
- System prompt must be non-empty
- At least one tool or trigger must be configured
- Autonomy level defaults to "assisted" (cannot start at "autonomous" without user override)

**Execution Gating:**
- Agent cannot execute without valid trigger configuration
- Execution logs must include: trigger_type, status, tokens_used, cost_usd, duration_ms
- Failed executions must include error_message for debugging

**Proprietary Data Collection:**
- Every execution must attempt pattern extraction (not optional)
- Tool calls must be logged with input_data, output_data, duration_ms
- Proprietary data writes are system-only (RLS policy)

**Cost Tracking:**
- Token usage must be tracked per execution
- Cost calculation must use actual API pricing (not estimates)
- Usage metrics must be aggregated daily for billing

**Security Rules:**
- User can only access their own agents (RLS)
- API integrations store auth_config as encrypted JSONB
- Webhook triggers must validate incoming requests

---

## H. Retained Design Principles

**No Agent Theatre:**
- Agent responses are actual LLM outputs, not pre-written scripts
- Execution times are real measurements, not simulated
- "Autonomous" means runs without human intervention, not magically intelligent

**No Fabricated Precision:**
- Token counts and costs are actual measurements from API responses
- Execution durations are precise millisecond measurements
- Success/failure status is based on actual outcomes, not predictions

**Built ≠ Verified:**
- Successful build ≠ production-ready deployment
- Local database ≠ live Supabase project
- Schema design ≠ applied migrations

**Deployed ≠ Production-Ready:**
- Deployed to Vercel ≠ fully tested
- Green build ≠ no bugs
- Auth configured ≠ secure implementation

**Free Toolchain First:**
- All AI/agent infrastructure uses free tools and APIs where possible
- Only paid components: Claude Code, Codex, Cursor (user's existing subscriptions)
- Groq, Hugging Face, Tavily, and similar free/open-source tools preferred over paid alternatives
- Webhook integrations prioritize free services

---

## I. Kill / Park List

**Killed for MVP:**
- Multi-agent collaboration workflows (revisit when single-agent adoption > 100 users)
- Visual drag-and-drop workflow builder (revisit when user feedback indicates demand)
- Community template marketplace (revisit when platform has 50+ templates)
- Enterprise SSO/SCIM integration (revisit when enterprise demand exists)
- Mobile apps (revisit when desktop usage saturates)

**Parked Items:**
- **Billing Integration** — Revisit trigger: Free tier usage reaches 80% of capacity or 3 months post-launch
- **Advanced Analytics** — Revisit trigger: 100+ active agents with execution history
- **Email/Slack Integrations** — Revisit trigger: User requests in observatory or direct feedback
- **Multi-Agent Teams** — Revisit trigger: User successfully deploys 5+ single agents
- **Custom Model Fine-Tuning** — Revisit trigger: Proprietary data volume > 1M records

---

## J. Next Three Actions

1. **Owner Decision:** Review and lock this SPEC.md (current DRAFT status)
2. **Database Setup:** Create Supabase project, apply schema migrations from docs/SCHEMA_DESIGN.md
3. **Auth Implementation:** Configure Supabase Auth, build sign-up/sign-in flow

---

## Open Decisions Table

| # | Decision | Status | Reasoning |
|---|----------|--------|-----------|
| 1 | Free AI Model Selection | **Open** | Groq (Llama 3) vs Hugging Face Inference vs other free providers. Recommendation: Start with Groq for speed, add Hugging Face for model variety. |
| 2 | Free Tier Limits | **Open** | What are the usage limits for free tier? Recommendations: 10 agents max, 100 executions/day, 10K tokens/month. |
| 3 | Webhook Infrastructure | **Open** | Use Vercel cron jobs vs external service vs Supabase Edge Functions. Recommendation: Supabase Edge Functions for webhook handling. |
| 4 | Proprietary Data Extraction | **Open** | When to extract patterns? Real-time vs batch vs on-demand. Recommendation: Batch extraction daily for MVP. |
| 5 | Cost Strategy Enforcement | **Open** | How to prevent accidental paid API usage? Recommendation: Whitelist free APIs only, require approval for paid services. |

---

## Explicit Uncertainties

**Inferences (Not Verified):**
- StallVix operating backbone exists and can track Granaide agents (reported, not verified)
- Supabase free tier will support MVP database size (estimated, not tested)
- Groq free tier will handle expected traffic (estimated, not load-tested)

**Unverified Claims:**
- Free AI tools will provide sufficient quality for business use cases
- Webhook integrations with third-party services will work reliably
- Proprietary data collection will provide meaningful competitive advantage

**Technical Uncertainties:**
- Token counting accuracy across different free AI providers
- Real-time streaming performance with free inference APIs
- RLS policy performance at scale with concurrent executions

---

## Appendix: Cost Strategy Details

**Paid Components (User Subscriptions):**
- Claude Code — Development and coding assistance
- Codex — Parallel AI coding agent
- Cursor — AI-powered code editor

**Free Components (Platform Infrastructure):**
- Groq — Fast inference (Llama models)
- Hugging Face — Model hub and inference
- Tavily — Web search API (free tier)
- Supabase — Database and auth (free tier)
- Vercel — Deployment (free tier)
- Webhook services — n8n, Make.com (free tiers)

**Cost Enforcement:**
- Platform will default to free APIs only
- Any paid API integration requires explicit user approval
- Usage tracking will alert users approaching free tier limits
- Cost transparency: display estimated costs before execution

**Future Monetization:**
- Usage-based pricing after free tier exhaustion
- Premium features (advanced analytics, priority support)
- Enterprise plans (SLA, dedicated support, custom integrations)
