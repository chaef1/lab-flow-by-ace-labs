-- Step 5: Update RLS policies with organization-based access control

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

-- Fix security definer functions to have proper search_path (fixes security warnings)
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

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER 
 SET search_path = 'public'
AS $function$
DECLARE
  _role user_role;
  _user_id uuid;
  _default_org_id uuid;
  _org_name text;
BEGIN
  -- Get default organization (Ace Labs)
  SELECT id, name INTO _default_org_id, _org_name FROM public.organizations WHERE name = 'Ace Labs' LIMIT 1;
  
  -- Determine role based on email
  IF new.email LIKE '%@acelabs.co.za' THEN
    _role := 'admin';
  ELSE
    -- Get role from metadata, default to brand
    _role := COALESCE((new.raw_user_meta_data->>'role')::user_role, 'brand'::user_role);
  END IF;

  _user_id := new.id;

  -- Insert into profiles with organization
  INSERT INTO public.profiles (id, first_name, last_name, avatar_url, role, organization_id)
  VALUES (
    _user_id,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    new.raw_user_meta_data->>'avatar_url',
    _role,
    _default_org_id
  );

  -- Grant default permissions based on role
  INSERT INTO public.user_permissions (user_id, module) VALUES (_user_id, 'dashboard');
  
  -- Role-based default permissions
  IF _role = 'admin' THEN
    INSERT INTO public.user_permissions (user_id, module) 
    SELECT _user_id, unnest(ARRAY['projects', 'content', 'influencers', 'reporting', 'advertising', 'wallet', 'user_management']::user_module[]);
  ELSIF _role = 'brand' THEN
    INSERT INTO public.user_permissions (user_id, module) 
    SELECT _user_id, unnest(ARRAY['projects', 'content', 'influencers', 'reporting', 'advertising', 'wallet']::user_module[]);
  ELSIF _role = 'creator' THEN
    INSERT INTO public.user_permissions (user_id, module) 
    SELECT _user_id, unnest(ARRAY['projects', 'content', 'wallet']::user_module[]);
  ELSIF _role = 'influencer' THEN
    INSERT INTO public.user_permissions (user_id, module) 
    SELECT _user_id, unnest(ARRAY['campaigns', 'submit_content', 'wallet']::user_module[]);
  ELSIF _role = 'agency' THEN
    INSERT INTO public.user_permissions (user_id, module) 
    SELECT _user_id, unnest(ARRAY['projects', 'content', 'influencers', 'reporting', 'advertising', 'wallet']::user_module[]);
  END IF;

  -- Add user to Mailchimp (call edge function)
  BEGIN
    PERFORM 
      net.http_post(
        url := 'https://qmrgnlschrtfvenarovh.supabase.co/functions/v1/mailchimp-signup',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('request.jwt.claims', true)::json->>'token'
        ),
        body := jsonb_build_object(
          'email', new.email,
          'firstName', new.raw_user_meta_data->>'first_name',
          'lastName', new.raw_user_meta_data->>'last_name', 
          'userRole', _role::text,
          'organizationName', _org_name
        )
      );
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to add user to Mailchimp: %', SQLERRM;
  END;

  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to set up user profile/permissions for %: %', new.id, SQLERRM;
    RETURN new;
END;
$function$;