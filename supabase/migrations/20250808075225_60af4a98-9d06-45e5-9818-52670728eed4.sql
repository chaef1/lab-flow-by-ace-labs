-- Fix organization-based access control for influencers table
-- First, ensure organization_id is not nullable to prevent security issues
ALTER TABLE public.influencers ALTER COLUMN organization_id SET NOT NULL;

-- Update influencer RLS policies to be more restrictive
DROP POLICY IF EXISTS "Users can view influencers in their organization" ON public.influencers;
DROP POLICY IF EXISTS "Users can add influencers to their organization" ON public.influencers;
DROP POLICY IF EXISTS "Users can update influencers in their organization" ON public.influencers;

CREATE POLICY "Users can view influencers in their organization" 
ON public.influencers 
FOR SELECT 
USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can add influencers to their organization" 
ON public.influencers 
FOR INSERT 
WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update influencers in their organization" 
ON public.influencers 
FOR UPDATE 
USING (organization_id = get_user_organization_id());

-- Fix social_media_searches table to ensure organization-based access
-- Make organization_id not nullable
ALTER TABLE public.social_media_searches ALTER COLUMN organization_id SET NOT NULL;

-- Update social_media_searches RLS policies
DROP POLICY IF EXISTS "Users can create searches in their organization" ON public.social_media_searches;
DROP POLICY IF EXISTS "Users can view searches in their organization" ON public.social_media_searches;

CREATE POLICY "Users can create searches in their organization" 
ON public.social_media_searches 
FOR INSERT 
WITH CHECK (
  organization_id = get_user_organization_id() AND 
  user_id = auth.uid()
);

CREATE POLICY "Users can view searches in their organization" 
ON public.social_media_searches 
FOR SELECT 
USING (organization_id = get_user_organization_id());

-- Ensure product_matches table has organization-based access
ALTER TABLE public.product_matches ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.product_matches ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Update product_matches RLS policies
DROP POLICY IF EXISTS "Users can create product matches" ON public.product_matches;
DROP POLICY IF EXISTS "Users can view product matches" ON public.product_matches;

CREATE POLICY "Users can create product matches in their organization" 
ON public.product_matches 
FOR INSERT 
WITH CHECK (
  organization_id = get_user_organization_id() AND 
  created_by = auth.uid()
);

CREATE POLICY "Users can view product matches in their organization" 
ON public.product_matches 
FOR SELECT 
USING (organization_id = get_user_organization_id());

-- Fix security definer functions to have proper search_path
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.is_user_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid();
$function$;