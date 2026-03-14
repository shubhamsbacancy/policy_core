export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      applications: {
        Row: {
          id: string;
          org_id: string;
          policyholder_id: string | null;
          insured_property_id: string | null;
          product_version_id: string | null;
          data: Json;
          status: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          policyholder_id?: string | null;
          insured_property_id?: string | null;
          product_version_id?: string | null;
          data?: Json;
          status?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["applications"]["Insert"]>;
      };
      application_documents: {
        Row: {
          id: string;
          org_id: string;
          application_id: string;
          storage_path: string;
          document_metadata: Json;
          status: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["application_documents"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["application_documents"]["Row"]>;
      };
      quotes: {
        Row: {
          id: string;
          org_id: string;
          application_id: string;
          quote_number: string;
          premium: number;
          taxes: number;
          fees: number;
          total_premium: number;
          currency: string;
          rating_breakdown: Json;
          coverage_snapshot: Json;
          status: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["quotes"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["quotes"]["Row"]>;
      };
      quote_versions: {
        Row: {
          id: string;
          org_id: string;
          quote_id: string;
          version_no: number;
          coverage_snapshot: Json;
          rating_breakdown: Json;
          status: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["quote_versions"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["quote_versions"]["Row"]>;
      };
      risk_assessments: {
        Row: {
          id: string;
          org_id: string;
          application_id: string;
          ai_inputs: Json;
          ai_outputs: Json;
          risk_score: number | null;
          risk_tier: string | null;
          recommended_action: string | null;
          status: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["risk_assessments"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["risk_assessments"]["Row"]>;
      };
      policies: {
        Row: {
          id: string;
          org_id: string;
          quote_id: string;
          policy_number: string;
          effective_date: string;
          expiration_date: string;
          status: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["policies"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["policies"]["Row"]>;
      };
      invoices: {
        Row: {
          id: string;
          org_id: string;
          policy_id: string;
          invoice_number: string;
          amount_due: number;
          due_date: string;
          currency: string;
          status: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["invoices"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["invoices"]["Row"]>;
      };
      payments: {
        Row: {
          id: string;
          org_id: string;
          invoice_id: string;
          amount: number;
          payment_method: string;
          external_reference: string | null;
          status: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["payments"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["payments"]["Row"]>;
      };
      endorsements: {
        Row: {
          id: string;
          org_id: string;
          policy_id: string;
          change_set: Json;
          effective_date: string;
          reason: string | null;
          status: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["endorsements"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["endorsements"]["Row"]>;
      };
      renewal_offers: {
        Row: {
          id: string;
          org_id: string;
          policy_id: string;
          target_effective_date: string;
          offer_payload: Json;
          status: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["renewal_offers"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["renewal_offers"]["Row"]>;
      };
      cancellations: {
        Row: {
          id: string;
          org_id: string;
          policy_id: string;
          reason: string;
          requested_cancel_date: string;
          status: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["cancellations"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["cancellations"]["Row"]>;
      };
      claims: {
        Row: {
          id: string;
          org_id: string;
          policy_id: string;
          claim_number: string;
          incident_date: string;
          description: string;
          estimated_loss_amount: number;
          status: string;
          ai_inputs: Json;
          ai_outputs: Json;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["claims"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["claims"]["Row"]>;
      };
      claim_events: {
        Row: {
          id: string;
          org_id: string;
          claim_id: string;
          event_type: string;
          event_payload: Json;
          status: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["claim_events"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["claim_events"]["Row"]>;
      };
      claim_reserves: {
        Row: {
          id: string;
          org_id: string;
          claim_id: string;
          reserve_amount: number;
          status: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["claim_reserves"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["claim_reserves"]["Row"]>;
      };
      audit_logs: {
        Row: {
          id: string;
          org_id: string;
          actor_user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          before_state: Json | null;
          after_state: Json | null;
          status: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["audit_logs"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Row"]>;
      };
      profiles: {
        Row: {
          id: string;
          org_id: string | null;
          status: string;
          full_name: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id: string;
          org_id?: string | null;
          status?: string;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      orgs: {
        Row: {
          id: string;
          name: string;
          slug: string;
          jurisdiction: string;
          status: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["orgs"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["orgs"]["Row"]>;
      };
      org_memberships: {
        Row: {
          id: string;
          org_id: string;
          user_id: string;
          membership_type: string;
          status: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          org_id: string;
          user_id: string;
          membership_type?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["org_memberships"]["Insert"]>;
      };
      role_assignments: {
        Row: {
          id: string;
          org_id: string;
          user_id: string;
          role_key: string;
          status: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          org_id: string;
          user_id: string;
          role_key: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["role_assignments"]["Insert"]>;
      };
    };
  };
}
