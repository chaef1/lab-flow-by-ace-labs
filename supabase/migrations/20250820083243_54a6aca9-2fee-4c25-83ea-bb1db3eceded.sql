-- Create a guest user profile with admin privileges
-- This allows temporary guest access to the platform
INSERT INTO public.profiles (id, first_name, last_name, role, organization_id)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Guest',
  'User',
  'admin'::user_role,
  (SELECT id FROM public.organizations WHERE name = 'Ace Labs' LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  organization_id = EXCLUDED.organization_id;

-- Grant full permissions to the guest user
INSERT INTO public.user_permissions (user_id, module) 
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  unnest(ARRAY['dashboard', 'projects', 'content', 'influencers', 'reporting', 'advertising', 'wallet', 'user_management']::user_module[])
ON CONFLICT (user_id, module) DO NOTHING;