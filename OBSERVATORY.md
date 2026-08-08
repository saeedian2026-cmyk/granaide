# Granaide Observatory Lane

Research & suggestions lane. Never merged, never a PR. Suggestions here have zero authority until pulled into a task packet by the owner/Claude.

Newest entries on top, dated.

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
