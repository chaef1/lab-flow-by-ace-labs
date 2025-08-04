-- Create influencer pools table
CREATE TABLE public.influencer_pools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create influencer pool members table (many-to-many relationship)
CREATE TABLE public.influencer_pool_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pool_id UUID NOT NULL REFERENCES public.influencer_pools(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES public.influencers(id) ON DELETE CASCADE,
  added_by UUID NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(pool_id, influencer_id)
);

-- Create campaign influencers table for direct campaign assignments
CREATE TABLE public.campaign_influencers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES public.influencers(id) ON DELETE CASCADE,
  added_by UUID NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending',
  UNIQUE(campaign_id, influencer_id)
);

-- Enable RLS on all tables
ALTER TABLE public.influencer_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_pool_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_influencers ENABLE ROW LEVEL SECURITY;

-- RLS policies for influencer_pools
CREATE POLICY "Authenticated users can view all pools" 
  ON public.influencer_pools 
  FOR SELECT 
  USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can create pools" 
  ON public.influencer_pools 
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update their pools" 
  ON public.influencer_pools 
  FOR UPDATE 
  USING (auth.uid() = created_by);

CREATE POLICY "Authenticated users can delete their pools" 
  ON public.influencer_pools 
  FOR DELETE 
  USING (auth.uid() = created_by);

-- RLS policies for influencer_pool_members
CREATE POLICY "Authenticated users can view pool members" 
  ON public.influencer_pool_members 
  FOR SELECT 
  USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can add to pools" 
  ON public.influencer_pool_members 
  FOR INSERT 
  WITH CHECK (auth.uid() = added_by);

CREATE POLICY "Authenticated users can remove from pools" 
  ON public.influencer_pool_members 
  FOR DELETE 
  USING (auth.uid() = added_by OR EXISTS (
    SELECT 1 FROM public.influencer_pools 
    WHERE id = pool_id AND created_by = auth.uid()
  ));

-- RLS policies for campaign_influencers
CREATE POLICY "Authenticated users can view campaign influencers" 
  ON public.campaign_influencers 
  FOR SELECT 
  USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can add to campaigns" 
  ON public.campaign_influencers 
  FOR INSERT 
  WITH CHECK (auth.uid() = added_by);

CREATE POLICY "Authenticated users can update campaign influencers" 
  ON public.campaign_influencers 
  FOR UPDATE 
  USING (auth.uid() = added_by OR EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE id = campaign_id AND created_by = auth.uid()
  ));

CREATE POLICY "Authenticated users can remove from campaigns" 
  ON public.campaign_influencers 
  FOR DELETE 
  USING (auth.uid() = added_by OR EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE id = campaign_id AND created_by = auth.uid()
  ));

-- Add indexes for better performance
CREATE INDEX idx_influencer_pool_members_pool_id ON public.influencer_pool_members(pool_id);
CREATE INDEX idx_influencer_pool_members_influencer_id ON public.influencer_pool_members(influencer_id);
CREATE INDEX idx_campaign_influencers_campaign_id ON public.campaign_influencers(campaign_id);
CREATE INDEX idx_campaign_influencers_influencer_id ON public.campaign_influencers(influencer_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates on influencer_pools
CREATE TRIGGER update_influencer_pools_updated_at
  BEFORE UPDATE ON public.influencer_pools
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();