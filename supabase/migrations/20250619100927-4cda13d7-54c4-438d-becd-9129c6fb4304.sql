
-- First, ensure the user_role enum exists (recreate if needed)
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('admin', 'creator', 'brand', 'agency', 'influencer');

-- Drop and recreate the profiles table with proper structure
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  avatar_url text,
  role user_role NOT NULL DEFAULT 'brand',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Recreate the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  _role user_role;
BEGIN
  -- Determine role based on email - all acelabs.co.za domains get admin
  IF new.email LIKE '%@acelabs.co.za' THEN
    _role := 'admin';
  ELSE
    -- Default to brand for all other users
    _role := 'brand';
  END IF;

  -- Insert into profiles with error handling
  INSERT INTO public.profiles (id, first_name, last_name, avatar_url, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    new.raw_user_meta_data->>'avatar_url',
    _role
  );
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Failed to create profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$function$;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update ALL existing acelabs.co.za users to admin role
-- First, create profiles for any acelabs.co.za users that don't have them
INSERT INTO public.profiles (id, first_name, last_name, role)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'first_name', split_part(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data->>'last_name', ''),
  'admin'::user_role
FROM auth.users au
WHERE au.email LIKE '%@acelabs.co.za'
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = au.id)
ON CONFLICT (id) DO NOTHING;

-- Update existing acelabs.co.za profiles to admin
UPDATE public.profiles 
SET role = 'admin'::user_role, updated_at = now()
WHERE id IN (
  SELECT au.id 
  FROM auth.users au 
  WHERE au.email LIKE '%@acelabs.co.za'
);
