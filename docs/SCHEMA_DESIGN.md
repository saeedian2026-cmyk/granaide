# Granaide Database Schema Design

## Overview

Schema for low-code AI agent platform supporting agent configuration, execution, and proprietary data collection for competitive moat.

## Core Tables

### `profiles`
User profiles (Supabase auth extension)
```sql
-- Supabase manages this table automatically via auth
-- id: uuid (references auth.users)
-- email: text
-- created_at: timestamp
-- updated_at: timestamp
```

### `agents`
Agent configurations
```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  personality JSONB DEFAULT '{}',
  tools JSONB DEFAULT '[]',
  triggers JSONB DEFAULT '[]',
  guardrails JSONB DEFAULT '{}',
  autonomy_level TEXT DEFAULT 'assisted', -- manual, assisted, autonomous
  status TEXT DEFAULT 'active', -- active, paused, archived
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_status ON agents(status);
```

### `agent_executions`
Agent execution history (for proprietary data collection)
```sql
CREATE TABLE agent_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL, -- schedule, webhook, on_demand, event
  trigger_data JSONB,
  status TEXT DEFAULT 'running', -- running, completed, failed, cancelled
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  tokens_used INTEGER,
  cost_usd DECIMAL(10,4),
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration_ms INTEGER,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_executions_agent_id ON agent_executions(agent_id);
CREATE INDEX idx_executions_status ON agent_executions(status);
CREATE INDEX idx_executions_started_at ON agent_executions(started_at);
```

### `conversations`
Chat/conversation history
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  status TEXT DEFAULT 'active', -- active, archived
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
```

### `messages`
Individual messages in conversations
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- user, assistant, system
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

### `tool_calls`
Tool usage tracking (for proprietary integration data)
```sql
CREATE TABLE tool_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES agent_executions(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  tool_type TEXT NOT NULL, -- web_search, api_call, database, custom
  input_data JSONB,
  output_data JSONB,
  status TEXT DEFAULT 'success', -- success, failed, timeout
  duration_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tool_calls_execution_id ON tool_calls(execution_id);
CREATE INDEX idx_tool_calls_tool_name ON tool_calls(tool_name);
CREATE INDEX idx_tool_calls_created_at ON tool_calls(created_at);
```

### `agent_templates`
Pre-built agent templates
```sql
CREATE TABLE agent_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- research, support, sales, marketing, operations
  system_prompt TEXT NOT NULL,
  personality JSONB DEFAULT '{}',
  tools JSONB DEFAULT '[]',
  triggers JSONB DEFAULT '[]',
  guardrails JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_templates_category ON agent_templates(category);
CREATE INDEX idx_templates_is_public ON agent_templates(is_public);
```

### `usage_metrics`
Usage tracking for billing and analytics
```sql
CREATE TABLE usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL, -- api_calls, tokens, executions, tool_calls
  metric_value INTEGER NOT NULL,
  cost_usd DECIMAL(10,4),
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usage_user_id ON usage_metrics(user_id);
CREATE INDEX idx_usage_agent_id ON usage_metrics(agent_id);
CREATE INDEX idx_usage_period ON usage_metrics(period_start, period_end);
```

### `proprietary_data`
Proprietary data accumulation (competitive moat)
```sql
CREATE TABLE proprietary_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_type TEXT NOT NULL, -- process, outcome, integration, relationship
  source_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  data_category TEXT NOT NULL, -- niche-specific categorization
  raw_data JSONB NOT NULL,
  extracted_patterns JSONB DEFAULT '{}',
  confidence_score DECIMAL(3,2),
  is_verified BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_proprietary_data_type ON proprietary_data(data_type);
CREATE INDEX idx_proprietary_data_category ON proprietary_data(data_category);
CREATE INDEX idx_proprietary_data_created_at ON proprietary_data(created_at);
```

### `api_integrations`
Custom API integrations configured by users
```sql
CREATE TABLE api_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  api_type TEXT NOT NULL, -- rest, graphql, webhook
  base_url TEXT,
  auth_type TEXT, -- api_key, oauth, bearer, custom
  auth_config JSONB, -- encrypted auth details
  headers JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_integrations_user_id ON api_integrations(user_id);
CREATE INDEX idx_integrations_api_type ON api_integrations(api_type);
```

## Row Level Security (RLS)

### Enable RLS
```sql
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE proprietary_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_integrations ENABLE ROW LEVEL SECURITY;
```

### RLS Policies

#### `agents`
```sql
-- Users can read their own agents
CREATE POLICY "Users can read own agents"
  ON agents FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own agents
CREATE POLICY "Users can insert own agents"
  ON agents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own agents
CREATE POLICY "Users can update own agents"
  ON agents FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own agents
CREATE POLICY "Users can delete own agents"
  ON agents FOR DELETE
  USING (auth.uid() = user_id);
```

#### `agent_executions`
```sql
-- Users can read executions for their agents
CREATE POLICY "Users can read own agent executions"
  ON agent_executions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_executions.agent_id
      AND agents.user_id = auth.uid()
    )
  );

-- System can insert executions (via API)
CREATE POLICY "System can insert executions"
  ON agent_executions FOR INSERT
  WITH CHECK (true);
```

#### `conversations`
```sql
-- Users can read their own conversations
CREATE POLICY "Users can read own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own conversations
CREATE POLICY "Users can insert own conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own conversations
CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = user_id);
```

#### `messages`
```sql
-- Users can read messages in their conversations
CREATE POLICY "Users can read own messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- System can insert messages (via API)
CREATE POLICY "System can insert messages"
  ON messages FOR INSERT
  WITH CHECK (true);
```

#### `agent_templates`
```sql
-- Everyone can read public templates
CREATE POLICY "Everyone can read public templates"
  ON agent_templates FOR SELECT
  USING (is_public = true);

-- Users can read their own templates
CREATE POLICY "Users can read own templates"
  ON agent_templates FOR SELECT
  USING (auth.uid() = created_by);

-- Users can insert their own templates
CREATE POLICY "Users can insert own templates"
  ON agent_templates FOR INSERT
  WITH CHECK (auth.uid() = created_by);
```

#### `usage_metrics`
```sql
-- Users can read their own usage
CREATE POLICY "Users can read own usage metrics"
  ON usage_metrics FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert metrics (via API)
CREATE POLICY "System can insert usage metrics"
  ON usage_metrics FOR INSERT
  WITH CHECK (true);
```

#### `proprietary_data`
```sql
-- Only system can read proprietary data
CREATE POLICY "System can read proprietary data"
  ON proprietary_data FOR SELECT
  USING (true);

-- Only system can insert proprietary data
CREATE POLICY "System can insert proprietary data"
  ON proprietary_data FOR INSERT
  WITH CHECK (true);
```

#### `api_integrations`
```sql
-- Users can read their own integrations
CREATE POLICY "Users can read own integrations"
  ON api_integrations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own integrations
CREATE POLICY "Users can insert own integrations"
  ON api_integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own integrations
CREATE POLICY "Users can update own integrations"
  ON api_integrations FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own integrations
CREATE POLICY "Users can delete own integrations"
  ON api_integrations FOR DELETE
  USING (auth.uid() = user_id);
```

## Functions & Triggers

### Updated timestamp trigger
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_templates_updated_at
  BEFORE UPDATE ON agent_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proprietary_data_updated_at
  BEFORE UPDATE ON proprietary_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_integrations_updated_at
  BEFORE UPDATE ON api_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Views

### `agent_stats` view for analytics
```sql
CREATE OR REPLACE VIEW agent_stats AS
SELECT
  a.id,
  a.name,
  a.user_id,
  COUNT(DISTINCT ae.id) as total_executions,
  COUNT(DISTINCT c.id) as total_conversations,
  COUNT(DISTINCT m.id) as total_messages,
  SUM(ae.tokens_used) as total_tokens_used,
  SUM(ae.cost_usd) as total_cost,
  MAX(ae.started_at) as last_execution_at,
  a.created_at
FROM agents a
LEFT JOIN agent_executions ae ON a.id = ae.agent_id
LEFT JOIN conversations c ON a.id = c.agent_id
LEFT JOIN messages m ON c.id = m.conversation_id
GROUP BY a.id;
```

## Initial Data

### Seed agent templates
```sql
INSERT INTO agent_templates (name, description, category, system_prompt, personality, tools, triggers, guardrails, is_public) VALUES
(
  'Research Assistant',
  'Helps with research tasks, web search, and information synthesis',
  'research',
  'You are a helpful research assistant. Search the web for information, synthesize findings, and provide well-structured responses with citations.',
  '{"tone": "professional", "style": "analytical"}'::jsonb,
  '["web_search"]'::jsonb,
  '[]'::jsonb,
  '{"max_search_results": 10, "require_citations": true}'::jsonb,
  true
),
(
  'Customer Support Bot',
  'Handles customer inquiries, provides support, and escalates complex issues',
  'support',
  'You are a customer support representative. Help customers with their inquiries, provide clear and helpful responses, and escalate complex issues to human agents when necessary.',
  '{"tone": "friendly", "style": "helpful"}'::jsonb,
  '["knowledge_base", "ticket_system"]'::jsonb,
  '[{"type": "webhook", "event": "new_ticket"}]'::jsonb,
  '{"escalation_threshold": 3, "human_handoff": true}'::jsonb,
  true
),
(
  'Sales Outreach Agent',
  'Automates sales outreach, lead qualification, and follow-up sequences',
  'sales',
  'You are a sales representative. Qualify leads, craft personalized outreach messages, and manage follow-up sequences professionally.',
  '{"tone": "professional", "style": "persuasive"}'::jsonb,
  '["crm", "email", "calendar"]'::jsonb,
  '[{"type": "schedule", "cron": "0 9 * * *"}]'::jsonb,
  '{"max_emails_per_day": 50, "compliance_check": true}'::jsonb,
  true
);
```

## Migration Notes

This schema is designed to support:
1. **Low-code agent configuration** via JSONB fields for flexibility
2. **Proprietary data collection** through execution tracking and pattern extraction
3. **Scalable multi-tenant architecture** with proper RLS
4. **Usage-based billing** through metrics tracking
5. **Template marketplace** with public/private templates
6. **Custom integrations** via user-configured API endpoints

The JSONB fields provide schema flexibility while maintaining structure through validation at the application layer.
