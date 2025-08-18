-- Fix RLS policies
DROP POLICY IF EXISTS "System can manage cached reports" ON public.cached_creator_reports;
DROP POLICY IF EXISTS "System can update cached reports" ON public.cached_creator_reports;

-- Fixed policies for cached reports
CREATE POLICY "System can insert cached reports" ON public.cached_creator_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update cached reports" ON public.cached_creator_reports FOR UPDATE USING (true);

-- Fixed policy for brand monitor hits
DROP POLICY IF EXISTS "System can insert monitor hits" ON public.brand_monitor_hits;
CREATE POLICY "System can insert monitor hits" ON public.brand_monitor_hits FOR INSERT WITH CHECK (true);

-- Fixed policy for API usage logs
DROP POLICY IF EXISTS "System can log usage" ON public.api_usage_logs;
CREATE POLICY "System can log usage" ON public.api_usage_logs FOR INSERT WITH CHECK (true);