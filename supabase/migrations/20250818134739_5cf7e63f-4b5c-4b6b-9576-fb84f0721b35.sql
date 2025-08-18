-- Create tables for the influencer intelligence platform (Fixed RLS policies)

-- Enhanced watchlists table (if not exists)
CREATE TABLE IF NOT EXISTS public.lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Saved searches table
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  payload_json JSONB NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enhanced cached reports table
CREATE TABLE IF NOT EXISTS public.cached_creator_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  user_id TEXT NOT NULL,
  report_json JSONB NOT NULL,
  performance_json JSONB,
  raw_feed_json JSONB,
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '30 days'),
  UNIQUE(platform, user_id)
);

-- Brand monitoring rules
CREATE TABLE IF NOT EXISTS public.brand_monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rules_json JSONB NOT NULL,
  schedule TEXT DEFAULT 'daily',
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  owners UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Brand monitoring hits/mentions
CREATE TABLE IF NOT EXISTS public.brand_monitor_hits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id UUID REFERENCES public.brand_monitors(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  creator_id TEXT NOT NULL,
  post_id TEXT,
  hit_type TEXT NOT NULL, -- 'mention', 'hashtag', 'competitor'
  content_preview TEXT,
  metrics JSONB DEFAULT '{}',
  confidence_score DECIMAL(3,2) DEFAULT 1.0,
  hit_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed BOOLEAN DEFAULT false
);

-- Campaign workspace tables
CREATE TABLE IF NOT EXISTS public.campaign_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  stage_definitions JSONB DEFAULT '[
    {"id": "prospect", "name": "Prospect", "color": "#gray"},
    {"id": "contacted", "name": "Contacted", "color": "#blue"},
    {"id": "negotiating", "name": "Negotiating", "color": "#yellow"},
    {"id": "active", "name": "Active", "color": "#green"},
    {"id": "closed", "name": "Closed", "color": "#red"}
  ]',
  created_by UUID NOT NULL,
  owners UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.campaign_workspace_creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.campaign_workspaces(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  creator_id TEXT NOT NULL,
  username TEXT NOT NULL,
  stage TEXT DEFAULT 'prospect',
  assigned_to UUID,
  price_quoted DECIMAL(10,2),
  deliverables TEXT[],
  notes TEXT,
  contact_email TEXT,
  last_contacted TIMESTAMP WITH TIME ZONE,
  deal_status TEXT DEFAULT 'open', -- 'open', 'won', 'lost'
  snapshot_json JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Creator comparison sessions
CREATE TABLE IF NOT EXISTS public.creator_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  creator_ids JSONB NOT NULL, -- Array of {platform, userId} objects
  comparison_data JSONB,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Performance tracking for credit usage
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  platform TEXT,
  query_hash TEXT,
  credits_used INTEGER DEFAULT 1,
  response_cached BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cached_creator_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_monitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_monitor_hits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_workspace_creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;