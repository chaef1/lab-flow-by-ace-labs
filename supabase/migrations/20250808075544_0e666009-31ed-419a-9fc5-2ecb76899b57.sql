-- Step 1: Fix existing data first
DO $$
DECLARE
    default_org_id uuid;
BEGIN
    -- Get the default organization (Ace Labs) ID
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
    
    -- If still null after user profile lookup, set to default org
    UPDATE public.social_media_searches 
    SET organization_id = default_org_id
    WHERE organization_id IS NULL;
    
    -- Update existing influencers with null organization_id  
    UPDATE public.influencers 
    SET organization_id = default_org_id
    WHERE organization_id IS NULL;
END
$$;

-- Step 2: Now apply the NOT NULL constraints
ALTER TABLE public.influencers ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.social_media_searches ALTER COLUMN organization_id SET NOT NULL;

-- Step 3: Add organization columns to product_matches table
ALTER TABLE public.product_matches ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.product_matches ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Step 4: Update existing product_matches with default values
DO $$
DECLARE
    default_org_id uuid;
    default_user_id uuid;
BEGIN
    SELECT id INTO default_org_id FROM public.organizations WHERE name = 'Ace Labs' LIMIT 1;
    SELECT id INTO default_user_id FROM auth.users LIMIT 1;
    
    UPDATE public.product_matches 
    SET organization_id = default_org_id,
        created_by = default_user_id
    WHERE organization_id IS NULL OR created_by IS NULL;
END
$$;