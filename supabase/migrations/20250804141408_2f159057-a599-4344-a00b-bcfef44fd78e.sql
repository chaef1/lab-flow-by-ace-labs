-- Update influencers table to accommodate Ayrshare data
ALTER TABLE public.influencers 
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS account_type TEXT,
ADD COLUMN IF NOT EXISTS avg_likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_comments INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT 'instagram';

-- Update RLS policies to allow authenticated users to insert influencers
DROP POLICY IF EXISTS "Influencers can view all" ON public.influencers;

CREATE POLICY "Public can view influencers" 
ON public.influencers 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can add influencers" 
ON public.influencers 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update influencers" 
ON public.influencers 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Create index for better performance on username and platform
CREATE INDEX IF NOT EXISTS idx_influencers_username_platform ON public.influencers(username, platform);