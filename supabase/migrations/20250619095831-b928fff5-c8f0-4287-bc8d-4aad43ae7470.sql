
-- First, let's check if a user with this email already exists and update their role
-- If they don't exist, we'll need to handle this through the signup process

-- Update the handle_new_user function to specifically assign admin role to chae@acelabs.co.za
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

-- If the user already exists, update their role to admin
UPDATE public.profiles 
SET role = 'admin'::user_role 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'chae@acelabs.co.za'
);
