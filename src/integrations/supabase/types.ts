export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      campaigns: {
        Row: {
          client_id: string
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: string
          total_budget: number | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: string
          total_budget?: number | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: string
          total_budget?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
      influencers: {
        Row: {
          bio: string | null
          categories: string[] | null
          created_at: string | null
          engagement_rate: number | null
          follower_count: number | null
          id: string
          instagram_handle: string | null
          portfolio_images: string[] | null
          rate_per_post: number | null
          tiktok_handle: string | null
          updated_at: string | null
          youtube_handle: string | null
        }
        Insert: {
          bio?: string | null
          categories?: string[] | null
          created_at?: string | null
          engagement_rate?: number | null
          follower_count?: number | null
          id: string
          instagram_handle?: string | null
          portfolio_images?: string[] | null
          rate_per_post?: number | null
          tiktok_handle?: string | null
          updated_at?: string | null
          youtube_handle?: string | null
        }
        Update: {
          bio?: string | null
          categories?: string[] | null
          created_at?: string | null
          engagement_rate?: number | null
          follower_count?: number | null
          id?: string
          instagram_handle?: string | null
          portfolio_images?: string[] | null
          rate_per_post?: number | null
          tiktok_handle?: string | null
          updated_at?: string | null
          youtube_handle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_influencers_profile"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
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
        ]
      }
      social_media_searches: {
        Row: {
          id: string
          platform: string
          timestamp: string
          user_id: string
          username: string
        }
        Insert: {
          id?: string
          platform: string
          timestamp?: string
          user_id: string
          username: string
        }
        Update: {
          id?: string
          platform?: string
          timestamp?: string
          user_id?: string
          username?: string
        }
        Relationships: []
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
      [_ in never]: never
    }
    Enums: {
      project_status:
        | "conceptualisation"
        | "pre-production"
        | "production"
        | "post-production"
        | "submission"
        | "completed"
      user_role: "admin" | "creator" | "brand" | "agency" | "influencer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
      user_role: ["admin", "creator", "brand", "agency", "influencer"],
    },
  },
} as const
