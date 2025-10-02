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
      applicants: {
        Row: {
          application_id: string
          created_at: string
          document_id: string | null
          employment_status:
            | Database["public"]["Enums"]["employment_status"]
            | null
          full_name: string | null
          id: string
          income: number | null
          ownership_percentage: number | null
          role_in_company: string | null
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          document_id?: string | null
          employment_status?:
            | Database["public"]["Enums"]["employment_status"]
            | null
          full_name?: string | null
          id?: string
          income?: number | null
          ownership_percentage?: number | null
          role_in_company?: string | null
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          document_id?: string | null
          employment_status?:
            | Database["public"]["Enums"]["employment_status"]
            | null
          full_name?: string | null
          id?: string
          income?: number | null
          ownership_percentage?: number | null
          role_in_company?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applicants_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          created_at: string
          email: string
          id: string
          phone: string | null
          resume_code: string
          status: Database["public"]["Enums"]["application_status"]
          type: Database["public"]["Enums"]["application_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          phone?: string | null
          resume_code?: string
          status?: Database["public"]["Enums"]["application_status"]
          type: Database["public"]["Enums"]["application_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          phone?: string | null
          resume_code?: string
          status?: Database["public"]["Enums"]["application_status"]
          type?: Database["public"]["Enums"]["application_type"]
          updated_at?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          company: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          message: string
          phone: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          message: string
          phone?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          message?: string
          phone?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          language: string
          session_id: string
          updated_at: string
          user_email: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          language?: string
          session_id: string
          updated_at?: string
          user_email?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          language?: string
          session_id?: string
          updated_at?: string
          user_email?: string | null
        }
        Relationships: []
      }
      creditos_hipotecarios: {
        Row: {
          antiguedad_laboral_minima_meses: number | null
          beneficiarios: string | null
          cargo_maximo_por_cancelacion_anticipada: number | null
          codigo_de_entidad: number | null
          costo_financiero_efectivo_total_maximo: number | null
          created_at: string | null
          cuota_inicial_a_plazo_maximo_cada_100_000: number | null
          denominacion: string | null
          descripcion_de_entidad: string
          destino_de_los_fondos: string | null
          edad_maxima_solicitada_anos: number | null
          fecha_de_informacion: string | null
          id: string
          ingreso_minimo_mensual_solicitado: number | null
          monto_maximo_otorgable_del_prestamo: number | null
          nombre_completo_del_prestamo_hipotecario: string | null
          nombre_corto_del_prestamo_hipotecario: string
          plazo_maximo_otorgable: number | null
          relacion_cuota_ingreso: number | null
          relacion_monto_tasacion: number | null
          tasa_efectiva_anual_maxima: number | null
          territorio_de_validez_de_la_oferta: string | null
          tipo_de_tasa: string | null
        }
        Insert: {
          antiguedad_laboral_minima_meses?: number | null
          beneficiarios?: string | null
          cargo_maximo_por_cancelacion_anticipada?: number | null
          codigo_de_entidad?: number | null
          costo_financiero_efectivo_total_maximo?: number | null
          created_at?: string | null
          cuota_inicial_a_plazo_maximo_cada_100_000?: number | null
          denominacion?: string | null
          descripcion_de_entidad: string
          destino_de_los_fondos?: string | null
          edad_maxima_solicitada_anos?: number | null
          fecha_de_informacion?: string | null
          id?: string
          ingreso_minimo_mensual_solicitado?: number | null
          monto_maximo_otorgable_del_prestamo?: number | null
          nombre_completo_del_prestamo_hipotecario?: string | null
          nombre_corto_del_prestamo_hipotecario: string
          plazo_maximo_otorgable?: number | null
          relacion_cuota_ingreso?: number | null
          relacion_monto_tasacion?: number | null
          tasa_efectiva_anual_maxima?: number | null
          territorio_de_validez_de_la_oferta?: string | null
          tipo_de_tasa?: string | null
        }
        Update: {
          antiguedad_laboral_minima_meses?: number | null
          beneficiarios?: string | null
          cargo_maximo_por_cancelacion_anticipada?: number | null
          codigo_de_entidad?: number | null
          costo_financiero_efectivo_total_maximo?: number | null
          created_at?: string | null
          cuota_inicial_a_plazo_maximo_cada_100_000?: number | null
          denominacion?: string | null
          descripcion_de_entidad?: string
          destino_de_los_fondos?: string | null
          edad_maxima_solicitada_anos?: number | null
          fecha_de_informacion?: string | null
          id?: string
          ingreso_minimo_mensual_solicitado?: number | null
          monto_maximo_otorgable_del_prestamo?: number | null
          nombre_completo_del_prestamo_hipotecario?: string | null
          nombre_corto_del_prestamo_hipotecario?: string
          plazo_maximo_otorgable?: number | null
          relacion_cuota_ingreso?: number | null
          relacion_monto_tasacion?: number | null
          tasa_efectiva_anual_maxima?: number | null
          territorio_de_validez_de_la_oferta?: string | null
          tipo_de_tasa?: string | null
        }
        Relationships: []
      }
      creditos_personales: {
        Row: {
          antiguedad_laboral_minima_meses: number | null
          beneficiario: string | null
          cargo_maximo_por_cancelacion_anticipada: number | null
          codigo_de_entidad: number | null
          costo_financiero_efectivo_total_maximo: number | null
          created_at: string | null
          cuota_inicial_a_plazo_maximo_cada_10_000: number | null
          denominacion: string | null
          descripcion_de_entidad: string
          edad_maxima_solicitada: number | null
          fecha_de_informacion: string | null
          id: string
          ingreso_minimo_mensual_solicitado: number | null
          monto_maximo_otorgable: number | null
          monto_minimo_otorgable: number | null
          nombre_completo_del_prestamo_personal: string | null
          nombre_corto_del_prestamo_personal: string
          plazo_maximo_otorgable_anos: number | null
          relacion_cuota_ingreso: number | null
          tasa_efectiva_anual_maxima: number | null
          territorio_de_validez_de_la_oferta: string | null
          tipo_de_tasa: string | null
        }
        Insert: {
          antiguedad_laboral_minima_meses?: number | null
          beneficiario?: string | null
          cargo_maximo_por_cancelacion_anticipada?: number | null
          codigo_de_entidad?: number | null
          costo_financiero_efectivo_total_maximo?: number | null
          created_at?: string | null
          cuota_inicial_a_plazo_maximo_cada_10_000?: number | null
          denominacion?: string | null
          descripcion_de_entidad: string
          edad_maxima_solicitada?: number | null
          fecha_de_informacion?: string | null
          id?: string
          ingreso_minimo_mensual_solicitado?: number | null
          monto_maximo_otorgable?: number | null
          monto_minimo_otorgable?: number | null
          nombre_completo_del_prestamo_personal?: string | null
          nombre_corto_del_prestamo_personal: string
          plazo_maximo_otorgable_anos?: number | null
          relacion_cuota_ingreso?: number | null
          tasa_efectiva_anual_maxima?: number | null
          territorio_de_validez_de_la_oferta?: string | null
          tipo_de_tasa?: string | null
        }
        Update: {
          antiguedad_laboral_minima_meses?: number | null
          beneficiario?: string | null
          cargo_maximo_por_cancelacion_anticipada?: number | null
          codigo_de_entidad?: number | null
          costo_financiero_efectivo_total_maximo?: number | null
          created_at?: string | null
          cuota_inicial_a_plazo_maximo_cada_10_000?: number | null
          denominacion?: string | null
          descripcion_de_entidad?: string
          edad_maxima_solicitada?: number | null
          fecha_de_informacion?: string | null
          id?: string
          ingreso_minimo_mensual_solicitado?: number | null
          monto_maximo_otorgable?: number | null
          monto_minimo_otorgable?: number | null
          nombre_completo_del_prestamo_personal?: string | null
          nombre_corto_del_prestamo_personal?: string
          plazo_maximo_otorgable_anos?: number | null
          relacion_cuota_ingreso?: number | null
          tasa_efectiva_anual_maxima?: number | null
          territorio_de_validez_de_la_oferta?: string | null
          tipo_de_tasa?: string | null
        }
        Relationships: []
      }
      creditos_prendarios: {
        Row: {
          antiguedad_laboral_minima_meses: number | null
          beneficiario: string | null
          cargo_maximo_por_cancelacion_anticipada: number | null
          codigo_de_entidad: number | null
          costo_financiero_efectivo_total_maximo: number | null
          created_at: string | null
          cuota_inicial_a_plazo_maximo_cada_10_000: number | null
          denominacion: string | null
          descripcion_de_entidad: string
          destino_de_los_fondos: string | null
          edad_maxima_solicitada_anos: number | null
          fecha_de_informacion: string | null
          id: string
          ingreso_minimo_mensual_solicitado: number | null
          monto_maximo_otorgable: number | null
          monto_minimo_otorgable: number | null
          nombre_completo_del_prestamo_prendario: string | null
          nombre_corto_del_prestamo_prendario: string
          plazo_maximo_otorgable_meses: number | null
          relacion_cuota_ingreso: number | null
          relacion_monto_tasacion: number | null
          tasa_efectiva_anual_maxima: number | null
          territorio_de_validez_de_la_oferta: string | null
          tipo_de_tasa: string | null
        }
        Insert: {
          antiguedad_laboral_minima_meses?: number | null
          beneficiario?: string | null
          cargo_maximo_por_cancelacion_anticipada?: number | null
          codigo_de_entidad?: number | null
          costo_financiero_efectivo_total_maximo?: number | null
          created_at?: string | null
          cuota_inicial_a_plazo_maximo_cada_10_000?: number | null
          denominacion?: string | null
          descripcion_de_entidad: string
          destino_de_los_fondos?: string | null
          edad_maxima_solicitada_anos?: number | null
          fecha_de_informacion?: string | null
          id?: string
          ingreso_minimo_mensual_solicitado?: number | null
          monto_maximo_otorgable?: number | null
          monto_minimo_otorgable?: number | null
          nombre_completo_del_prestamo_prendario?: string | null
          nombre_corto_del_prestamo_prendario: string
          plazo_maximo_otorgable_meses?: number | null
          relacion_cuota_ingreso?: number | null
          relacion_monto_tasacion?: number | null
          tasa_efectiva_anual_maxima?: number | null
          territorio_de_validez_de_la_oferta?: string | null
          tipo_de_tasa?: string | null
        }
        Update: {
          antiguedad_laboral_minima_meses?: number | null
          beneficiario?: string | null
          cargo_maximo_por_cancelacion_anticipada?: number | null
          codigo_de_entidad?: number | null
          costo_financiero_efectivo_total_maximo?: number | null
          created_at?: string | null
          cuota_inicial_a_plazo_maximo_cada_10_000?: number | null
          denominacion?: string | null
          descripcion_de_entidad?: string
          destino_de_los_fondos?: string | null
          edad_maxima_solicitada_anos?: number | null
          fecha_de_informacion?: string | null
          id?: string
          ingreso_minimo_mensual_solicitado?: number | null
          monto_maximo_otorgable?: number | null
          monto_minimo_otorgable?: number | null
          nombre_completo_del_prestamo_prendario?: string | null
          nombre_corto_del_prestamo_prendario?: string
          plazo_maximo_otorgable_meses?: number | null
          relacion_cuota_ingreso?: number | null
          relacion_monto_tasacion?: number | null
          tasa_efectiva_anual_maxima?: number | null
          territorio_de_validez_de_la_oferta?: string | null
          tipo_de_tasa?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          application_id: string
          doc_type: string
          file_url: string
          id: string
          uploaded_at: string
        }
        Insert: {
          application_id: string
          doc_type: string
          file_url: string
          id?: string
          uploaded_at?: string
        }
        Update: {
          application_id?: string
          doc_type?: string
          file_url?: string
          id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_simulations: {
        Row: {
          analysis_results: Json
          application_id: string | null
          created_at: string
          id: string
          profile_completed_at: string | null
          profile_status: string | null
          profile_step: number | null
          reference_number: string
          simulation_data: Json
          updated_at: string
          user_email: string
        }
        Insert: {
          analysis_results: Json
          application_id?: string | null
          created_at?: string
          id?: string
          profile_completed_at?: string | null
          profile_status?: string | null
          profile_step?: number | null
          reference_number: string
          simulation_data: Json
          updated_at?: string
          user_email: string
        }
        Update: {
          analysis_results?: Json
          application_id?: string | null
          created_at?: string
          id?: string
          profile_completed_at?: string | null
          profile_status?: string | null
          profile_step?: number | null
          reference_number?: string
          simulation_data?: Json
          updated_at?: string
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_simulations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base: {
        Row: {
          content: string
          id: string
          indexed_at: string
          language: string
          page_title: string
          page_url: string
          section: string | null
          summary: string | null
          updated_at: string
        }
        Insert: {
          content: string
          id?: string
          indexed_at?: string
          language?: string
          page_title: string
          page_url: string
          section?: string | null
          summary?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          id?: string
          indexed_at?: string
          language?: string
          page_title?: string
          page_url?: string
          section?: string | null
          summary?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_report_requests: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          pdf_url: string | null
          requested_at: string
          simulation_id: string
          status: string
          user_email: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          pdf_url?: string | null
          requested_at?: string
          simulation_id: string
          status?: string
          user_email: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          pdf_url?: string | null
          requested_at?: string
          simulation_id?: string
          status?: string
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_report_requests_simulation_id_fkey"
            columns: ["simulation_id"]
            isOneToOne: false
            referencedRelation: "investment_simulations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approved_at: string | null
          created_at: string
          denied_at: string | null
          email: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["approval_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          denied_at?: string | null
          email: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          denied_at?: string | null
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_user: {
        Args: { user_id_param: string }
        Returns: undefined
      }
      deny_user: {
        Args: { user_id_param: string }
        Returns: undefined
      }
      generate_reference_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["approval_status"]
        }[]
      }
    }
    Enums: {
      application_status:
        | "draft"
        | "pending"
        | "completed"
        | "approved"
        | "denied"
        | "under_analysis_fi"
        | "under_analysis_wm"
      application_type: "individual" | "company"
      approval_status: "pending" | "approved" | "denied"
      employment_status: "employed" | "self-employed" | "other"
      user_role: "superadmin" | "admin"
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
        "draft",
        "pending",
        "completed",
        "approved",
        "denied",
        "under_analysis_fi",
        "under_analysis_wm",
      ],
      application_type: ["individual", "company"],
      approval_status: ["pending", "approved", "denied"],
      employment_status: ["employed", "self-employed", "other"],
      user_role: ["superadmin", "admin"],
    },
  },
} as const
