export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      advertising_requests: {
        Row: {
          company_name: string
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          message: string | null
          phone: string
          status: string
          updated_at: string
        }
        Insert: {
          company_name: string
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          message?: string | null
          phone: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          message?: string | null
          phone?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      banks: {
        Row: {
          bank_info_link: string | null
          created_at: string
          description: string | null
          down_payment: number | null
          final_payment: number | null
          finance_amount_percentage: number | null
          id: string
          interest_rate: number | null
          logo_url: string | null
          maximum_amount: number | null
          maximum_duration: number | null
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          bank_info_link?: string | null
          created_at?: string
          description?: string | null
          down_payment?: number | null
          final_payment?: number | null
          finance_amount_percentage?: number | null
          id?: string
          interest_rate?: number | null
          logo_url?: string | null
          maximum_amount?: number | null
          maximum_duration?: number | null
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          bank_info_link?: string | null
          created_at?: string
          description?: string | null
          down_payment?: number | null
          final_payment?: number | null
          finance_amount_percentage?: number | null
          id?: string
          interest_rate?: number | null
          logo_url?: string | null
          maximum_amount?: number | null
          maximum_duration?: number | null
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          banner_type: string
          created_at: string
          end_date: string | null
          id: string
          image_url: string | null
          link_url: string | null
          name: string
          page_name: string
          page_position: number
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          banner_type?: string
          created_at?: string
          end_date?: string | null
          id?: string
          image_url?: string | null
          link_url?: string | null
          name: string
          page_name?: string
          page_position?: number
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          banner_type?: string
          created_at?: string
          end_date?: string | null
          id?: string
          image_url?: string | null
          link_url?: string | null
          name?: string
          page_name?: string
          page_position?: number
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          about: string | null
          company_type: Database["public"]["Enums"]["company_type"] | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          email: string
          id: string
          is_verified: boolean
          languages: string[] | null
          logo_url: string | null
          membership: Database["public"]["Enums"]["membership_type"]
          name: string
          neighbourhood: string | null
          owner_user_id: string | null
          package_end_date: string | null
          phone: string | null
          pin_location: string | null
          province: string | null
          registration_number: string | null
          service_areas: string[] | null
          town: string | null
          updated_at: string
          verification_token: string | null
          whatsapp: string | null
        }
        Insert: {
          about?: string | null
          company_type?: Database["public"]["Enums"]["company_type"] | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          is_verified?: boolean
          languages?: string[] | null
          logo_url?: string | null
          membership?: Database["public"]["Enums"]["membership_type"]
          name: string
          neighbourhood?: string | null
          owner_user_id?: string | null
          package_end_date?: string | null
          phone?: string | null
          pin_location?: string | null
          province?: string | null
          registration_number?: string | null
          service_areas?: string[] | null
          town?: string | null
          updated_at?: string
          verification_token?: string | null
          whatsapp?: string | null
        }
        Update: {
          about?: string | null
          company_type?: Database["public"]["Enums"]["company_type"] | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          is_verified?: boolean
          languages?: string[] | null
          logo_url?: string | null
          membership?: Database["public"]["Enums"]["membership_type"]
          name?: string
          neighbourhood?: string | null
          owner_user_id?: string | null
          package_end_date?: string | null
          phone?: string | null
          pin_location?: string | null
          province?: string | null
          registration_number?: string | null
          service_areas?: string[] | null
          town?: string | null
          updated_at?: string
          verification_token?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          display_on_homepage: boolean
          event_date: string | null
          event_type: string
          id: string
          images: string[] | null
          listing_id: string
          location: string | null
          organizer: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          display_on_homepage?: boolean
          event_date?: string | null
          event_type?: string
          id?: string
          images?: string[] | null
          listing_id?: string
          location?: string | null
          organizer?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          display_on_homepage?: boolean
          event_date?: string | null
          event_type?: string
          id?: string
          images?: string[] | null
          listing_id?: string
          location?: string | null
          organizer?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_packages: {
        Row: {
          annual_price: number
          created_at: string
          has_company_agent_search: boolean
          has_company_profile: boolean
          has_home_logo: boolean
          has_property_requests: boolean
          id: string
          max_agents: number
          max_events: number
          max_projects: number
          max_properties: number
          monthly_price: number
          name: string
          package_type: string
          quarterly_price: number
          semiannual_price: number
          sort_order: number
          tagline: string | null
          updated_at: string
        }
        Insert: {
          annual_price?: number
          created_at?: string
          has_company_agent_search?: boolean
          has_company_profile?: boolean
          has_home_logo?: boolean
          has_property_requests?: boolean
          id?: string
          max_agents?: number
          max_events?: number
          max_projects?: number
          max_properties?: number
          monthly_price?: number
          name: string
          package_type: string
          quarterly_price?: number
          semiannual_price?: number
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          annual_price?: number
          created_at?: string
          has_company_agent_search?: boolean
          has_company_profile?: boolean
          has_home_logo?: boolean
          has_property_requests?: boolean
          id?: string
          max_agents?: number
          max_events?: number
          max_projects?: number
          max_properties?: number
          monthly_price?: number
          name?: string
          package_type?: string
          quarterly_price?: number
          semiannual_price?: number
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          company_id: string | null
          completion_date: string | null
          created_at: string
          currency: string | null
          description: string | null
          developer: string | null
          display_on_homepage: boolean
          id: string
          images: string[] | null
          listing_id: string
          location: string | null
          max_price: number | null
          max_units: number | null
          min_price: number | null
          min_units: number | null
          project_status: string
          project_type: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          completion_date?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          developer?: string | null
          display_on_homepage?: boolean
          id?: string
          images?: string[] | null
          listing_id?: string
          location?: string | null
          max_price?: number | null
          max_units?: number | null
          min_price?: number | null
          min_units?: number | null
          project_status?: string
          project_type?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          completion_date?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          developer?: string | null
          display_on_homepage?: boolean
          id?: string
          images?: string[] | null
          listing_id?: string
          location?: string | null
          max_price?: number | null
          max_units?: number | null
          min_price?: number | null
          min_units?: number | null
          project_status?: string
          project_type?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          area: number | null
          area_unit: string | null
          bathrooms: number | null
          bedrooms: number | null
          company_id: string | null
          created_at: string
          currency: string | null
          description: string | null
          display_on_homepage: boolean
          id: string
          images: string[] | null
          listing_id: string
          location: string | null
          price: number | null
          property_purpose: string
          property_status: string
          property_type: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          area?: number | null
          area_unit?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          company_id?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          display_on_homepage?: boolean
          id?: string
          images?: string[] | null
          listing_id?: string
          location?: string | null
          price?: number | null
          property_purpose?: string
          property_status?: string
          property_type?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          area?: number | null
          area_unit?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          company_id?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          display_on_homepage?: boolean
          id?: string
          images?: string[] | null
          listing_id?: string
          location?: string | null
          price?: number | null
          property_purpose?: string
          property_status?: string
          property_type?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      company_type:
        | "real_estate_agency"
        | "developer"
        | "brokerage"
        | "property_management"
        | "consulting"
      membership_type: "basic" | "lite" | "plus" | "pro"
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
      app_role: ["admin", "moderator", "user"],
      company_type: [
        "real_estate_agency",
        "developer",
        "brokerage",
        "property_management",
        "consulting",
      ],
      membership_type: ["basic", "lite", "plus", "pro"],
    },
  },
} as const
