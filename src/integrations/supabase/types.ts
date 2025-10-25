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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          applied_at: string
          company_id: string
          cover_letter: string | null
          cv_url: string | null
          id: string
          job_id: string
          status: Database["public"]["Enums"]["application_status"]
          talent_id: string
          updated_at: string
        }
        Insert: {
          applied_at?: string
          company_id: string
          cover_letter?: string | null
          cv_url?: string | null
          id?: string
          job_id: string
          status?: Database["public"]["Enums"]["application_status"]
          talent_id: string
          updated_at?: string
        }
        Update: {
          applied_at?: string
          company_id?: string
          cover_letter?: string | null
          cv_url?: string | null
          id?: string
          job_id?: string
          status?: Database["public"]["Enums"]["application_status"]
          talent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_contacts: {
        Row: {
          avatar_url: string | null
          company_id: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_id: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      company_news: {
        Row: {
          company_id: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          published: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          published?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          published?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_profiles: {
        Row: {
          address: string | null
          company_name: string
          company_size: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          foundation_sector: boolean | null
          id: string
          industry: string | null
          infrastructure_sector: boolean | null
          latitude: number | null
          location: string | null
          logo_url: string | null
          longitude: number | null
          mining_sector: boolean | null
          offshore_sector: boolean | null
          onboarding_completed: boolean | null
          prospecting_sector: boolean | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          company_name: string
          company_size?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          foundation_sector?: boolean | null
          id?: string
          industry?: string | null
          infrastructure_sector?: boolean | null
          latitude?: number | null
          location?: string | null
          logo_url?: string | null
          longitude?: number | null
          mining_sector?: boolean | null
          offshore_sector?: boolean | null
          onboarding_completed?: boolean | null
          prospecting_sector?: boolean | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string
          company_size?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          foundation_sector?: boolean | null
          id?: string
          industry?: string | null
          infrastructure_sector?: boolean | null
          latitude?: number | null
          location?: string | null
          logo_url?: string | null
          longitude?: number | null
          mining_sector?: boolean | null
          offshore_sector?: boolean | null
          onboarding_completed?: boolean | null
          prospecting_sector?: boolean | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      company_subscriptions: {
        Row: {
          company_id: string
          created_at: string
          end_date: string | null
          id: string
          is_active: boolean | null
          jobs_used: number | null
          plan_id: string
          start_date: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          jobs_used?: number | null
          plan_id: string
          start_date?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          jobs_used?: number | null
          plan_id?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      company_users: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contract_responses: {
        Row: {
          company_id: string
          contract_id: string
          created_at: string
          id: string
          message: string
          price_offer: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          contract_id: string
          created_at?: string
          id?: string
          message: string
          price_offer?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          contract_id?: string
          created_at?: string
          id?: string
          message?: string
          price_offer?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          budget_range: string | null
          company_id: string
          created_at: string
          description: string
          duration: string | null
          equipment_needed: string | null
          id: string
          location: string
          start_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          budget_range?: string | null
          company_id: string
          created_at?: string
          description: string
          duration?: string | null
          equipment_needed?: string | null
          id?: string
          location: string
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          budget_range?: string | null
          company_id?: string
          created_at?: string
          description?: string
          duration?: string | null
          equipment_needed?: string | null
          id?: string
          location?: string
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          certifications: string[] | null
          company_id: string
          created_at: string
          description: string
          experience_level: Database["public"]["Enums"]["experience_level"]
          id: string
          is_active: boolean | null
          job_type: Database["public"]["Enums"]["job_type"]
          latitude: number | null
          location: string
          longitude: number | null
          remote: boolean | null
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          skills: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          certifications?: string[] | null
          company_id: string
          created_at?: string
          description: string
          experience_level: Database["public"]["Enums"]["experience_level"]
          id?: string
          is_active?: boolean | null
          job_type: Database["public"]["Enums"]["job_type"]
          latitude?: number | null
          location: string
          longitude?: number | null
          remote?: boolean | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          skills?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          certifications?: string[] | null
          company_id?: string
          created_at?: string
          description?: string
          experience_level?: Database["public"]["Enums"]["experience_level"]
          id?: string
          is_active?: boolean | null
          job_type?: Database["public"]["Enums"]["job_type"]
          latitude?: number | null
          location?: string
          longitude?: number | null
          remote?: boolean | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          skills?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      profile_views: {
        Row: {
          company_id: string
          id: string
          talent_id: string
          viewed_at: string
        }
        Insert: {
          company_id: string
          id?: string
          talent_id: string
          viewed_at?: string
        }
        Update: {
          company_id?: string
          id?: string
          talent_id?: string
          viewed_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          availability_status: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          drilling_experience: boolean | null
          email: string
          experience_years: number | null
          facebook_url: string | null
          foundation_experience: boolean | null
          full_name: string | null
          has_passport: boolean | null
          id: string
          instagram_url: string | null
          latitude: number | null
          linkedin_url: string | null
          location: string | null
          longitude: number | null
          mining_experience: boolean | null
          offshore_experience: boolean | null
          passport_number: string | null
          phone: string | null
          preferred_work_type: string[] | null
          prospecting_experience: boolean | null
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          availability_status?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          drilling_experience?: boolean | null
          email: string
          experience_years?: number | null
          facebook_url?: string | null
          foundation_experience?: boolean | null
          full_name?: string | null
          has_passport?: boolean | null
          id: string
          instagram_url?: string | null
          latitude?: number | null
          linkedin_url?: string | null
          location?: string | null
          longitude?: number | null
          mining_experience?: boolean | null
          offshore_experience?: boolean | null
          passport_number?: string | null
          phone?: string | null
          preferred_work_type?: string[] | null
          prospecting_experience?: boolean | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          availability_status?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          drilling_experience?: boolean | null
          email?: string
          experience_years?: number | null
          facebook_url?: string | null
          foundation_experience?: boolean | null
          full_name?: string | null
          has_passport?: boolean | null
          id?: string
          instagram_url?: string | null
          latitude?: number | null
          linkedin_url?: string | null
          location?: string | null
          longitude?: number | null
          mining_experience?: boolean | null
          offshore_experience?: boolean | null
          passport_number?: string | null
          phone?: string | null
          preferred_work_type?: string[] | null
          prospecting_experience?: boolean | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          job_limit: number
          name: string
          price_eur: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          job_limit: number
          name: string
          price_eur: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          job_limit?: number
          name?: string
          price_eur?: number
        }
        Relationships: []
      }
      talent_certifications: {
        Row: {
          certification_name: string
          created_at: string
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuer: string | null
          talent_id: string
        }
        Insert: {
          certification_name: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuer?: string | null
          talent_id: string
        }
        Update: {
          certification_name?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuer?: string | null
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_certifications_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_skills: {
        Row: {
          created_at: string
          id: string
          skill_level: Database["public"]["Enums"]["experience_level"]
          skill_name: string
          talent_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          skill_level: Database["public"]["Enums"]["experience_level"]
          skill_name: string
          talent_id: string
        }
        Update: {
          created_at?: string
          id?: string
          skill_level?: Database["public"]["Enums"]["experience_level"]
          skill_name?: string
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_skills_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      application_status:
        | "pending"
        | "reviewing"
        | "interviewing"
        | "offered"
        | "accepted"
        | "rejected"
        | "withdrawn"
      experience_level: "entry" | "intermediate" | "senior" | "expert"
      job_type: "full_time" | "part_time" | "contract" | "rotation"
      user_type: "talent" | "company"
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
      application_status: [
        "pending",
        "reviewing",
        "interviewing",
        "offered",
        "accepted",
        "rejected",
        "withdrawn",
      ],
      experience_level: ["entry", "intermediate", "senior", "expert"],
      job_type: ["full_time", "part_time", "contract", "rotation"],
      user_type: ["talent", "company"],
    },
  },
} as const
