-- Create organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Add organization_id to profiles table
ALTER TABLE public.profiles ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- Add organization_id to influencers table
ALTER TABLE public.influencers ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- Add organization_id to other relevant tables
ALTER TABLE public.campaigns ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.projects ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.social_media_searches ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- Insert default organization "Ace Labs"
INSERT INTO public.organizations (name, description) VALUES ('Ace Labs', 'Default organization for existing users');

-- Get the Ace Labs organization ID and assign all existing users to it
DO $$
DECLARE
    ace_labs_id UUID;
BEGIN
    SELECT id INTO ace_labs_id FROM public.organizations WHERE name = 'Ace Labs' LIMIT 1;
    
    -- Update all existing profiles to belong to Ace Labs
    UPDATE public.profiles SET organization_id = ace_labs_id WHERE organization_id IS NULL;
    
    -- Update all existing influencers to belong to Ace Labs
    UPDATE public.influencers SET organization_id = ace_labs_id WHERE organization_id IS NULL;
    
    -- Update all existing campaigns to belong to Ace Labs
    UPDATE public.campaigns SET organization_id = ace_labs_id WHERE organization_id IS NULL;
    
    -- Update all existing projects to belong to Ace Labs
    UPDATE public.projects SET organization_id = ace_labs_id WHERE organization_id IS NULL;
    
    -- Update all existing social media searches to belong to Ace Labs
    UPDATE public.social_media_searches SET organization_id = ace_labs_id WHERE organization_id IS NULL;
END $$;

-- Make organization_id NOT NULL for profiles (required for data isolation)
ALTER TABLE public.profiles ALTER COLUMN organization_id SET NOT NULL;

-- Create function to get user's organization ID
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Organization RLS policies
CREATE POLICY "Users can view their organization" 
ON public.organizations 
FOR SELECT 
USING (id = public.get_user_organization_id() OR public.is_user_admin());

CREATE POLICY "Admins can manage organizations" 
ON public.organizations 
FOR ALL 
USING (public.is_user_admin());

-- Update influencers RLS policies for organization isolation
DROP POLICY IF EXISTS "Public can view influencers" ON public.influencers;
DROP POLICY IF EXISTS "Authenticated users can add influencers" ON public.influencers;
DROP POLICY IF EXISTS "Authenticated users can update influencers" ON public.influencers;

CREATE POLICY "Users can view influencers in their organization" 
ON public.influencers 
FOR SELECT 
USING (organization_id = public.get_user_organization_id() OR public.is_user_admin());

CREATE POLICY "Users can add influencers to their organization" 
ON public.influencers 
FOR INSERT 
WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can update influencers in their organization" 
ON public.influencers 
FOR UPDATE 
USING (organization_id = public.get_user_organization_id() OR public.is_user_admin());

-- Update campaigns RLS policies
DROP POLICY IF EXISTS "Users can view all campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated users can create campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated users can update campaigns" ON public.campaigns;

CREATE POLICY "Users can view campaigns in their organization" 
ON public.campaigns 
FOR SELECT 
USING (organization_id = public.get_user_organization_id() OR public.is_user_admin());

CREATE POLICY "Users can create campaigns in their organization" 
ON public.campaigns 
FOR INSERT 
WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can update campaigns in their organization" 
ON public.campaigns 
FOR UPDATE 
USING (organization_id = public.get_user_organization_id() OR public.is_user_admin());

-- Update projects RLS policies
DROP POLICY IF EXISTS "Users can view all projects" ON public.projects;

CREATE POLICY "Users can view projects in their organization" 
ON public.projects 
FOR SELECT 
USING (organization_id = public.get_user_organization_id() OR public.is_user_admin());

-- Update social media searches RLS policies
DROP POLICY IF EXISTS "select_own_searches" ON public.social_media_searches;

CREATE POLICY "Users can view searches in their organization" 
ON public.social_media_searches 
FOR SELECT 
USING (organization_id = public.get_user_organization_id() OR user_id = auth.uid());

CREATE POLICY "Users can create searches in their organization" 
ON public.social_media_searches 
FOR INSERT 
WITH CHECK (organization_id = public.get_user_organization_id() AND user_id = auth.uid());

-- Update profiles RLS policies to allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_user_admin());

CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (public.is_user_admin());

-- Update the user creation trigger to assign new users to default organization
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
BEGIN
  -- Get default organization (Ace Labs)
  SELECT id INTO _default_org_id FROM public.organizations WHERE name = 'Ace Labs' LIMIT 1;
  
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

  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to set up user profile/permissions for %: %', new.id, SQLERRM;
    RETURN new;
END;
$function$;

-- Update timestamp trigger for organizations
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();