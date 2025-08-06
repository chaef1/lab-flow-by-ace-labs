-- Update the handle_new_user function to also add users to Mailchimp
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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