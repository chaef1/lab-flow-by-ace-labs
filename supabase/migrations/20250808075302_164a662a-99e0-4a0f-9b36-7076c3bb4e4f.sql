-- First, get the default organization (Ace Labs) ID
DO $$
DECLARE
    default_org_id uuid;
BEGIN
    SELECT id INTO default_org_id FROM public.organizations WHERE name = 'Ace Labs' LIMIT 1;
    
    -- Update existing social_media_searches records with null organization_id
    UPDATE public.social_media_searches 
    SET organization_id = (
        SELECT organization_id 
        FROM public.profiles 
        WHERE profiles.id = social_media_searches.user_id
        LIMIT 1
    )
    WHERE organization_id IS NULL;
    
    -- If still null, set to default org
    UPDATE public.social_media_searches 
    SET organization_id = default_org_id
    WHERE organization_id IS NULL;
    
    -- Update existing influencers with null organization_id  
    UPDATE public.influencers 
    SET organization_id = default_org_id
    WHERE organization_id IS NULL;
    
    -- Update existing product_matches with null organization_id (if they exist)
    UPDATE public.product_matches 
    SET organization_id = default_org_id,
        created_by = (SELECT id FROM auth.users LIMIT 1)
    WHERE organization_id IS NULL OR created_by IS NULL;
END
$$;

-- Now apply the NOT NULL constraints
ALTER TABLE public.influencers ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.social_media_searches ALTER COLUMN organization_id SET NOT NULL;

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

-- Add organization columns to product_matches if not exists
ALTER TABLE public.product_matches ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.product_matches ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Update product_matches RLS policies
DROP POLICY IF EXISTS "Users can create product matches" ON public.product_matches;
DROP POLICY IF EXISTS "Users can view product matches" ON public.product_matches;
DROP POLICY IF EXISTS "Users can create product matches in their organization" ON public.product_matches;
DROP POLICY IF EXISTS "Users can view product matches in their organization" ON public.product_matches;

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