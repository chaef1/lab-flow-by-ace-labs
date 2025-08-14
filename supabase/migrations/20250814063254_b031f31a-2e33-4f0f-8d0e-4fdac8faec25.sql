-- Add organization_id column to clients table for proper access control
ALTER TABLE public.clients 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- Update existing clients to belong to a default organization (Ace Labs)
UPDATE public.clients 
SET organization_id = (
  SELECT id FROM public.organizations WHERE name = 'Ace Labs' LIMIT 1
)
WHERE organization_id IS NULL;

-- Make organization_id NOT NULL after setting default values
ALTER TABLE public.clients 
ALTER COLUMN organization_id SET NOT NULL;

-- Drop the overly permissive policy that allows anyone to view all clients
DROP POLICY "Users can view all clients" ON public.clients;

-- Create secure organization-based policies
CREATE POLICY "Users can view clients in their organization" 
ON public.clients 
FOR SELECT 
USING ((organization_id = get_user_organization_id()) OR is_user_admin());

CREATE POLICY "Users can create clients in their organization" 
ON public.clients 
FOR INSERT 
WITH CHECK ((organization_id = get_user_organization_id()) OR is_user_admin());

-- Update existing policies to be organization-based
DROP POLICY "Authenticated users can create clients" ON public.clients;
DROP POLICY "Authenticated users can update clients" ON public.clients;

CREATE POLICY "Users can update clients in their organization" 
ON public.clients 
FOR UPDATE 
USING ((organization_id = get_user_organization_id()) OR is_user_admin());