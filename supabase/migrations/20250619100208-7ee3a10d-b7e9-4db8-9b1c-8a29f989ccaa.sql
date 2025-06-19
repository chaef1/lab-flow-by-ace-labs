
-- Create the user_role enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'creator', 'brand', 'agency', 'influencer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Now recreate the handle_new_user function with the correct enum
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  _role text;
BEGIN
  -- Determine role based on email
  IF new.email = 'chae@acelabs.co.za' THEN
    _role := 'admin';
  ELSIF new.email LIKE '%@acelabs.co.za' THEN
    _role := 'admin';
  ELSE
    -- Default to brand, will be updated by admin if needed
    _role := 'brand';
  END IF;

  INSERT INTO public.profiles (id, first_name, last_name, avatar_url, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'avatar_url',
    _role::user_role
  );
  RETURN new;
END;
$function$;

-- Update existing user if they exist
UPDATE public.profiles 
SET role = 'admin'::user_role 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'chae@acelabs.co.za'
);
