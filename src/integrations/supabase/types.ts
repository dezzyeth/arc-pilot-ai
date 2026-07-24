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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_memory: {
        Row: {
          preferences: string | null
          updated_at: string
          wallet: string
        }
        Insert: {
          preferences?: string | null
          updated_at?: string
          wallet: string
        }
        Update: {
          preferences?: string | null
          updated_at?: string
          wallet?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          category: string
          created_at: string
          id: string
          monthly_limit_usdc: number
          wallet: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          monthly_limit_usdc: number
          wallet: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          monthly_limit_usdc?: number
          wallet?: string
        }
        Relationships: []
      }
      chat_quota: {
        Row: {
          quota: number
          updated_at: string
          used: number
          wallet: string
        }
        Insert: {
          quota?: number
          updated_at?: string
          used?: number
          wallet: string
        }
        Update: {
          quota?: number
          updated_at?: string
          used?: number
          wallet?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string
          deadline: string | null
          id: string
          name: string
          saved_usdc: number
          target_usdc: number
          wallet: string
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          id?: string
          name: string
          saved_usdc?: number
          target_usdc: number
          wallet: string
        }
        Update: {
          created_at?: string
          deadline?: string | null
          id?: string
          name?: string
          saved_usdc?: number
          target_usdc?: number
          wallet?: string
        }
        Relationships: []
      }
      nanopayments_agent_wallet: {
        Row: {
          agent_address: string
          agent_privkey_ciphertext: string
          cap_period: string
          created_at: string
          expiry: string | null
          gateway_balance_usdc: number
          id: string
          owner_wallet: string
          period_started_at: string
          spending_cap_usdc: number
          spent_in_period_usdc: number
          updated_at: string
        }
        Insert: {
          agent_address: string
          agent_privkey_ciphertext: string
          cap_period?: string
          created_at?: string
          expiry?: string | null
          gateway_balance_usdc?: number
          id?: string
          owner_wallet: string
          period_started_at?: string
          spending_cap_usdc?: number
          spent_in_period_usdc?: number
          updated_at?: string
        }
        Update: {
          agent_address?: string
          agent_privkey_ciphertext?: string
          cap_period?: string
          created_at?: string
          expiry?: string | null
          gateway_balance_usdc?: number
          id?: string
          owner_wallet?: string
          period_started_at?: string
          spending_cap_usdc?: number
          spent_in_period_usdc?: number
          updated_at?: string
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          amount_usdc: number
          counterparty_address: string | null
          created_at: string
          direction: string
          endpoint: string | null
          id: string
          job_id: string | null
          network: string
          payer_addr: string | null
          response_snippet: string | null
          route: string
          seller_addr: string
          status: string
          tx_ref: string | null
        }
        Insert: {
          amount_usdc: number
          counterparty_address?: string | null
          created_at?: string
          direction?: string
          endpoint?: string | null
          id?: string
          job_id?: string | null
          network?: string
          payer_addr?: string | null
          response_snippet?: string | null
          route: string
          seller_addr: string
          status?: string
          tx_ref?: string | null
        }
        Update: {
          amount_usdc?: number
          counterparty_address?: string | null
          created_at?: string
          direction?: string
          endpoint?: string | null
          id?: string
          job_id?: string | null
          network?: string
          payer_addr?: string | null
          response_snippet?: string | null
          route?: string
          seller_addr?: string
          status?: string
          tx_ref?: string | null
        }
        Relationships: []
      }
      planner_x402_jobs: {
        Row: {
          agent_address: string
          condition: string | null
          created_at: string
          expected_price_usdc: number | null
          id: string
          interval_seconds: number | null
          last_error: string | null
          last_run_at: string | null
          max_price_usdc: number
          next_run_at: string | null
          owner_wallet: string
          schedule_cron: string | null
          spent_to_date_usdc: number
          status: string
          target_url: string
          total_budget_usdc: number | null
          updated_at: string
        }
        Insert: {
          agent_address: string
          condition?: string | null
          created_at?: string
          expected_price_usdc?: number | null
          id?: string
          interval_seconds?: number | null
          last_error?: string | null
          last_run_at?: string | null
          max_price_usdc: number
          next_run_at?: string | null
          owner_wallet: string
          schedule_cron?: string | null
          spent_to_date_usdc?: number
          status?: string
          target_url: string
          total_budget_usdc?: number | null
          updated_at?: string
        }
        Update: {
          agent_address?: string
          condition?: string | null
          created_at?: string
          expected_price_usdc?: number | null
          id?: string
          interval_seconds?: number | null
          last_error?: string | null
          last_run_at?: string | null
          max_price_usdc?: number
          next_run_at?: string | null
          owner_wallet?: string
          schedule_cron?: string | null
          spent_to_date_usdc?: number
          status?: string
          target_url?: string
          total_budget_usdc?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      scheduled_tx: {
        Row: {
          amount_usdc: number
          condition: string | null
          created_at: string
          id: string
          kind: string
          memo: string | null
          run_at: string | null
          status: string
          to_addr: string
          tx_hash: string | null
          wallet: string
        }
        Insert: {
          amount_usdc: number
          condition?: string | null
          created_at?: string
          id?: string
          kind?: string
          memo?: string | null
          run_at?: string | null
          status?: string
          to_addr: string
          tx_hash?: string | null
          wallet: string
        }
        Update: {
          amount_usdc?: number
          condition?: string | null
          created_at?: string
          id?: string
          kind?: string
          memo?: string | null
          run_at?: string | null
          status?: string
          to_addr?: string
          tx_hash?: string | null
          wallet?: string
        }
        Relationships: []
      }
      tx_log: {
        Row: {
          amount_usdc: number
          category: string | null
          created_at: string
          direction: string
          explanation: string | null
          hash: string | null
          id: string
          memo: string | null
          to_addr: string | null
          wallet: string
        }
        Insert: {
          amount_usdc?: number
          category?: string | null
          created_at?: string
          direction?: string
          explanation?: string | null
          hash?: string | null
          id?: string
          memo?: string | null
          to_addr?: string | null
          wallet: string
        }
        Update: {
          amount_usdc?: number
          category?: string | null
          created_at?: string
          direction?: string
          explanation?: string | null
          hash?: string | null
          id?: string
          memo?: string | null
          to_addr?: string | null
          wallet?: string
        }
        Relationships: []
      }
      user_wallets: {
        Row: {
          blockchain: string
          circle_wallet_address: string | null
          circle_wallet_id: string | null
          circle_wallet_set_id: string | null
          created_at: string
          evm_address: string
          id: string
        }
        Insert: {
          blockchain?: string
          circle_wallet_address?: string | null
          circle_wallet_id?: string | null
          circle_wallet_set_id?: string | null
          created_at?: string
          evm_address: string
          id?: string
        }
        Update: {
          blockchain?: string
          circle_wallet_address?: string | null
          circle_wallet_id?: string | null
          circle_wallet_set_id?: string | null
          created_at?: string
          evm_address?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
