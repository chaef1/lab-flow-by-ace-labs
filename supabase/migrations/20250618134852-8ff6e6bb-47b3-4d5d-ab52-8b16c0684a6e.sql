
-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company_name TEXT,
  contact_person TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  total_budget DECIMAL(15,2),
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'completed', 'cancelled')),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update projects table to link with campaigns
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

-- Create deliverables table
CREATE TABLE IF NOT EXISTS public.deliverables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('video_content', 'paid_media', 'content_creators', 'graphic_design', 'animation')),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'review', 'completed', 'cancelled')),
  budget DECIMAL(15,2),
  assigned_to UUID REFERENCES public.profiles(id),
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create video content specifications table
CREATE TABLE IF NOT EXISTS public.video_content_specs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deliverable_id UUID NOT NULL REFERENCES public.deliverables(id) ON DELETE CASCADE,
  platforms TEXT[] NOT NULL DEFAULT '{}', -- meta, tiktok, linkedin, youtube, shorts
  style TEXT,
  duration_seconds INTEGER,
  aspect_ratio TEXT,
  content_type TEXT CHECK (content_type IN ('organic', 'paid', 'both')),
  specifications JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create budget allocations table
CREATE TABLE IF NOT EXISTS public.budget_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  department TEXT NOT NULL CHECK (department IN ('content_creation', 'influencers', 'paid_media')),
  platform TEXT, -- meta, tiktok, linkedin, youtube, etc.
  allocated_amount DECIMAL(15,2) NOT NULL,
  spent_amount DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create additional assets table
CREATE TABLE IF NOT EXISTS public.additional_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('graphic_design', 'animation')),
  platform TEXT NOT NULL, -- meta, tiktok, linkedin, youtube, etc.
  dimensions TEXT, -- e.g., "1080x1080", "1920x1080"
  specifications JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'review', 'completed')),
  assigned_to UUID REFERENCES public.profiles(id),
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all clients" 
  ON public.clients 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create clients" 
  ON public.clients 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update clients" 
  ON public.clients 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Add RLS policies for campaigns
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all campaigns" 
  ON public.campaigns 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create campaigns" 
  ON public.campaigns 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update campaigns" 
  ON public.campaigns 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Add RLS policies for deliverables
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all deliverables" 
  ON public.deliverables 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can manage deliverables" 
  ON public.deliverables 
  FOR ALL 
  USING (auth.role() = 'authenticated');

-- Add RLS policies for video content specs
ALTER TABLE public.video_content_specs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all video content specs" 
  ON public.video_content_specs 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can manage video content specs" 
  ON public.video_content_specs 
  FOR ALL 
  USING (auth.role() = 'authenticated');

-- Add RLS policies for budget allocations
ALTER TABLE public.budget_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all budget allocations" 
  ON public.budget_allocations 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can manage budget allocations" 
  ON public.budget_allocations 
  FOR ALL 
  USING (auth.role() = 'authenticated');

-- Add RLS policies for additional assets
ALTER TABLE public.additional_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all additional assets" 
  ON public.additional_assets 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can manage additional assets" 
  ON public.additional_assets 
  FOR ALL 
  USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaigns_client_id ON public.campaigns(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_campaign_id ON public.projects(campaign_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_project_id ON public.deliverables(project_id);
CREATE INDEX IF NOT EXISTS idx_video_content_specs_deliverable_id ON public.video_content_specs(deliverable_id);
CREATE INDEX IF NOT EXISTS idx_budget_allocations_project_id ON public.budget_allocations(project_id);
CREATE INDEX IF NOT EXISTS idx_additional_assets_project_id ON public.additional_assets(project_id);
