export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      additional_assets: {
        Row: {
          asset_type: string
          assigned_to: string | null
          created_at: string
          dimensions: string | null
          due_date: string | null
          id: string
          platform: string
          project_id: string
          specifications: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          asset_type: string
          assigned_to?: string | null
          created_at?: string
          dimensions?: string | null
          due_date?: string | null
          id?: string
          platform: string
          project_id: string
          specifications?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          asset_type?: string
          assigned_to?: string | null
          created_at?: string
          dimensions?: string | null
          due_date?: string | null
          id?: string
          platform?: string
          project_id?: string
          specifications?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "additional_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_type: string | null
          id: string
          project_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_type?: string | null
          id?: string
          project_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_type?: string | null
          id?: string
          project_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_mentions: {
        Row: {
          brand_monitoring_id: string | null
          confidence_score: number | null
          detected_at: string | null
          id: string
          influencer_id: string | null
          mention_type: string | null
          metadata: Json | null
          platform: string
          post_id: string | null
        }
        Insert: {
          brand_monitoring_id?: string | null
          confidence_score?: number | null
          detected_at?: string | null
          id?: string
          influencer_id?: string | null
          mention_type?: string | null
          metadata?: Json | null
          platform: string
          post_id?: string | null
        }
        Update: {
          brand_monitoring_id?: string | null
          confidence_score?: number | null
          detected_at?: string | null
          id?: string
          influencer_id?: string | null
          mention_type?: string | null
          metadata?: Json | null
          platform?: string
          post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_mentions_brand_monitoring_id_fkey"
            columns: ["brand_monitoring_id"]
            isOneToOne: false
            referencedRelation: "brand_monitoring"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_mentions_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_mentions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "creator_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_monitoring: {
        Row: {
          brand_handles: Json | null
          brand_name: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          monitoring_keywords: string[] | null
          updated_at: string | null
        }
        Insert: {
          brand_handles?: Json | null
          brand_name: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          monitoring_keywords?: string[] | null
          updated_at?: string | null
        }
        Update: {
          brand_handles?: Json | null
          brand_name?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          monitoring_keywords?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      budget_allocations: {
        Row: {
          allocated_amount: number
          created_at: string
          department: string
          id: string
          platform: string | null
          project_id: string
          spent_amount: number | null
          updated_at: string
        }
        Insert: {
          allocated_amount: number
          created_at?: string
          department: string
          id?: string
          platform?: string | null
          project_id: string
          spent_amount?: number | null
          updated_at?: string
        }
        Update: {
          allocated_amount?: number
          created_at?: string
          department?: string
          id?: string
          platform?: string | null
          project_id?: string
          spent_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_allocations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_assets: {
        Row: {
          asset_type: string
          campaign_id: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          influencer_id: string | null
          metadata: Json | null
          mime_type: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          asset_type: string
          campaign_id?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          influencer_id?: string | null
          metadata?: Json | null
          mime_type?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          asset_type?: string
          campaign_id?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          influencer_id?: string | null
          metadata?: Json | null
          mime_type?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_assets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_assets_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_content: {
        Row: {
          content_type: string
          content_url: string
          feedback: string | null
          id: string
          influencer_id: string | null
          project_id: string | null
          status: string
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          content_type: string
          content_url: string
          feedback?: string | null
          id?: string
          influencer_id?: string | null
          project_id?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          content_type?: string
          content_url?: string
          feedback?: string | null
          id?: string
          influencer_id?: string | null
          project_id?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_content_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_content_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_influencers: {
        Row: {
          added_at: string
          added_by: string
          brief_sent_date: string | null
          campaign_id: string
          content_approved_date: string | null
          content_submitted_date: string | null
          contract_status: string | null
          deliverable_status: string | null
          fee_agreed: number | null
          id: string
          influencer_id: string
          live_date: string | null
          notes: string | null
          outreach_date: string | null
          outreach_status: string | null
          response_date: string | null
          status: string
          tracking_links: Json | null
        }
        Insert: {
          added_at?: string
          added_by: string
          brief_sent_date?: string | null
          campaign_id: string
          content_approved_date?: string | null
          content_submitted_date?: string | null
          contract_status?: string | null
          deliverable_status?: string | null
          fee_agreed?: number | null
          id?: string
          influencer_id: string
          live_date?: string | null
          notes?: string | null
          outreach_date?: string | null
          outreach_status?: string | null
          response_date?: string | null
          status?: string
          tracking_links?: Json | null
        }
        Update: {
          added_at?: string
          added_by?: string
          brief_sent_date?: string | null
          campaign_id?: string
          content_approved_date?: string | null
          content_submitted_date?: string | null
          contract_status?: string | null
          deliverable_status?: string | null
          fee_agreed?: number | null
          id?: string
          influencer_id?: string
          live_date?: string | null
          notes?: string | null
          outreach_date?: string | null
          outreach_status?: string | null
          response_date?: string | null
          status?: string
          tracking_links?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_influencers_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_influencers_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_performance: {
        Row: {
          campaign_id: string | null
          clicks: number | null
          conversions: number | null
          cpc: number | null
          cpm: number | null
          created_at: string | null
          ctr: number | null
          custom_metrics: Json | null
          date_tracked: string | null
          emv: number | null
          engagement: number | null
          id: string
          impressions: number | null
          influencer_id: string | null
          platform: string
          post_id: string | null
          reach: number | null
          roi: number | null
          updated_at: string | null
        }
        Insert: {
          campaign_id?: string | null
          clicks?: number | null
          conversions?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string | null
          ctr?: number | null
          custom_metrics?: Json | null
          date_tracked?: string | null
          emv?: number | null
          engagement?: number | null
          id?: string
          impressions?: number | null
          influencer_id?: string | null
          platform: string
          post_id?: string | null
          reach?: number | null
          roi?: number | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string | null
          clicks?: number | null
          conversions?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string | null
          ctr?: number | null
          custom_metrics?: Json | null
          date_tracked?: string | null
          emv?: number | null
          engagement?: number | null
          id?: string
          impressions?: number | null
          influencer_id?: string | null
          platform?: string
          post_id?: string | null
          reach?: number | null
          roi?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_performance_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_performance_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_performance_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "creator_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_stages: {
        Row: {
          assigned_to: string | null
          campaign_id: string | null
          completed_at: string | null
          created_at: string | null
          due_date: string | null
          id: string
          notes: string | null
          stage_name: string
          stage_order: number
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          campaign_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          stage_name: string
          stage_order: number
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          campaign_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          stage_name?: string
          stage_order?: number
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_stages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          approval_workflow: Json | null
          brief_document_url: string | null
          budget_breakdown: Json | null
          campaign_type: string | null
          client_id: string
          created_at: string
          created_by: string
          deliverables: Json | null
          description: string | null
          end_date: string | null
          hashtags: string[] | null
          id: string
          kpis: Json | null
          mentions: string[] | null
          mood_board_urls: string[] | null
          name: string
          organization_id: string | null
          start_date: string | null
          status: string
          target_audience: Json | null
          timeline: Json | null
          total_budget: number | null
          updated_at: string
          utm_parameters: Json | null
        }
        Insert: {
          approval_workflow?: Json | null
          brief_document_url?: string | null
          budget_breakdown?: Json | null
          campaign_type?: string | null
          client_id: string
          created_at?: string
          created_by: string
          deliverables?: Json | null
          description?: string | null
          end_date?: string | null
          hashtags?: string[] | null
          id?: string
          kpis?: Json | null
          mentions?: string[] | null
          mood_board_urls?: string[] | null
          name: string
          organization_id?: string | null
          start_date?: string | null
          status?: string
          target_audience?: Json | null
          timeline?: Json | null
          total_budget?: number | null
          updated_at?: string
          utm_parameters?: Json | null
        }
        Update: {
          approval_workflow?: Json | null
          brief_document_url?: string | null
          budget_breakdown?: Json | null
          campaign_type?: string | null
          client_id?: string
          created_at?: string
          created_by?: string
          deliverables?: Json | null
          description?: string | null
          end_date?: string | null
          hashtags?: string[] | null
          id?: string
          kpis?: Json | null
          mentions?: string[] | null
          mood_board_urls?: string[] | null
          name?: string
          organization_id?: string | null
          start_date?: string | null
          status?: string
          target_audience?: Json | null
          timeline?: Json | null
          total_budget?: number | null
          updated_at?: string
          utm_parameters?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_access: {
        Row: {
          client_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          user_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          user_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_access_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_comments: {
        Row: {
          client_id: string | null
          comment: string
          created_at: string | null
          created_by: string | null
          id: string
          project_id: string | null
          status: string | null
        }
        Insert: {
          client_id?: string | null
          comment: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          project_id?: string | null
          status?: string | null
        }
        Update: {
          client_id?: string | null
          comment?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          project_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_comments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_client_comments_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          brief: string | null
          company_name: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          brief?: string | null
          company_name?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          brief?: string | null
          company_name?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      creator_posts: {
        Row: {
          caption: string | null
          comments_count: number | null
          created_at: string | null
          creator_id: string | null
          engagement_rate: number | null
          hashtags: string[] | null
          id: string
          likes_count: number | null
          media_urls: string[] | null
          mentions: string[] | null
          platform: string
          post_id: string
          post_type: string | null
          post_url: string | null
          posted_at: string | null
          shares_count: number | null
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          caption?: string | null
          comments_count?: number | null
          created_at?: string | null
          creator_id?: string | null
          engagement_rate?: number | null
          hashtags?: string[] | null
          id?: string
          likes_count?: number | null
          media_urls?: string[] | null
          mentions?: string[] | null
          platform: string
          post_id: string
          post_type?: string | null
          post_url?: string | null
          posted_at?: string | null
          shares_count?: number | null
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          caption?: string | null
          comments_count?: number | null
          created_at?: string | null
          creator_id?: string | null
          engagement_rate?: number | null
          hashtags?: string[] | null
          id?: string
          likes_count?: number | null
          media_urls?: string[] | null
          mentions?: string[] | null
          platform?: string
          post_id?: string
          post_type?: string | null
          post_url?: string | null
          posted_at?: string | null
          shares_count?: number | null
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_posts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverables: {
        Row: {
          assigned_to: string | null
          budget: number | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          name: string
          project_id: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          budget?: number | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          project_id: string
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          budget?: number | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          project_id?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string
          file_type: string
          id: string
          metadata: Json | null
          name: string
          size: number
          status: string
          storage_path: string
          type: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          category: string
          file_type: string
          id?: string
          metadata?: Json | null
          name: string
          size: number
          status?: string
          storage_path: string
          type: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          category?: string
          file_type?: string
          id?: string
          metadata?: Json | null
          name?: string
          size?: number
          status?: string
          storage_path?: string
          type?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          subject: string
          template_type: string
          updated_at: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          template_type: string
          updated_at?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          template_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      influencer_pool_members: {
        Row: {
          added_at: string
          added_by: string
          id: string
          influencer_id: string
          pool_id: string
        }
        Insert: {
          added_at?: string
          added_by: string
          id?: string
          influencer_id: string
          pool_id: string
        }
        Update: {
          added_at?: string
          added_by?: string
          id?: string
          influencer_id?: string
          pool_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "influencer_pool_members_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_pool_members_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "influencer_pools"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_pools: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      influencers: {
        Row: {
          account_type: string | null
          age_range: string | null
          audience_alignment_score: number | null
          audience_insights: Json | null
          avg_comments: number | null
          avg_likes: number | null
          bio: string | null
          brand_fit_score: number | null
          categories: string[] | null
          collaboration_history: Json | null
          contact_email: string | null
          content_themes: string[] | null
          created_at: string | null
          creator_score: number | null
          engagement_rate: number | null
          follower_count: number | null
          full_name: string | null
          gender: string | null
          id: string
          instagram_handle: string | null
          language: string | null
          location: string | null
          location_city: string | null
          location_country: string | null
          media_kit_url: string | null
          organization_id: string
          past_campaigns_count: number | null
          performance_score: number | null
          platform: string
          portfolio_images: string[] | null
          profile_picture_url: string | null
          rate_per_post: number | null
          relevance_score: number | null
          tiktok_handle: string | null
          top_posts: Json | null
          updated_at: string | null
          username: string | null
          verified: boolean | null
          website: string | null
          youtube_handle: string | null
        }
        Insert: {
          account_type?: string | null
          age_range?: string | null
          audience_alignment_score?: number | null
          audience_insights?: Json | null
          avg_comments?: number | null
          avg_likes?: number | null
          bio?: string | null
          brand_fit_score?: number | null
          categories?: string[] | null
          collaboration_history?: Json | null
          contact_email?: string | null
          content_themes?: string[] | null
          created_at?: string | null
          creator_score?: number | null
          engagement_rate?: number | null
          follower_count?: number | null
          full_name?: string | null
          gender?: string | null
          id: string
          instagram_handle?: string | null
          language?: string | null
          location?: string | null
          location_city?: string | null
          location_country?: string | null
          media_kit_url?: string | null
          organization_id: string
          past_campaigns_count?: number | null
          performance_score?: number | null
          platform?: string
          portfolio_images?: string[] | null
          profile_picture_url?: string | null
          rate_per_post?: number | null
          relevance_score?: number | null
          tiktok_handle?: string | null
          top_posts?: Json | null
          updated_at?: string | null
          username?: string | null
          verified?: boolean | null
          website?: string | null
          youtube_handle?: string | null
        }
        Update: {
          account_type?: string | null
          age_range?: string | null
          audience_alignment_score?: number | null
          audience_insights?: Json | null
          avg_comments?: number | null
          avg_likes?: number | null
          bio?: string | null
          brand_fit_score?: number | null
          categories?: string[] | null
          collaboration_history?: Json | null
          contact_email?: string | null
          content_themes?: string[] | null
          created_at?: string | null
          creator_score?: number | null
          engagement_rate?: number | null
          follower_count?: number | null
          full_name?: string | null
          gender?: string | null
          id?: string
          instagram_handle?: string | null
          language?: string | null
          location?: string | null
          location_city?: string | null
          location_country?: string | null
          media_kit_url?: string | null
          organization_id?: string
          past_campaigns_count?: number | null
          performance_score?: number | null
          platform?: string
          portfolio_images?: string[] | null
          profile_picture_url?: string | null
          rate_per_post?: number | null
          relevance_score?: number | null
          tiktok_handle?: string | null
          top_posts?: Json | null
          updated_at?: string | null
          username?: string | null
          verified?: boolean | null
          website?: string | null
          youtube_handle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "influencers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_webhook_events: {
        Row: {
          created_at: string
          event_data: Json
          event_type: string
          id: string
          instagram_account_id: string
          processed: boolean
          timestamp: string
        }
        Insert: {
          created_at?: string
          event_data?: Json
          event_type: string
          id?: string
          instagram_account_id: string
          processed?: boolean
          timestamp: string
        }
        Update: {
          created_at?: string
          event_data?: Json
          event_type?: string
          id?: string
          instagram_account_id?: string
          processed?: boolean
          timestamp?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      outreach_history: {
        Row: {
          body: string
          campaign_id: string | null
          email_template_id: string | null
          id: string
          influencer_id: string | null
          opened_at: string | null
          recipient_email: string
          replied_at: string | null
          sent_at: string | null
          status: string | null
          subject: string
        }
        Insert: {
          body: string
          campaign_id?: string | null
          email_template_id?: string | null
          id?: string
          influencer_id?: string | null
          opened_at?: string | null
          recipient_email: string
          replied_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
        }
        Update: {
          body?: string
          campaign_id?: string | null
          email_template_id?: string | null
          id?: string
          influencer_id?: string | null
          opened_at?: string | null
          recipient_email?: string
          replied_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_history_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_history_email_template_id_fkey"
            columns: ["email_template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_history_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_matches: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          matched_influencers: Json | null
          organization_id: string | null
          product_category: string | null
          product_description: string | null
          product_images: string[] | null
          product_name: string | null
          product_url: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          matched_influencers?: Json | null
          organization_id?: string | null
          product_category?: string | null
          product_description?: string | null
          product_images?: string[] | null
          product_name?: string | null
          product_url: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          matched_influencers?: Json | null
          organization_id?: string | null
          product_category?: string | null
          product_description?: string | null
          product_images?: string[] | null
          product_name?: string | null
          product_url?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_matches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          ayrshare_profile_key: string | null
          created_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          organization_id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          ayrshare_profile_key?: string | null
          created_at?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          ayrshare_profile_key?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      project_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          assigned_to: string | null
          department: string | null
          id: string
          project_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          department?: string | null
          id?: string
          project_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          department?: string | null
          id?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_project_assignments_assigned_by"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_project_assignments_assigned_to"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          brand_id: string | null
          campaign_id: string | null
          client: string | null
          client_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          members: Json | null
          organization_id: string | null
          shoot_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          brand_id?: string | null
          campaign_id?: string | null
          client?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          members?: Json | null
          organization_id?: string | null
          shoot_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          brand_id?: string | null
          campaign_id?: string | null
          client?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          members?: Json | null
          organization_id?: string | null
          shoot_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media_searches: {
        Row: {
          id: string
          organization_id: string
          platform: string
          timestamp: string
          user_id: string
          username: string
        }
        Insert: {
          id?: string
          organization_id: string
          platform: string
          timestamp?: string
          user_id: string
          username: string
        }
        Update: {
          id?: string
          organization_id?: string
          platform?: string
          timestamp?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_media_searches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed: boolean
          created_at: string
          due_date: string | null
          id: string
          position: number
          project_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed?: boolean
          created_at?: string
          due_date?: string | null
          id?: string
          position?: number
          project_id: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed?: boolean
          created_at?: string
          due_date?: string | null
          id?: string
          position?: number
          project_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          module: Database["public"]["Enums"]["user_module"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          module?: Database["public"]["Enums"]["user_module"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          module?: Database["public"]["Enums"]["user_module"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      video_content_specs: {
        Row: {
          aspect_ratio: string | null
          content_type: string | null
          created_at: string
          deliverable_id: string
          duration_seconds: number | null
          id: string
          platforms: string[]
          specifications: Json | null
          style: string | null
        }
        Insert: {
          aspect_ratio?: string | null
          content_type?: string | null
          created_at?: string
          deliverable_id: string
          duration_seconds?: number | null
          id?: string
          platforms?: string[]
          specifications?: Json | null
          style?: string | null
        }
        Update: {
          aspect_ratio?: string | null
          content_type?: string | null
          created_at?: string
          deliverable_id?: string
          duration_seconds?: number | null
          id?: string
          platforms?: string[]
          specifications?: Json | null
          style?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_content_specs_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      enable_instagram_webhook_subscription: {
        Args: {
          access_token: string
          instagram_account_id: string
          webhook_fields: string[]
        }
        Returns: Json
      }
      get_user_organization_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      project_status:
        | "conceptualisation"
        | "pre-production"
        | "production"
        | "post-production"
        | "submission"
        | "completed"
      user_module:
        | "dashboard"
        | "projects"
        | "content"
        | "influencers"
        | "reporting"
        | "advertising"
        | "wallet"
        | "user_management"
        | "campaigns"
        | "submit_content"
      user_role: "admin" | "creator" | "brand" | "agency" | "influencer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      project_status: [
        "conceptualisation",
        "pre-production",
        "production",
        "post-production",
        "submission",
        "completed",
      ],
      user_module: [
        "dashboard",
        "projects",
        "content",
        "influencers",
        "reporting",
        "advertising",
        "wallet",
        "user_management",
        "campaigns",
        "submit_content",
      ],
      user_role: ["admin", "creator", "brand", "agency", "influencer"],
    },
  },
} as const
