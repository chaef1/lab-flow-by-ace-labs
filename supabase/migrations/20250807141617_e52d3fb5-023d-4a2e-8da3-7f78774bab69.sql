-- ===================================
-- STORYCLASH ENHANCED SYSTEM SCHEMA (Fixed)
-- ===================================

-- Creator profiles table (enhanced influencers)
ALTER TABLE influencers ADD COLUMN IF NOT EXISTS 
  audience_insights jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS top_posts jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS content_themes text[],
  ADD COLUMN IF NOT EXISTS past_campaigns_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS creator_score numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS relevance_score numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS brand_fit_score numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS performance_score numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS audience_alignment_score numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS location_country text,
  ADD COLUMN IF NOT EXISTS location_city text,
  ADD COLUMN IF NOT EXISTS language text DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS age_range text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS media_kit_url text,
  ADD COLUMN IF NOT EXISTS collaboration_history jsonb DEFAULT '[]';

-- Creator post data table for historical tracking
CREATE TABLE IF NOT EXISTS creator_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES influencers(id) ON DELETE CASCADE,
  platform text NOT NULL,
  post_id text NOT NULL,
  post_url text,
  caption text,
  media_urls text[],
  hashtags text[],
  mentions text[],
  posted_at timestamp with time zone,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  shares_count integer DEFAULT 0,
  views_count integer DEFAULT 0,
  engagement_rate numeric DEFAULT 0,
  post_type text, -- image, video, reel, story
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(creator_id, platform, post_id)
);

-- Enhanced campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS
  campaign_type text DEFAULT 'influencer',
  ADD COLUMN IF NOT EXISTS brief_document_url text,
  ADD COLUMN IF NOT EXISTS mood_board_urls text[],
  ADD COLUMN IF NOT EXISTS deliverables jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS target_audience jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS kpis jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS budget_breakdown jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS timeline jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS approval_workflow jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hashtags text[],
  ADD COLUMN IF NOT EXISTS mentions text[],
  ADD COLUMN IF NOT EXISTS utm_parameters jsonb DEFAULT '{}';

-- Campaign stages/status pipeline
CREATE TABLE IF NOT EXISTS campaign_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  stage_name text NOT NULL, -- discovery, outreach, briefing, approval, live, report
  stage_order integer NOT NULL,
  status text DEFAULT 'pending', -- pending, in_progress, completed, blocked
  assigned_to uuid,
  due_date timestamp with time zone,
  completed_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enhanced campaign_influencers with more workflow data
ALTER TABLE campaign_influencers ADD COLUMN IF NOT EXISTS
  outreach_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS outreach_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS response_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS brief_sent_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS content_submitted_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS content_approved_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS live_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS fee_agreed numeric,
  ADD COLUMN IF NOT EXISTS contract_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS deliverable_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS tracking_links jsonb DEFAULT '[]';

-- Campaign assets and content
CREATE TABLE IF NOT EXISTS campaign_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  influencer_id uuid REFERENCES influencers(id) ON DELETE CASCADE,
  asset_type text NOT NULL, -- brief, contract, media_kit, content, report
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  mime_type text,
  uploaded_by uuid,
  uploaded_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

-- Performance tracking
CREATE TABLE IF NOT EXISTS campaign_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  influencer_id uuid REFERENCES influencers(id),
  post_id uuid REFERENCES creator_posts(id),
  platform text NOT NULL,
  date_tracked date DEFAULT CURRENT_DATE,
  impressions integer DEFAULT 0,
  reach integer DEFAULT 0,
  engagement integer DEFAULT 0,
  clicks integer DEFAULT 0,
  conversions integer DEFAULT 0,
  emv numeric DEFAULT 0, -- Earned Media Value
  cpm numeric DEFAULT 0,
  cpc numeric DEFAULT 0,
  ctr numeric DEFAULT 0,
  roi numeric DEFAULT 0,
  custom_metrics jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Brand monitoring
CREATE TABLE IF NOT EXISTS brand_monitoring (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name text NOT NULL,
  brand_handles jsonb DEFAULT '{}', -- {instagram: "nike", tiktok: "nike"}
  monitoring_keywords text[],
  created_by uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Brand mentions and collaborations tracking
CREATE TABLE IF NOT EXISTS brand_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_monitoring_id uuid REFERENCES brand_monitoring(id) ON DELETE CASCADE,
  influencer_id uuid REFERENCES influencers(id),
  post_id uuid REFERENCES creator_posts(id),
  platform text NOT NULL,
  mention_type text, -- organic, sponsored, partnership
  detected_at timestamp with time zone DEFAULT now(),
  confidence_score numeric DEFAULT 0,
  metadata jsonb DEFAULT '{}'
);

-- Product matching for lookalike engine (without vector for now)
CREATE TABLE IF NOT EXISTS product_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_url text NOT NULL,
  product_name text,
  product_category text,
  product_description text,
  product_images text[],
  matched_influencers jsonb DEFAULT '[]', -- [{influencer_id, score, reason}]
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Email templates and outreach
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  template_type text NOT NULL, -- outreach, follow_up, brief, approval
  created_by uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Outreach history
CREATE TABLE IF NOT EXISTS outreach_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  influencer_id uuid REFERENCES influencers(id) ON DELETE CASCADE,
  email_template_id uuid REFERENCES email_templates(id),
  recipient_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  sent_at timestamp with time zone DEFAULT now(),
  opened_at timestamp with time zone,
  replied_at timestamp with time zone,
  status text DEFAULT 'sent' -- sent, opened, replied, bounced
);

-- Enable RLS on all new tables
ALTER TABLE creator_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view creator posts in their organization" ON creator_posts
  FOR SELECT USING ((SELECT organization_id FROM influencers WHERE id = creator_posts.creator_id) = get_user_organization_id() OR is_user_admin());

CREATE POLICY "Users can manage creator posts in their organization" ON creator_posts
  FOR ALL USING ((SELECT organization_id FROM influencers WHERE id = creator_posts.creator_id) = get_user_organization_id() OR is_user_admin());

CREATE POLICY "Users can view campaign stages for their campaigns" ON campaign_stages
  FOR SELECT USING ((SELECT organization_id FROM campaigns WHERE id = campaign_stages.campaign_id) = get_user_organization_id() OR is_user_admin());

CREATE POLICY "Users can manage campaign stages for their campaigns" ON campaign_stages
  FOR ALL USING ((SELECT organization_id FROM campaigns WHERE id = campaign_stages.campaign_id) = get_user_organization_id() OR is_user_admin());

CREATE POLICY "Users can view campaign assets for their campaigns" ON campaign_assets
  FOR SELECT USING ((SELECT organization_id FROM campaigns WHERE id = campaign_assets.campaign_id) = get_user_organization_id() OR is_user_admin());

CREATE POLICY "Users can manage campaign assets for their campaigns" ON campaign_assets
  FOR ALL USING ((SELECT organization_id FROM campaigns WHERE id = campaign_assets.campaign_id) = get_user_organization_id() OR is_user_admin());

CREATE POLICY "Users can view performance for their campaigns" ON campaign_performance
  FOR SELECT USING ((SELECT organization_id FROM campaigns WHERE id = campaign_performance.campaign_id) = get_user_organization_id() OR is_user_admin());

CREATE POLICY "Users can manage performance for their campaigns" ON campaign_performance
  FOR ALL USING ((SELECT organization_id FROM campaigns WHERE id = campaign_performance.campaign_id) = get_user_organization_id() OR is_user_admin());

CREATE POLICY "Users can view brand monitoring in their organization" ON brand_monitoring
  FOR SELECT USING (is_user_admin() OR created_by = auth.uid());

CREATE POLICY "Users can create brand monitoring" ON brand_monitoring
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their brand monitoring" ON brand_monitoring
  FOR UPDATE USING (created_by = auth.uid() OR is_user_admin());

CREATE POLICY "Users can view brand mentions" ON brand_mentions
  FOR SELECT USING (EXISTS (SELECT 1 FROM brand_monitoring WHERE id = brand_mentions.brand_monitoring_id AND (created_by = auth.uid() OR is_user_admin())));

CREATE POLICY "System can insert brand mentions" ON brand_mentions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view email templates in their organization" ON email_templates
  FOR SELECT USING (created_by = auth.uid() OR is_user_admin());

CREATE POLICY "Users can manage their email templates" ON email_templates
  FOR ALL USING (created_by = auth.uid() OR is_user_admin());

CREATE POLICY "Users can view outreach history for their campaigns" ON outreach_history
  FOR SELECT USING ((SELECT organization_id FROM campaigns WHERE id = outreach_history.campaign_id) = get_user_organization_id() OR is_user_admin());

CREATE POLICY "Users can manage outreach history for their campaigns" ON outreach_history
  FOR ALL USING ((SELECT organization_id FROM campaigns WHERE id = outreach_history.campaign_id) = get_user_organization_id() OR is_user_admin());

CREATE POLICY "Users can view product matches" ON product_matches
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create product matches" ON product_matches
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_creator_posts_creator_platform ON creator_posts(creator_id, platform);
CREATE INDEX IF NOT EXISTS idx_creator_posts_posted_at ON creator_posts(posted_at);
CREATE INDEX IF NOT EXISTS idx_campaign_stages_campaign_order ON campaign_stages(campaign_id, stage_order);
CREATE INDEX IF NOT EXISTS idx_campaign_performance_campaign_date ON campaign_performance(campaign_id, date_tracked);
CREATE INDEX IF NOT EXISTS idx_brand_mentions_brand_detected ON brand_mentions(brand_monitoring_id, detected_at);
CREATE INDEX IF NOT EXISTS idx_outreach_history_campaign_sent ON outreach_history(campaign_id, sent_at);

-- Update triggers for timestamps
CREATE TRIGGER update_creator_posts_updated_at
  BEFORE UPDATE ON creator_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_stages_updated_at
  BEFORE UPDATE ON campaign_stages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_performance_updated_at
  BEFORE UPDATE ON campaign_performance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_monitoring_updated_at
  BEFORE UPDATE ON brand_monitoring
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_matches_updated_at
  BEFORE UPDATE ON product_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();