-- Create Dictionary table for caching Modash dictionaries
CREATE TABLE public.dictionaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('location', 'interest', 'brand', 'language')),
  entry_id TEXT NOT NULL,
  name TEXT NOT NULL,
  meta JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index on kind and entry_id
CREATE UNIQUE INDEX idx_dictionaries_kind_entry_id ON public.dictionaries(kind, entry_id);

-- Create Creator table for storing creator data
CREATE TABLE public.creators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'youtube')),
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  full_name TEXT,
  profile_pic_url TEXT,
  followers INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  avg_likes INTEGER DEFAULT 0,
  avg_views INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  top_audience_country TEXT,
  top_audience_city TEXT,
  has_contact_details BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index on platform and user_id
CREATE UNIQUE INDEX idx_creators_platform_user_id ON public.creators(platform, user_id);

-- Create SearchQuery table for analytics
CREATE TABLE public.search_queries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payload JSONB NOT NULL,
  page INTEGER NOT NULL DEFAULT 1,
  results_count INTEGER DEFAULT 0,
  estimated_credits DECIMAL(10,4) DEFAULT 0,
  actual_credits DECIMAL(10,4) DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Lists table for creator lists
CREATE TABLE public.lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ListItems table for list members
CREATE TABLE public.list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  snapshot_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.dictionaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dictionaries (read-only for authenticated users)
CREATE POLICY "Authenticated users can view dictionaries" 
ON public.dictionaries FOR SELECT 
USING (auth.role() = 'authenticated');

-- RLS Policies for creators (read-only for authenticated users)
CREATE POLICY "Authenticated users can view creators" 
ON public.creators FOR SELECT 
USING (auth.role() = 'authenticated');

-- RLS Policies for search_queries (users can view their own)
CREATE POLICY "Users can view their own search queries" 
ON public.search_queries FOR SELECT 
USING (created_by = auth.uid());

CREATE POLICY "Users can create search queries" 
ON public.search_queries FOR INSERT 
WITH CHECK (created_by = auth.uid());

-- RLS Policies for lists (users can manage their own)
CREATE POLICY "Users can view their own lists" 
ON public.lists FOR SELECT 
USING (created_by = auth.uid());

CREATE POLICY "Users can create their own lists" 
ON public.lists FOR INSERT 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own lists" 
ON public.lists FOR UPDATE 
USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own lists" 
ON public.lists FOR DELETE 
USING (created_by = auth.uid());

-- RLS Policies for list_items (users can manage items in their lists)
CREATE POLICY "Users can view items in their lists" 
ON public.list_items FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.lists 
  WHERE lists.id = list_items.list_id 
  AND lists.created_by = auth.uid()
));

CREATE POLICY "Users can add items to their lists" 
ON public.list_items FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.lists 
  WHERE lists.id = list_items.list_id 
  AND lists.created_by = auth.uid()
));

CREATE POLICY "Users can delete items from their lists" 
ON public.list_items FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.lists 
  WHERE lists.id = list_items.list_id 
  AND lists.created_by = auth.uid()
));

-- Create triggers for updated_at
CREATE TRIGGER update_creators_updated_at
BEFORE UPDATE ON public.creators
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lists_updated_at
BEFORE UPDATE ON public.lists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();