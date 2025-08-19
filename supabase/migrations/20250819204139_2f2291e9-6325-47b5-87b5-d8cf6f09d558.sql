-- Add missing columns to creators table
ALTER TABLE public.creators 
ADD COLUMN IF NOT EXISTS following INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS posts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS biography TEXT,
ADD COLUMN IF NOT EXISTS external_url TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS raw_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update existing rows to have the new columns with default values
UPDATE public.creators 
SET 
  following = COALESCE(following, 0),
  posts = COALESCE(posts, 0),
  raw_data = COALESCE(raw_data, '{}'),
  last_updated = COALESCE(last_updated, now())
WHERE following IS NULL OR posts IS NULL OR raw_data IS NULL OR last_updated IS NULL;

-- Create additional indexes
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
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_creators_updated_at ON public.creators;

CREATE TRIGGER update_creators_updated_at
BEFORE UPDATE ON public.creators
FOR EACH ROW
EXECUTE FUNCTION public.update_creators_updated_at();