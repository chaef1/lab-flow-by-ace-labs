-- Add ayrshare_profile_key column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN ayrshare_profile_key TEXT UNIQUE;