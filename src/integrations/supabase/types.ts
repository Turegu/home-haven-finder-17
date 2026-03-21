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
      admin_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      agent_followers: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_followers_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          avatar_url: string | null
          company_id: string
          created_at: string
          credit_balance: number
          description: string | null
          designation: string | null
          email: string
          id: string
          languages: string[] | null
          name: string
          phone: string | null
          registration_number: string | null
          service_areas: string[] | null
          status: string
          updated_at: string
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_id: string
          created_at?: string
          credit_balance?: number
          description?: string | null
          designation?: string | null
          email: string
          id?: string
          languages?: string[] | null
          name: string
          phone?: string | null
          registration_number?: string | null
          service_areas?: string[] | null
          status?: string
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_id?: string
          created_at?: string
          credit_balance?: number
          description?: string | null
          designation?: string | null
          email?: string
          id?: string
          languages?: string[] | null
          name?: string
          phone?: string | null
          registration_number?: string | null
          service_areas?: string[] | null
          status?: string
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
          banner_text: string | null
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
          banner_text?: string | null
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
          banner_text?: string | null
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
      blog_translations: {
        Row: {
          blog_id: string
          created_at: string
          description: string
          id: string
          language_code: string
          title: string
          updated_at: string
        }
        Insert: {
          blog_id: string
          created_at?: string
          description?: string
          id?: string
          language_code: string
          title?: string
          updated_at?: string
        }
        Update: {
          blog_id?: string
          created_at?: string
          description?: string
          id?: string
          language_code?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_translations_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
        ]
      }
      blogs: {
        Row: {
          author: string | null
          created_at: string
          id: string
          image_url: string | null
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      cms_pages: {
        Row: {
          content: Json
          created_at: string
          id: string
          page_slug: string
          page_title: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          page_slug: string
          page_title: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          page_slug?: string
          page_title?: string
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
          credit_balance: number
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
          credit_balance?: number
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
          credit_balance?: number
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
      company_announcements: {
        Row: {
          announcement_type: string
          company_id: string
          created_at: string
          event_id: string | null
          id: string
          message: string
          title: string
        }
        Insert: {
          announcement_type?: string
          company_id: string
          created_at?: string
          event_id?: string | null
          id?: string
          message: string
          title: string
        }
        Update: {
          announcement_type?: string
          company_id?: string
          created_at?: string
          event_id?: string | null
          id?: string
          message?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_announcements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_announcements_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      company_followers: {
        Row: {
          company_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_followers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_inbox: {
        Row: {
          budget: string | null
          company_id: string
          created_at: string
          email: string
          full_name: string
          id: string
          inbox_type: string
          is_seen: boolean
          message: string | null
          phone: string | null
          project_id: string | null
          property_id: string | null
        }
        Insert: {
          budget?: string | null
          company_id: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          inbox_type?: string
          is_seen?: boolean
          message?: string | null
          phone?: string | null
          project_id?: string | null
          property_id?: string | null
        }
        Update: {
          budget?: string | null
          company_id?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          inbox_type?: string
          is_seen?: boolean
          message?: string | null
          phone?: string | null
          project_id?: string | null
          property_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_inbox_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_inbox_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_inbox_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      company_notifications: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          notification_type: string
          posted_by: string | null
          title: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          notification_type?: string
          posted_by?: string | null
          title: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          notification_type?: string
          posted_by?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_pattern_codes: {
        Row: {
          company_id: string
          created_at: string
          id: string
          pattern_code: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          pattern_code?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          pattern_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_pattern_codes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      currencies: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          sort_order: number
          status: string
          symbol: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          status?: string
          symbol: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          status?: string
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body_fields: Json
          created_at: string
          id: string
          is_active: boolean
          subject: string
          template_key: string
          template_name: string
          updated_at: string
        }
        Insert: {
          body_fields?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          subject?: string
          template_key: string
          template_name: string
          updated_at?: string
        }
        Update: {
          body_fields?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          subject?: string
          template_key?: string
          template_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          agent_id: string | null
          company_id: string | null
          created_at: string
          currency: string | null
          description: string | null
          display_on_homepage: boolean
          entry_type: string
          event_date: string | null
          event_end_date: string | null
          event_type: string
          id: string
          images: string[] | null
          listing_id: string
          location: string | null
          logo_url: string | null
          neighbourhood: string | null
          organizer: string | null
          pdf_catalogue_url: string | null
          pin_location: string | null
          price: number | null
          province: string | null
          status: string
          title: string
          town: string | null
          updated_at: string
          video_link: string | null
        }
        Insert: {
          agent_id?: string | null
          company_id?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          display_on_homepage?: boolean
          entry_type?: string
          event_date?: string | null
          event_end_date?: string | null
          event_type?: string
          id?: string
          images?: string[] | null
          listing_id?: string
          location?: string | null
          logo_url?: string | null
          neighbourhood?: string | null
          organizer?: string | null
          pdf_catalogue_url?: string | null
          pin_location?: string | null
          price?: number | null
          province?: string | null
          status?: string
          title: string
          town?: string | null
          updated_at?: string
          video_link?: string | null
        }
        Update: {
          agent_id?: string | null
          company_id?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          display_on_homepage?: boolean
          entry_type?: string
          event_date?: string | null
          event_end_date?: string | null
          event_type?: string
          id?: string
          images?: string[] | null
          listing_id?: string
          location?: string | null
          logo_url?: string | null
          neighbourhood?: string | null
          organizer?: string | null
          pdf_catalogue_url?: string | null
          pin_location?: string | null
          price?: number | null
          province?: string | null
          status?: string
          title?: string
          town?: string | null
          updated_at?: string
          video_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      exterior_amenities: {
        Row: {
          created_at: string
          id: string
          sort_order: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      faq_translations: {
        Row: {
          answer: string
          created_at: string
          faq_id: string
          id: string
          language_code: string
          question: string
          updated_at: string
        }
        Insert: {
          answer?: string
          created_at?: string
          faq_id: string
          id?: string
          language_code: string
          question?: string
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          faq_id?: string
          id?: string
          language_code?: string
          question?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "faq_translations_faq_id_fkey"
            columns: ["faq_id"]
            isOneToOne: false
            referencedRelation: "faqs"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          created_at: string
          id: string
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      featured_locations: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          link_url: string | null
          name: string
          sort_order: number
          status: string
          tagline: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          link_url?: string | null
          name: string
          sort_order?: number
          status?: string
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          link_url?: string | null
          name?: string
          sort_order?: number
          status?: string
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      filter_categories: {
        Row: {
          applies_to: string[]
          category_key: string
          created_at: string
          description: string | null
          id: string
          sort_order: number
          status: string
          title: string
          translations: Json
          updated_at: string
        }
        Insert: {
          applies_to?: string[]
          category_key: string
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          status?: string
          title: string
          translations?: Json
          updated_at?: string
        }
        Update: {
          applies_to?: string[]
          category_key?: string
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          status?: string
          title?: string
          translations?: Json
          updated_at?: string
        }
        Relationships: []
      }
      filter_options: {
        Row: {
          category_id: string
          created_at: string
          id: string
          sort_order: number
          status: string
          title: string
          translations: Json
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          sort_order?: number
          status?: string
          title: string
          translations?: Json
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          sort_order?: number
          status?: string
          title?: string
          translations?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "filter_options_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "filter_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      interior_amenities: {
        Row: {
          created_at: string
          id: string
          sort_order: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      languages: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      location_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          country: string
          created_at: string
          district: string
          district_ar: string | null
          id: string
          neighborhood: string
          neighborhood_ar: string | null
          province: string
          province_ar: string | null
          status: string
          updated_at: string
        }
        Insert: {
          country?: string
          created_at?: string
          district: string
          district_ar?: string | null
          id?: string
          neighborhood: string
          neighborhood_ar?: string | null
          province: string
          province_ar?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          country?: string
          created_at?: string
          district?: string
          district_ar?: string | null
          id?: string
          neighborhood?: string
          neighborhood_ar?: string | null
          province?: string
          province_ar?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
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
      partners: {
        Row: {
          created_at: string
          id: string
          link_url: string | null
          logo_url: string | null
          name: string
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          link_url?: string | null
          logo_url?: string | null
          name?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          link_url?: string | null
          logo_url?: string | null
          name?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          preferred_area_unit: string | null
          preferred_currency: string | null
          preferred_language: string | null
          show_phone: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          preferred_area_unit?: string | null
          preferred_currency?: string | null
          preferred_language?: string | null
          show_phone?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          preferred_area_unit?: string | null
          preferred_currency?: string | null
          preferred_language?: string | null
          show_phone?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_statuses: {
        Row: {
          created_at: string
          id: string
          sort_order: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_types: {
        Row: {
          created_at: string
          id: string
          sort_order: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_units: {
        Row: {
          area: number | null
          area_unit: string | null
          bathrooms: number | null
          car_parking: number | null
          created_at: string
          currency: string | null
          exterior_amenities: string[] | null
          id: string
          images: string[] | null
          interior_amenities: string[] | null
          price: number | null
          project_id: string
          rooms: string | null
          status: string
          unit_name: string
          unit_type: string
          updated_at: string
        }
        Insert: {
          area?: number | null
          area_unit?: string | null
          bathrooms?: number | null
          car_parking?: number | null
          created_at?: string
          currency?: string | null
          exterior_amenities?: string[] | null
          id?: string
          images?: string[] | null
          interior_amenities?: string[] | null
          price?: number | null
          project_id: string
          rooms?: string | null
          status?: string
          unit_name: string
          unit_type?: string
          updated_at?: string
        }
        Update: {
          area?: number | null
          area_unit?: string | null
          bathrooms?: number | null
          car_parking?: number | null
          created_at?: string
          currency?: string | null
          exterior_amenities?: string[] | null
          id?: string
          images?: string[] | null
          interior_amenities?: string[] | null
          price?: number | null
          project_id?: string
          rooms?: string | null
          status?: string
          unit_name?: string
          unit_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_units_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          advertising_tags: string[] | null
          agent_id: string | null
          area_unit: string | null
          company_id: string | null
          completion_date: string | null
          created_at: string
          currency: string | null
          description: string | null
          developer: string | null
          developer_logo_url: string | null
          display_on_homepage: boolean
          exterior_amenities: string[] | null
          id: string
          images: string[] | null
          interior_amenities: string[] | null
          listing_id: string
          location: string | null
          logo_url: string | null
          max_area: number | null
          max_price: number | null
          max_units: number | null
          min_area: number | null
          min_price: number | null
          min_units: number | null
          neighbourhood: string | null
          pdf_catalogue_url: string | null
          pin_location: string | null
          plans: string[] | null
          project_status: string
          project_type: string
          property_classification: string | null
          province: string | null
          status: string
          tagline: string | null
          title: string
          town: string | null
          updated_at: string
          video_link: string | null
          view_360_link: string | null
        }
        Insert: {
          advertising_tags?: string[] | null
          agent_id?: string | null
          area_unit?: string | null
          company_id?: string | null
          completion_date?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          developer?: string | null
          developer_logo_url?: string | null
          display_on_homepage?: boolean
          exterior_amenities?: string[] | null
          id?: string
          images?: string[] | null
          interior_amenities?: string[] | null
          listing_id?: string
          location?: string | null
          logo_url?: string | null
          max_area?: number | null
          max_price?: number | null
          max_units?: number | null
          min_area?: number | null
          min_price?: number | null
          min_units?: number | null
          neighbourhood?: string | null
          pdf_catalogue_url?: string | null
          pin_location?: string | null
          plans?: string[] | null
          project_status?: string
          project_type?: string
          property_classification?: string | null
          province?: string | null
          status?: string
          tagline?: string | null
          title: string
          town?: string | null
          updated_at?: string
          video_link?: string | null
          view_360_link?: string | null
        }
        Update: {
          advertising_tags?: string[] | null
          agent_id?: string | null
          area_unit?: string | null
          company_id?: string | null
          completion_date?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          developer?: string | null
          developer_logo_url?: string | null
          display_on_homepage?: boolean
          exterior_amenities?: string[] | null
          id?: string
          images?: string[] | null
          interior_amenities?: string[] | null
          listing_id?: string
          location?: string | null
          logo_url?: string | null
          max_area?: number | null
          max_price?: number | null
          max_units?: number | null
          min_area?: number | null
          min_price?: number | null
          min_units?: number | null
          neighbourhood?: string | null
          pdf_catalogue_url?: string | null
          pin_location?: string | null
          plans?: string[] | null
          project_status?: string
          project_type?: string
          property_classification?: string | null
          province?: string | null
          status?: string
          tagline?: string | null
          title?: string
          town?: string | null
          updated_at?: string
          video_link?: string | null
          view_360_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
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
          advertising_tags: string[] | null
          agent_id: string | null
          area: number | null
          area_unit: string | null
          bathrooms: number | null
          bedrooms: number | null
          company_id: string | null
          created_at: string
          currency: string | null
          description: string | null
          display_on_homepage: boolean
          exterior_amenities: string[] | null
          floor_level: string | null
          furniture: string | null
          id: string
          images: string[] | null
          interior_amenities: string[] | null
          listing_id: string
          location: string | null
          neighbourhood: string | null
          open_house_end: string | null
          open_house_start: string | null
          parking_spaces: number | null
          pin_location: string | null
          plans: string[] | null
          price: number | null
          property_age: string | null
          property_classification: string | null
          property_orientation: string | null
          property_purpose: string
          property_status: string
          property_type: string
          province: string | null
          rent_duration: string | null
          rooms: string | null
          status: string
          title: string
          title_deed: string | null
          town: string | null
          updated_at: string
          video_link: string | null
          view_360_link: string | null
        }
        Insert: {
          advertising_tags?: string[] | null
          agent_id?: string | null
          area?: number | null
          area_unit?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          company_id?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          display_on_homepage?: boolean
          exterior_amenities?: string[] | null
          floor_level?: string | null
          furniture?: string | null
          id?: string
          images?: string[] | null
          interior_amenities?: string[] | null
          listing_id?: string
          location?: string | null
          neighbourhood?: string | null
          open_house_end?: string | null
          open_house_start?: string | null
          parking_spaces?: number | null
          pin_location?: string | null
          plans?: string[] | null
          price?: number | null
          property_age?: string | null
          property_classification?: string | null
          property_orientation?: string | null
          property_purpose?: string
          property_status?: string
          property_type?: string
          province?: string | null
          rent_duration?: string | null
          rooms?: string | null
          status?: string
          title: string
          title_deed?: string | null
          town?: string | null
          updated_at?: string
          video_link?: string | null
          view_360_link?: string | null
        }
        Update: {
          advertising_tags?: string[] | null
          agent_id?: string | null
          area?: number | null
          area_unit?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          company_id?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          display_on_homepage?: boolean
          exterior_amenities?: string[] | null
          floor_level?: string | null
          furniture?: string | null
          id?: string
          images?: string[] | null
          interior_amenities?: string[] | null
          listing_id?: string
          location?: string | null
          neighbourhood?: string | null
          open_house_end?: string | null
          open_house_start?: string | null
          parking_spaces?: number | null
          pin_location?: string | null
          plans?: string[] | null
          price?: number | null
          property_age?: string | null
          property_classification?: string | null
          property_orientation?: string | null
          property_purpose?: string
          property_status?: string
          property_type?: string
          province?: string | null
          rent_duration?: string | null
          rooms?: string | null
          status?: string
          title?: string
          title_deed?: string | null
          town?: string | null
          updated_at?: string
          video_link?: string | null
          view_360_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      property_comparisons: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_comparisons_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          property_id: string
          reason: string
          reporter_email: string | null
          reporter_phone: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          property_id: string
          reason: string
          reporter_email?: string | null
          reporter_phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          property_id?: string
          reason?: string
          reporter_email?: string | null
          reporter_phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_reports_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_types: {
        Row: {
          created_at: string
          id: string
          sort_order: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_properties: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          created_at: string
          id: string
          search_params: Json
          search_type: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          search_params?: Json
          search_type?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          search_params?: Json
          search_type?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_announcements: {
        Row: {
          announcement_id: string
          created_at: string
          id: string
          is_read: boolean
          user_id: string
        }
        Insert: {
          announcement_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          user_id: string
        }
        Update: {
          announcement_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_announcements_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "company_announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_inquiries: {
        Row: {
          agent_id: string | null
          company_id: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          inquiry_type: string
          message: string | null
          phone: string | null
          project_id: string | null
          property_id: string | null
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          inquiry_type?: string
          message?: string | null
          phone?: string | null
          project_id?: string | null
          property_id?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          inquiry_type?: string
          message?: string | null
          phone?: string | null
          project_id?: string | null
          property_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_inquiries_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_inquiries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_inquiries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_inquiries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          notification_type: string
          property_id: string | null
          source_agent_id: string | null
          source_company_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          notification_type?: string
          property_id?: string | null
          source_agent_id?: string | null
          source_company_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          notification_type?: string
          property_id?: string | null
          source_agent_id?: string | null
          source_company_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notifications_source_agent_id_fkey"
            columns: ["source_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notifications_source_company_id_fkey"
            columns: ["source_company_id"]
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
      get_distinct_districts: {
        Args: { p_province: string }
        Returns: {
          ar: string
          name: string
        }[]
      }
      get_distinct_provinces: {
        Args: never
        Returns: {
          ar: string
          name: string
        }[]
      }
      get_neighborhoods: {
        Args: { p_district: string; p_province: string }
        Returns: {
          ar: string
          name: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      search_event_ids_by_keyword: {
        Args: { p_keyword: string }
        Returns: {
          event_id: string
        }[]
      }
      search_projects_by_units: {
        Args: {
          p_amenities?: string[]
          p_district?: string
          p_keyword?: string
          p_limit?: number
          p_max_area?: number
          p_max_price?: number
          p_min_area?: number
          p_min_price?: number
          p_neighborhood?: string
          p_offset?: number
          p_project_status?: string
          p_province?: string
          p_rooms?: string[]
          p_sort_by?: string
          p_unit_types?: string[]
        }
        Returns: {
          project_row: Json
          total_count: number
        }[]
      }
      search_property_ids_by_keyword: {
        Args: { p_keyword: string }
        Returns: {
          property_id: string
        }[]
      }
      unaccent: { Args: { "": string }; Returns: string }
      unaccent_match: {
        Args: { haystack: string; needle: string }
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
