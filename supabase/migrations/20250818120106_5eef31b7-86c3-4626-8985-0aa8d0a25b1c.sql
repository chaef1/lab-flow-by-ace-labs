-- Create enhanced schema for Storyclash-style platform

-- Creator watchlists for saved discoveries
CREATE TABLE public.watchlists (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Watchlist items
CREATE TABLE public.watchlist_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    watchlist_id UUID NOT NULL REFERENCES public.watchlists(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    snapshot_kpis JSONB NOT NULL DEFAULT '{}',
    added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Saved search filters
CREATE TABLE public.saved_searches (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    platform TEXT NOT NULL,
    payload_json JSONB NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Cached creator reports for credit optimization
CREATE TABLE public.cached_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    platform TEXT NOT NULL,
    user_id TEXT NOT NULL,
    report_json JSONB NOT NULL,
    fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(platform, user_id)
);

-- Brand monitoring rules
CREATE TABLE public.monitors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    rules_json JSONB NOT NULL,
    schedule TEXT NOT NULL DEFAULT 'daily',
    created_by UUID NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Monitor hits/results
CREATE TABLE public.monitor_hits (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    monitor_id UUID NOT NULL REFERENCES public.monitors(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    obj_ref TEXT NOT NULL,
    hit_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    metadata JSONB NOT NULL DEFAULT '{}'
);

-- Campaign workspaces
CREATE TABLE public.campaign_workspaces (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL,
    owners JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Campaign creators (CRM-style tracking)
CREATE TABLE public.campaign_creators (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES public.campaign_workspaces(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    stage TEXT NOT NULL DEFAULT 'prospect',
    owner UUID,
    notes TEXT,
    price DECIMAL,
    deliverables TEXT,
    deadline DATE,
    snapshot_kpis JSONB NOT NULL DEFAULT '{}',
    added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cached_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitor_hits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_creators ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own watchlists" ON public.watchlists
FOR ALL USING (created_by = auth.uid());

CREATE POLICY "Users can manage watchlist items for their watchlists" ON public.watchlist_items
FOR ALL USING (watchlist_id IN (SELECT id FROM public.watchlists WHERE created_by = auth.uid()));

CREATE POLICY "Users can manage their saved searches" ON public.saved_searches
FOR ALL USING (created_by = auth.uid());

CREATE POLICY "Anyone can read cached reports" ON public.cached_reports
FOR SELECT USING (true);

CREATE POLICY "System can insert cached reports" ON public.cached_reports
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can manage their monitors" ON public.monitors
FOR ALL USING (created_by = auth.uid());

CREATE POLICY "Users can view monitor hits for their monitors" ON public.monitor_hits
FOR SELECT USING (monitor_id IN (SELECT id FROM public.monitors WHERE created_by = auth.uid()));

CREATE POLICY "System can insert monitor hits" ON public.monitor_hits
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can manage their campaign workspaces" ON public.campaign_workspaces
FOR ALL USING (created_by = auth.uid());

CREATE POLICY "Users can manage creators in their campaigns" ON public.campaign_creators
FOR ALL USING (campaign_id IN (SELECT id FROM public.campaign_workspaces WHERE created_by = auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_watchlist_items_watchlist_id ON public.watchlist_items(watchlist_id);
CREATE INDEX idx_cached_reports_platform_user ON public.cached_reports(platform, user_id);
CREATE INDEX idx_monitor_hits_monitor_id ON public.monitor_hits(monitor_id);
CREATE INDEX idx_campaign_creators_campaign_id ON public.campaign_creators(campaign_id);

-- Update trigger function
CREATE TRIGGER update_watchlists_updated_at
    BEFORE UPDATE ON public.watchlists
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_monitors_updated_at
    BEFORE UPDATE ON public.monitors
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_workspaces_updated_at
    BEFORE UPDATE ON public.campaign_workspaces
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_creators_updated_at
    BEFORE UPDATE ON public.campaign_creators
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();