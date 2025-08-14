-- Add unique constraint for influencers upsert operations
-- This prevents duplicate influencers with the same username, platform, and organization
ALTER TABLE public.influencers 
ADD CONSTRAINT unique_influencer_per_org 
UNIQUE (username, platform, organization_id);

-- Update the id column to have proper default value if it doesn't already
ALTER TABLE public.influencers 
ALTER COLUMN id SET DEFAULT gen_random_uuid();