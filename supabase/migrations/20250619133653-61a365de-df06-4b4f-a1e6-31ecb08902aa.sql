
-- Ensure the user_role enum exists with all necessary roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'creator', 'brand', 'agency', 'influencer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create a modules enum for user permissions
DO $$ BEGIN
    CREATE TYPE user_module AS ENUM ('dashboard', 'projects', 'content', 'influencers', 'reporting', 'advertising', 'wallet', 'user_management', 'campaigns', 'submit_content');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create a user_permissions table to track which modules each user can access
CREATE TABLE IF NOT EXISTS public.user_permissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    module user_module NOT NULL,
    granted_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, module)
);

-- Enable RLS on user_permissions
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for user_permissions
CREATE POLICY "Users can view their own permissions" ON public.user_permissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all permissions" ON public.user_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Ensure the profiles table has the correct structure
ALTER TABLE public.profiles 
    ALTER COLUMN role SET DEFAULT 'brand'::user_role;

-- Update the handle_new_user function to be more robust
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
    _role := COALESCE(new.raw_user_meta_data->>'role', 'brand')::user_role;
  END IF;

  -- Insert into profiles with proper error handling
  INSERT INTO public.profiles (id, first_name, last_name, avatar_url, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    new.raw_user_meta_data->>'avatar_url',
    _role
  );

  -- Grant default permissions based on role
  _user_id := new.id;
  
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

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
