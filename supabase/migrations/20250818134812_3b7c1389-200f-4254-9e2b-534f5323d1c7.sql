-- Create tables for the influencer intelligence platform

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

-- RLS Policies
-- Lists policies
CREATE POLICY "Users can manage their own lists" ON public.lists FOR ALL USING (created_by = auth.uid());

-- Saved searches policies
CREATE POLICY "Users can manage their own searches" ON public.saved_searches FOR ALL USING (created_by = auth.uid());

-- Cached reports policies (public read for efficiency)
CREATE POLICY "Anyone can read cached reports" ON public.cached_creator_reports FOR SELECT USING (true);
CREATE POLICY "System can manage cached reports" ON public.cached_creator_reports FOR INSERT USING (true);
CREATE POLICY "System can update cached reports" ON public.cached_creator_reports FOR UPDATE USING (true);

-- Brand monitors policies
CREATE POLICY "Users can manage their brand monitors" ON public.brand_monitors FOR ALL USING (created_by = auth.uid() OR auth.uid() = ANY(owners));

-- Brand monitor hits policies
CREATE POLICY "Users can view hits for their monitors" ON public.brand_monitor_hits FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.brand_monitors 
    WHERE id = brand_monitor_hits.monitor_id 
    AND (created_by = auth.uid() OR auth.uid() = ANY(owners))
  )
);
CREATE POLICY "System can insert monitor hits" ON public.brand_monitor_hits FOR INSERT USING (true);

-- Campaign workspace policies
CREATE POLICY "Users can manage their workspaces" ON public.campaign_workspaces FOR ALL USING (created_by = auth.uid() OR auth.uid() = ANY(owners));

-- Campaign workspace creators policies
CREATE POLICY "Users can manage creators in their workspaces" ON public.campaign_workspace_creators FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.campaign_workspaces 
    WHERE id = campaign_workspace_creators.workspace_id 
    AND (created_by = auth.uid() OR auth.uid() = ANY(owners))
  )
);

-- Creator comparisons policies
CREATE POLICY "Users can manage their comparisons" ON public.creator_comparisons FOR ALL USING (created_by = auth.uid());

-- API usage logs policies
CREATE POLICY "Users can view their own usage" ON public.api_usage_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can log usage" ON public.api_usage_logs FOR INSERT USING (true);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lists_updated_at BEFORE UPDATE ON public.lists FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_brand_monitors_updated_at BEFORE UPDATE ON public.brand_monitors FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_campaign_workspaces_updated_at BEFORE UPDATE ON public.campaign_workspaces FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_campaign_workspace_creators_updated_at BEFORE UPDATE ON public.campaign_workspace_creators FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();