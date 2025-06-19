
-- Create a table to store Facebook content reports
CREATE TABLE IF NOT EXISTS public.facebook_content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  content_id TEXT NOT NULL,
  content_url TEXT NOT NULL,
  content_type TEXT NOT NULL,
  profile_data JSONB NOT NULL DEFAULT '{}',
  message TEXT,
  created_time TIMESTAMP WITH TIME ZONE,
  engagement_data JSONB NOT NULL DEFAULT '{}',
  raw_data JSONB NOT NULL DEFAULT '{}',
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.facebook_content_reports ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own reports
CREATE POLICY "Users can view their own content reports"
  ON public.facebook_content_reports
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to create reports
CREATE POLICY "Users can create content reports"
  ON public.facebook_content_reports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS facebook_content_reports_user_id_idx ON public.facebook_content_reports(user_id);
CREATE INDEX IF NOT EXISTS facebook_content_reports_content_id_idx ON public.facebook_content_reports(content_id);
