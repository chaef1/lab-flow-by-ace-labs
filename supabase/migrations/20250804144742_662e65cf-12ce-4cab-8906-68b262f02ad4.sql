-- Remove the foreign key constraint that requires influencer IDs to exist in profiles
-- Influencers from social media searches are not necessarily system users
ALTER TABLE public.influencers DROP CONSTRAINT IF EXISTS fk_influencers_profile;