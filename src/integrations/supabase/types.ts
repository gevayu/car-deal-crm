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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          branch: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          branch?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          branch?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_expenses: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          description: string
          expense_date: string
          id: string
          vehicle_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string
          expense_date?: string
          id?: string
          vehicle_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string
          expense_date?: string
          id?: string
          vehicle_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          asking_price: number | null
          branch: string | null
          chassis_number: string | null
          code: string | null
          color: string | null
          created_at: string
          created_by: string | null
          current_hand: string | null
          deal_type: Database["public"]["Enums"]["deal_type"] | null
          doors: number | null
          engine_number: string | null
          engine_type: string | null
          engine_volume: string | null
          entry_date: string | null
          expenses: number | null
          hand: number | null
          horsepower: string | null
          id: string
          is_original: boolean | null
          is_pledged: boolean | null
          license_plate: string | null
          list_price: number | null
          manufacturer: string | null
          model: string | null
          model_code: string | null
          needs_route: boolean | null
          notes: string | null
          odometer: number | null
          original_hand: string | null
          purchase_price: number | null
          registration_fee: number | null
          salesperson: string | null
          seats: number | null
          status: Database["public"]["Enums"]["vehicle_status"] | null
          test_date: string | null
          transmission: string | null
          trim_level: string | null
          updated_at: string
          vehicle_type: string | null
          weighted_list_price: number | null
          year: number | null
        }
        Insert: {
          asking_price?: number | null
          branch?: string | null
          chassis_number?: string | null
          code?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          current_hand?: string | null
          deal_type?: Database["public"]["Enums"]["deal_type"] | null
          doors?: number | null
          engine_number?: string | null
          engine_type?: string | null
          engine_volume?: string | null
          entry_date?: string | null
          expenses?: number | null
          hand?: number | null
          horsepower?: string | null
          id?: string
          is_original?: boolean | null
          is_pledged?: boolean | null
          license_plate?: string | null
          list_price?: number | null
          manufacturer?: string | null
          model?: string | null
          model_code?: string | null
          needs_route?: boolean | null
          notes?: string | null
          odometer?: number | null
          original_hand?: string | null
          purchase_price?: number | null
          registration_fee?: number | null
          salesperson?: string | null
          seats?: number | null
          status?: Database["public"]["Enums"]["vehicle_status"] | null
          test_date?: string | null
          transmission?: string | null
          trim_level?: string | null
          updated_at?: string
          vehicle_type?: string | null
          weighted_list_price?: number | null
          year?: number | null
        }
        Update: {
          asking_price?: number | null
          branch?: string | null
          chassis_number?: string | null
          code?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          current_hand?: string | null
          deal_type?: Database["public"]["Enums"]["deal_type"] | null
          doors?: number | null
          engine_number?: string | null
          engine_type?: string | null
          engine_volume?: string | null
          entry_date?: string | null
          expenses?: number | null
          hand?: number | null
          horsepower?: string | null
          id?: string
          is_original?: boolean | null
          is_pledged?: boolean | null
          license_plate?: string | null
          list_price?: number | null
          manufacturer?: string | null
          model?: string | null
          model_code?: string | null
          needs_route?: boolean | null
          notes?: string | null
          odometer?: number | null
          original_hand?: string | null
          purchase_price?: number | null
          registration_fee?: number | null
          salesperson?: string | null
          seats?: number | null
          status?: Database["public"]["Enums"]["vehicle_status"] | null
          test_date?: string | null
          transmission?: string | null
          trim_level?: string | null
          updated_at?: string
          vehicle_type?: string | null
          weighted_list_price?: number | null
          year?: number | null
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
      app_role: "admin" | "sales"
      deal_type: "regular_sale" | "brokerage"
      vehicle_status: "available" | "sold" | "reserved" | "in_treatment"
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
      app_role: ["admin", "sales"],
      deal_type: ["regular_sale", "brokerage"],
      vehicle_status: ["available", "sold", "reserved", "in_treatment"],
    },
  },
} as const
