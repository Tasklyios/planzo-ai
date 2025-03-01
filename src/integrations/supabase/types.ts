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
      planner_columns: {
        Row: {
          created_at: string
          id: string
          order: number
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order?: number
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order?: number
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string
          business_niche: string | null
          content_niche: string | null
          content_personality: string | null
          content_style: string | null
          created_at: string
          id: string
          onboarding_completed: boolean
          posting_platforms: string[] | null
          product_niche: string | null
          target_audience: string | null
        }
        Insert: {
          account_type: string
          business_niche?: string | null
          content_niche?: string | null
          content_personality?: string | null
          content_style?: string | null
          created_at?: string
          id: string
          onboarding_completed?: boolean
          posting_platforms?: string[] | null
          product_niche?: string | null
          target_audience?: string | null
        }
        Update: {
          account_type?: string
          business_niche?: string | null
          content_niche?: string | null
          content_personality?: string | null
          content_style?: string | null
          created_at?: string
          id?: string
          onboarding_completed?: boolean
          posting_platforms?: string[] | null
          product_niche?: string | null
          target_audience?: string | null
        }
        Relationships: []
      }
      scheduled_content: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          platform: string
          scheduled_for: string
          status: string | null
          symbol: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          platform: string
          scheduled_for: string
          status?: string | null
          symbol?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          platform?: string
          scheduled_for?: string
          status?: string | null
          symbol?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      script_hooks: {
        Row: {
          category: string
          created_at: string
          description: string | null
          hook: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          hook: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          hook?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      script_structures: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          structure: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          structure: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          structure?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scripts: {
        Row: {
          content: string
          created_at: string
          id: string
          idea_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          idea_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          idea_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scripts_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "video_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_daily_usage: {
        Row: {
          date: string
          id: string
          ideas_generated: number | null
          scripts_generated: number | null
          user_id: string
        }
        Insert: {
          date?: string
          id?: string
          ideas_generated?: number | null
          scripts_generated?: number | null
          user_id: string
        }
        Update: {
          date?: string
          id?: string
          ideas_generated?: number | null
          scripts_generated?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          user_id?: string
        }
        Relationships: []
      }
      video_ideas: {
        Row: {
          category: string | null
          color: string | null
          created_at: string | null
          description: string
          id: string
          is_ad: boolean | null
          is_saved: boolean | null
          platform: string | null
          scheduled_for: string | null
          script: string | null
          status: string | null
          symbol: string | null
          tags: string[] | null
          title: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          description: string
          id?: string
          is_ad?: boolean | null
          is_saved?: boolean | null
          platform?: string | null
          scheduled_for?: string | null
          script?: string | null
          status?: string | null
          symbol?: string | null
          tags?: string[] | null
          title: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          description?: string
          id?: string
          is_ad?: boolean | null
          is_saved?: boolean | null
          platform?: string | null
          scheduled_for?: string | null
          script?: string | null
          status?: string | null
          symbol?: string | null
          tags?: string[] | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_increment_usage: {
        Args: {
          p_user_id: string
          p_action: string
        }
        Returns: boolean
      }
      get_hooks: {
        Args: {
          user_id_param: string
        }
        Returns: {
          category: string
          created_at: string
          description: string | null
          hook: string
          id: string
          updated_at: string
          user_id: string
        }[]
      }
      get_structures: {
        Args: {
          user_id_param: string
        }
        Returns: {
          created_at: string
          description: string | null
          id: string
          name: string
          structure: string
          updated_at: string
          user_id: string
        }[]
      }
      link_stripe_customer: {
        Args: {
          p_email: string
          p_stripe_customer_id: string
          p_stripe_subscription_id: string
          p_tier: Database["public"]["Enums"]["subscription_tier"]
          p_current_period_end: string
        }
        Returns: undefined
      }
    }
    Enums: {
      subscription_tier: "free" | "pro" | "business" | "plus"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
