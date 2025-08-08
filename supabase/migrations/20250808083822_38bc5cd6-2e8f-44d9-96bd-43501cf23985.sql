-- Fix organization assignment and data isolation

-- First, create organizations for different email domains
INSERT INTO public.organizations (id, name, description) 
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'CMDX', 'CMDX Organization'),
  ('22222222-2222-2222-2222-222222222222', 'Default Organization', 'Default organization for other users')
ON CONFLICT (id) DO NOTHING;

-- Update handle_new_user function to assign users to correct organizations based on email domain
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _role user_role;
  _user_id uuid;
  _org_id uuid;
  _org_name text;
  _user_email text;
BEGIN
  _user_id := new.id;
  _user_email := new.email;

  -- Determine organization based on email domain
  IF _user_email LIKE '%@acelabs.co.za' THEN
    SELECT id, name INTO _org_id, _org_name FROM public.organizations WHERE name = 'Ace Labs' LIMIT 1;
    _role := 'admin';
  ELSIF _user_email LIKE '%@cmdx.co.za' THEN
    SELECT id, name INTO _org_id, _org_name FROM public.organizations WHERE name = 'CMDX' LIMIT 1;
    _role := 'brand';
  ELSE
    SELECT id, name INTO _org_id, _org_name FROM public.organizations WHERE name = 'Default Organization' LIMIT 1;
    _role := COALESCE((new.raw_user_meta_data->>'role')::user_role, 'brand'::user_role);
  END IF;

  -- Fallback to Ace Labs if no organization found
  IF _org_id IS NULL THEN
    SELECT id, name INTO _org_id, _org_name FROM public.organizations WHERE name = 'Ace Labs' LIMIT 1;
  END IF;

  -- Insert into profiles with correct organization
  INSERT INTO public.profiles (id, first_name, last_name, avatar_url, role, organization_id)
  VALUES (
    _user_id,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    new.raw_user_meta_data->>'avatar_url',
    _role,
    _org_id
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
$$;

-- Update existing cmdx.co.za users to correct organization
UPDATE public.profiles 
SET organization_id = (SELECT id FROM public.organizations WHERE name = 'CMDX' LIMIT 1)
WHERE id IN (
  SELECT profiles.id 
  FROM profiles 
  JOIN auth.users ON profiles.id = auth.users.id 
  WHERE auth.users.email LIKE '%@cmdx.co.za'
);

-- Ensure all profiles have an organization_id (fix any null values)
UPDATE public.profiles 
SET organization_id = (SELECT id FROM public.organizations WHERE name = 'Ace Labs' LIMIT 1)
WHERE organization_id IS NULL;

-- Add additional RLS policies for tables that might be missing them
DROP POLICY IF EXISTS "Users can only view their organization data" ON public.profiles;
CREATE POLICY "Users can only view their organization data" 
ON public.profiles 
FOR SELECT 
USING (organization_id = get_user_organization_id() OR is_user_admin());

-- Ensure campaigns table has proper organization isolation
DROP POLICY IF EXISTS "Users can only access campaigns in their organization" ON public.campaigns;
CREATE POLICY "Users can only access campaigns in their organization" 
ON public.campaigns 
FOR ALL 
USING (organization_id = get_user_organization_id() OR is_user_admin());

-- Ensure all social media searches are organization-scoped
DROP POLICY IF EXISTS "Users can only access their organization searches" ON public.social_media_searches;
CREATE POLICY "Users can only access their organization searches" 
ON public.social_media_searches 
FOR ALL 
USING (organization_id = get_user_organization_id() OR is_user_admin());

-- Fix any existing data that might have wrong organization_id
UPDATE public.social_media_searches 
SET organization_id = (
  SELECT profiles.organization_id 
  FROM profiles 
  WHERE profiles.id = social_media_searches.user_id
)
WHERE organization_id IS NULL OR organization_id != (
  SELECT profiles.organization_id 
  FROM profiles 
  WHERE profiles.id = social_media_searches.user_id
);