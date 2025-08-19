-- Create creators table to store cached API results
CREATE TABLE IF NOT EXISTS public.creators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  full_name TEXT,
  profile_pic_url TEXT,
  followers INTEGER DEFAULT 0,
  following INTEGER DEFAULT 0,
  posts INTEGER DEFAULT 0,
  engagement_rate NUMERIC DEFAULT 0,
  avg_likes INTEGER DEFAULT 0,
  avg_views INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  has_contact_details BOOLEAN DEFAULT false,
  top_audience_country TEXT,
  top_audience_city TEXT,
  biography TEXT,
  external_url TEXT,
  category TEXT,
  raw_data JSONB DEFAULT '{}',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(platform, user_id)
);

-- Enable RLS
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view creators" 
ON public.creators 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can insert creators" 
ON public.creators 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can update creators" 
ON public.creators 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_creators_platform_username ON public.creators (platform, username);
CREATE INDEX IF NOT EXISTS idx_creators_platform_userid ON public.creators (platform, user_id);
CREATE INDEX IF NOT EXISTS idx_creators_followers ON public.creators (followers DESC);
CREATE INDEX IF NOT EXISTS idx_creators_engagement_rate ON public.creators (engagement_rate DESC);
CREATE INDEX IF NOT EXISTS idx_creators_last_updated ON public.creators (last_updated DESC);

-- Add full text search index for better text searching
CREATE INDEX IF NOT EXISTS idx_creators_text_search ON public.creators 
USING gin(to_tsvector('english', coalesce(username, '') || ' ' || coalesce(full_name, '') || ' ' || coalesce(biography, '')));

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_creators_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_creators_updated_at
BEFORE UPDATE ON public.creators
FOR EACH ROW
EXECUTE FUNCTION public.update_creators_updated_at();