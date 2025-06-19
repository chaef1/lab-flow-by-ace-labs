
-- First, let's recreate the enums
DO $$ 
BEGIN
    -- Drop the enum if it exists (this will cascade to dependent objects)
    DROP TYPE IF EXISTS user_role CASCADE;
    
    -- Recreate the user_role enum
    CREATE TYPE user_role AS ENUM ('admin', 'creator', 'brand', 'agency', 'influencer');
    
    -- Also recreate user_module enum to ensure it exists
    DROP TYPE IF EXISTS user_module CASCADE;
    CREATE TYPE user_module AS ENUM ('dashboard', 'projects', 'content', 'influencers', 'reporting', 'advertising', 'wallet', 'user_management', 'campaigns', 'submit_content');
    
EXCEPTION
    WHEN OTHERS THEN
        -- If there's an error, let's continue anyway
        RAISE NOTICE 'Error recreating enums: %', SQLERRM;
END $$;

-- Add the role column to profiles if it doesn't exist
DO $$
BEGIN
    -- Check if role column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role user_role NOT NULL DEFAULT 'brand'::user_role;
    ELSE
        -- If it exists, update its type and default
        ALTER TABLE public.profiles 
            ALTER COLUMN role TYPE user_role USING role::text::user_role,
            ALTER COLUMN role SET DEFAULT 'brand'::user_role;
    END IF;
END $$;

-- Add the module column to user_permissions if it doesn't exist
DO $$
BEGIN
    -- Check if module column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_permissions' AND column_name = 'module') THEN
        ALTER TABLE public.user_permissions ADD COLUMN module user_module NOT NULL DEFAULT 'dashboard'::user_module;
    ELSE
        -- If it exists, update its type
        ALTER TABLE public.user_permissions 
            ALTER COLUMN module TYPE user_module USING module::text::user_module;
    END IF;
END $$;

-- Recreate the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Drop and recreate the trigger to ensure it's properly connected
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS policies exist for user_permissions
DROP POLICY IF EXISTS "Users can view their own permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Admins can manage all permissions" ON public.user_permissions;

CREATE POLICY "Users can view their own permissions" ON public.user_permissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all permissions" ON public.user_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
