-- Phase 1: Critical Security Fixes

-- 1. Fix function search_path security issue for handle_new_user function
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  _role user_role;
  _user_id uuid;
BEGIN
  -- Determine role based on email
  IF new.email LIKE '%@acelabs.co.za' THEN
    _role := 'admin';
  ELSE
    -- Get role from metadata, default to brand
    _role := COALESCE((new.raw_user_meta_data->>'role')::user_role, 'brand'::user_role);
  END IF;

  _user_id := new.id;

  -- Insert into profiles with proper error handling
  INSERT INTO public.profiles (id, first_name, last_name, avatar_url, role)
  VALUES (
    _user_id,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    new.raw_user_meta_data->>'avatar_url',
    _role
  );

  -- Grant default permissions based on role
  -- All users get dashboard access
  INSERT INTO public.user_permissions (user_id, module) VALUES (_user_id, 'dashboard');
  
  -- Role-based default permissions
  IF _role = 'admin' THEN
    -- Admins get access to all modules
    INSERT INTO public.user_permissions (user_id, module) 
    SELECT _user_id, unnest(ARRAY['projects', 'content', 'influencers', 'reporting', 'advertising', 'wallet', 'user_management']::user_module[]);
  ELSIF _role = 'brand' THEN
    -- Brands get access to core features
    INSERT INTO public.user_permissions (user_id, module) 
    SELECT _user_id, unnest(ARRAY['projects', 'content', 'influencers', 'reporting', 'advertising', 'wallet']::user_module[]);
  ELSIF _role = 'creator' THEN
    -- Creators get limited access
    INSERT INTO public.user_permissions (user_id, module) 
    SELECT _user_id, unnest(ARRAY['projects', 'content', 'wallet']::user_module[]);
  ELSIF _role = 'influencer' THEN
    -- Influencers get campaign and content access
    INSERT INTO public.user_permissions (user_id, module) 
    SELECT _user_id, unnest(ARRAY['campaigns', 'submit_content', 'wallet']::user_module[]);
  ELSIF _role = 'agency' THEN
    -- Agencies get broad access but not user management
    INSERT INTO public.user_permissions (user_id, module) 
    SELECT _user_id, unnest(ARRAY['projects', 'content', 'influencers', 'reporting', 'advertising', 'wallet']::user_module[]);
  END IF;

  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Failed to set up user profile/permissions for %: %', new.id, SQLERRM;
    RETURN new;
END;
$function$;

-- 2. Fix search_path for enable_instagram_webhook_subscription function
DROP FUNCTION IF EXISTS public.enable_instagram_webhook_subscription(text, text, text[]);

CREATE OR REPLACE FUNCTION public.enable_instagram_webhook_subscription(access_token text, instagram_account_id text, webhook_fields text[])
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  result JSON;
BEGIN
  -- This function would make API calls to enable webhook subscriptions
  -- Implementation would depend on your specific requirements
  -- For now, returning a placeholder response
  SELECT json_build_object('success', true, 'message', 'Webhook subscription function created') INTO result;
  RETURN result;
END;
$function$;

-- 3. Fix search_path for notify_team_of_client_comment function
DROP FUNCTION IF EXISTS public.notify_team_of_client_comment();

CREATE OR REPLACE FUNCTION public.notify_team_of_client_comment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  -- This is a placeholder for notification logic
  -- In a real implementation, you might insert into a notifications table
  -- or trigger an email/push notification
  RETURN NEW;
END;
$function$;

-- 4. Add missing RLS policies for tables that have RLS enabled but no policies

-- Check which tables need policies by looking at tables with RLS enabled
-- First, let's add policies for client_access table
CREATE POLICY "Users can view client access based on role" 
ON public.client_access 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'agency')
  )
);

CREATE POLICY "Admins and agencies can manage client access" 
ON public.client_access 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'agency')
  )
);

-- Add policies for project_assignments if missing any specific restrictions
-- (Currently has permissive policies, but let's make them more secure)
DROP POLICY IF EXISTS "Enable read access for project assignments" ON public.project_assignments;
DROP POLICY IF EXISTS "Enable insert for project assignments" ON public.project_assignments;
DROP POLICY IF EXISTS "Enable update for project assignments" ON public.project_assignments;
DROP POLICY IF EXISTS "Enable delete for project assignments" ON public.project_assignments;

CREATE POLICY "Users can view project assignments for their projects" 
ON public.project_assignments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_assignments.project_id 
    AND (user_id = auth.uid() OR auth.uid() = assigned_to)
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'agency')
  )
);

CREATE POLICY "Project owners and admins can manage assignments" 
ON public.project_assignments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_assignments.project_id 
    AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'agency')
  )
);