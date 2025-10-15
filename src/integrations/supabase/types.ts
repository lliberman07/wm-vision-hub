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
      access_requests: {
        Row: {
          created_at: string | null
          id: string
          module: Database["public"]["Enums"]["module_type"]
          reason: string | null
          requested_roles: string[]
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["request_status"] | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          module: Database["public"]["Enums"]["module_type"]
          reason?: string | null
          requested_roles: string[]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          module?: Database["public"]["Enums"]["module_type"]
          reason?: string | null
          requested_roles?: string[]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
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
      pms_access_requests: {
        Row: {
          address: string | null
          city: string | null
          company_name: string | null
          created_at: string | null
          document_id: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          postal_code: string | null
          reason: string | null
          requested_role: Database["public"]["Enums"]["pms_app_role"]
          reviewed_at: string | null
          reviewed_by: string | null
          state: string | null
          status: string | null
          tax_id: string | null
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string | null
          document_id?: string | null
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          postal_code?: string | null
          reason?: string | null
          requested_role: Database["public"]["Enums"]["pms_app_role"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: string | null
          status?: string | null
          tax_id?: string | null
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string | null
          document_id?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          postal_code?: string | null
          reason?: string | null
          requested_role?: Database["public"]["Enums"]["pms_app_role"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: string | null
          status?: string | null
          tax_id?: string | null
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pms_access_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pms_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pms_cashflow_property: {
        Row: {
          created_at: string | null
          currency: string
          detail_json: Json | null
          id: string
          net_result: number | null
          period: string
          property_id: string
          tenant_id: string
          total_expenses: number | null
          total_income: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency: string
          detail_json?: Json | null
          id?: string
          net_result?: number | null
          period: string
          property_id: string
          tenant_id: string
          total_expenses?: number | null
          total_income?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string
          detail_json?: Json | null
          id?: string
          net_result?: number | null
          period?: string
          property_id?: string
          tenant_id?: string
          total_expenses?: number | null
          total_income?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pms_cashflow_property_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "pms_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pms_cashflow_property_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pms_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pms_contract_adjustments: {
        Row: {
          application_date: string
          audit_json: Json | null
          contract_id: string
          created_at: string | null
          id: string
          index_type: string
          item: string | null
          new_amount: number
          previous_amount: number
          tenant_id: string
          variation_percent: number
        }
        Insert: {
          application_date: string
          audit_json?: Json | null
          contract_id: string
          created_at?: string | null
          id?: string
          index_type: string
          item?: string | null
          new_amount: number
          previous_amount: number
          tenant_id: string
          variation_percent: number
        }
        Update: {
          application_date?: string
          audit_json?: Json | null
          contract_id?: string
          created_at?: string | null
          id?: string
          index_type?: string
          item?: string | null
          new_amount?: number
          previous_amount?: number
          tenant_id?: string
          variation_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "pms_contract_adjustments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "pms_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pms_contract_adjustments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pms_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pms_contract_monthly_projections: {
        Row: {
          adjusted_amount: number
          adjustment_applied: boolean | null
          adjustment_percentage: number | null
          base_amount: number
          contract_id: string
          created_at: string | null
          id: string
          indices_used: Json | null
          item: string
          month_number: number
          pending_indices: boolean | null
          period_date: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          adjusted_amount: number
          adjustment_applied?: boolean | null
          adjustment_percentage?: number | null
          base_amount: number
          contract_id: string
          created_at?: string | null
          id?: string
          indices_used?: Json | null
          item: string
          month_number: number
          pending_indices?: boolean | null
          period_date: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          adjusted_amount?: number
          adjustment_applied?: boolean | null
          adjustment_percentage?: number | null
          base_amount?: number
          contract_id?: string
          created_at?: string | null
          id?: string
          indices_used?: Json | null
          item?: string
          month_number?: number
          pending_indices?: boolean | null
          period_date?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pms_contract_monthly_projections_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "pms_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pms_contract_monthly_projections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pms_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pms_contract_payment_methods: {
        Row: {
          contract_id: string
          created_at: string | null
          destination_account: string | null
          id: string
          item: string | null
          notes: string | null
          payment_method: string
          percentage: number | null
          tenant_id: string
        }
        Insert: {
          contract_id: string
          created_at?: string | null
          destination_account?: string | null
          id?: string
          item?: string | null
          notes?: string | null
          payment_method: string
          percentage?: number | null
          tenant_id: string
        }
        Update: {
          contract_id?: string
          created_at?: string | null
          destination_account?: string | null
          id?: string
          item?: string | null
          notes?: string | null
          payment_method?: string
          percentage?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pms_contract_payment_methods_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "pms_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pms_contract_payment_methods_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pms_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pms_contracts: {
        Row: {
          adjustment_config: Json | null
          adjustment_type: string | null
          aplica_a_items: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          contract_number: string
          contract_type: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          deposit_amount: number | null
          deposit_currency: string | null
          detalle_otro_item_a: string | null
          end_date: string
          fecha_primer_ajuste: string | null
          forma_pago_item_a: string | null
          forma_pago_item_b: string | null
          frecuencia_ajuste: string | null
          frecuencia_factura: string | null
          guarantee_details: string | null
          guarantee_type: string | null
          guarantors: Json | null
          id: string
          indice_ajuste: string | null
          monthly_rent: number
          monto_a: number | null
          monto_ajustado_actual_a: number | null
          monto_ajustado_actual_b: number | null
          monto_b: number | null
          payment_day: number | null
          pdf_url: string | null
          property_id: string
          special_clauses: string | null
          start_date: string
          status: string | null
          tenant_id: string
          tenant_renter_id: string
          tipo_contrato: string | null
          ultimo_ajuste: string | null
          updated_at: string | null
        }
        Insert: {
          adjustment_config?: Json | null
          adjustment_type?: string | null
          aplica_a_items?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          contract_number: string
          contract_type?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          deposit_amount?: number | null
          deposit_currency?: string | null
          detalle_otro_item_a?: string | null
          end_date: string
          fecha_primer_ajuste?: string | null
          forma_pago_item_a?: string | null
          forma_pago_item_b?: string | null
          frecuencia_ajuste?: string | null
          frecuencia_factura?: string | null
          guarantee_details?: string | null
          guarantee_type?: string | null
          guarantors?: Json | null
          id?: string
          indice_ajuste?: string | null
          monthly_rent: number
          monto_a?: number | null
          monto_ajustado_actual_a?: number | null
          monto_ajustado_actual_b?: number | null
          monto_b?: number | null
          payment_day?: number | null
          pdf_url?: string | null
          property_id: string
          special_clauses?: string | null
          start_date: string
          status?: string | null
          tenant_id: string
          tenant_renter_id: string
          tipo_contrato?: string | null
          ultimo_ajuste?: string | null
          updated_at?: string | null
        }
        Update: {
          adjustment_config?: Json | null
          adjustment_type?: string | null
          aplica_a_items?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          contract_number?: string
          contract_type?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          deposit_amount?: number | null
          deposit_currency?: string | null
          detalle_otro_item_a?: string | null
          end_date?: string
          fecha_primer_ajuste?: string | null
          forma_pago_item_a?: string | null
          forma_pago_item_b?: string | null
          frecuencia_ajuste?: string | null
          frecuencia_factura?: string | null
          guarantee_details?: string | null
          guarantee_type?: string | null
          guarantors?: Json | null
          id?: string
          indice_ajuste?: string | null
          monthly_rent?: number
          monto_a?: number | null
          monto_ajustado_actual_a?: number | null
          monto_ajustado_actual_b?: number | null
          monto_b?: number | null
          payment_day?: number | null
          pdf_url?: string | null
          property_id?: string
          special_clauses?: string | null
          start_date?: string
          status?: string | null
          tenant_id?: string
          tenant_renter_id?: string
          tipo_contrato?: string | null
          ultimo_ajuste?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pms_contracts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "pms_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pms_contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pms_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pms_contracts_tenant_renter_id_fkey"
            columns: ["tenant_renter_id"]
            isOneToOne: false
            referencedRelation: "pms_tenants_renters"
            referencedColumns: ["id"]
          },
        ]
      }
      pms_documents: {
        Row: {
          created_at: string | null
          document_type: string
          entity_id: string
          entity_type: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          tenant_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          document_type: string
          entity_id: string
          entity_type: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          tenant_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          document_type?: string
          entity_id?: string
          entity_type?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          tenant_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pms_documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pms_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pms_economic_indices: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          index_type: string
          period: string
          source: string | null
          value: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          index_type: string
          period: string
          source?: string | null
          value: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          index_type?: string
          period?: string
          source?: string | null
          value?: number
        }
        Relationships: []
      }
      pms_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          expense_date: string
          id: string
          property_id: string
          receipt_url: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          expense_date: string
          id?: string
          property_id: string
          receipt_url?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          property_id?: string
          receipt_url?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pms_expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "pms_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pms_expenses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pms_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pms_maintenance_requests: {
        Row: {
          actual_cost: number | null
          assigned_to: string | null
          category: string | null
          completed_date: string | null
          contract_id: string | null
          created_at: string | null
          description: string
          estimated_cost: number | null
          id: string
          notes: string | null
          photos: Json | null
          priority: string | null
          property_id: string
          reported_by: string | null
          scheduled_date: string | null
          status: string | null
          tenant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_cost?: number | null
          assigned_to?: string | null
          category?: string | null
          completed_date?: string | null
          contract_id?: string | null
          created_at?: string | null
          description: string
          estimated_cost?: number | null
          id?: string
          notes?: string | null
          photos?: Json | null
          priority?: string | null
          property_id: string
          reported_by?: string | null
          scheduled_date?: string | null
          status?: string | null
          tenant_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_cost?: number | null
          assigned_to?: string | null
          category?: string | null
          completed_date?: string | null
          contract_id?: string | null
          created_at?: string | null
          description?: string
          estimated_cost?: number | null
          id?: string
          notes?: string | null
          photos?: Json | null
          priority?: string | null
          property_id?: string
          reported_by?: string | null
          scheduled_date?: string | null
          status?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pms_maintenance_requests_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "pms_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pms_maintenance_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "pms_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pms_maintenance_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pms_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pms_owner_properties: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          owner_id: string
          property_id: string
          share_percent: number
          start_date: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          owner_id: string
          property_id: string
          share_percent: number
          start_date?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          owner_id?: string
          property_id?: string
          share_percent?: number
          start_date?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pms_owner_properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "pms_owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pms_owner_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "pms_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pms_owner_properties_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pms_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pms_owners: {
        Row: {
          address: string | null
          bank_account: Json | null
          city: string | null
          created_at: string | null
          document_number: string
          document_type: string
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          notes: string | null
          owner_type: string
          phone: string | null
          tax_id: string | null
          tenant_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          bank_account?: Json | null
          city?: string | null
          created_at?: string | null
          document_number: string
          document_type: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          owner_type: string
          phone?: string | null
          tax_id?: string | null
          tenant_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          bank_account?: Json | null
          city?: string | null
          created_at?: string | null
          document_number?: string
          document_type?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          owner_type?: string
          phone?: string | null
          tax_id?: string | null
          tenant_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pms_owners_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pms_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pms_payment_distributions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          owner_id: string
          payment_id: string
          share_percent: number
          tenant_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          owner_id: string
          payment_id: string
          share_percent: number
          tenant_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          owner_id?: string
          payment_id?: string
          share_percent?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pms_payment_distributions_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "pms_owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pms_payment_distributions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "pms_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pms_payment_distributions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pms_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pms_payment_schedule_items: {
        Row: {
          contract_id: string
          created_at: string | null
          expected_amount: number
          id: string
          item: string
          owner_id: string
          owner_percentage: number
          payment_id: string | null
          payment_method_id: string
          period_date: string
          projection_id: string
          status: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          contract_id: string
          created_at?: string | null
          expected_amount: number
          id?: string
          item: string
          owner_id: string
          owner_percentage: number
          payment_id?: string | null
          payment_method_id: string
          period_date: string
          projection_id: string
          status?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          contract_id?: string
          created_at?: string | null
          expected_amount?: number
          id?: string
          item?: string
          owner_id?: string
          owner_percentage?: number
          payment_id?: string | null
          payment_method_id?: string
          period_date?: string
          projection_id?: string
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pms_payment_schedule_items_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "pms_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pms_payment_schedule_items_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "pms_owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pms_payment_schedule_items_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "pms_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pms_payment_schedule_items_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "pms_contract_payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pms_payment_schedule_items_projection_id_fkey"
            columns: ["projection_id"]
            isOneToOne: false
            referencedRelation: "pms_contract_monthly_projections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pms_payment_schedule_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pms_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pms_payment_submissions: {
        Row: {
          contract_id: string
          created_at: string | null
          id: string
          notes: string | null
          paid_amount: number
          paid_date: string
          payment_method: string
          receipt_url: string | null
          reference_number: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          schedule_item_id: string
          status: string | null
          submitted_by: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          contract_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_amount: number
          paid_date: string
          payment_method: string
          receipt_url?: string | null
          reference_number?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          schedule_item_id: string
          status?: string | null
          submitted_by: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          contract_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number
          paid_date?: string
          payment_method?: string
          receipt_url?: string | null
          reference_number?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          schedule_item_id?: string
          status?: string | null
          submitted_by?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pms_payment_submissions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "pms_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pms_payment_submissions_schedule_item_id_fkey"
            columns: ["schedule_item_id"]
            isOneToOne: false
            referencedRelation: "pms_payment_schedule_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pms_payment_submissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pms_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pms_payments: {
        Row: {
          amount: number
          contract_id: string
          created_at: string | null
          currency: string | null
          due_date: string
          id: string
          item: string | null
          notes: string | null
          paid_amount: number | null
          paid_date: string | null
          payment_method: string | null
          payment_type: string
          porcentaje: number | null
          receipt_url: string | null
          reference_number: string | null
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          contract_id: string
          created_at?: string | null
          currency?: string | null
          due_date: string
          id?: string
          item?: string | null
          notes?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          payment_method?: string | null
          payment_type: string
          porcentaje?: number | null
          receipt_url?: string | null
          reference_number?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          contract_id?: string
          created_at?: string | null
          currency?: string | null
          due_date?: string
          id?: string
          item?: string | null
          notes?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          payment_method?: string | null
          payment_type?: string
          porcentaje?: number | null
          receipt_url?: string | null
          reference_number?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pms_payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "pms_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pms_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pms_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pms_properties: {
        Row: {
          address: string
          alias: string | null
          amenities: string[] | null
          barrio: string | null
          bathrooms: number | null
          bedrooms: number | null
          categoria: string | null
          city: string
          code: string
          country: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          estado_publicacion: string | null
          id: string
          latitude: number | null
          longitude: number | null
          monto_alquiler: number | null
          operacion: string | null
          photos: Json | null
          postal_code: string | null
          property_type: string
          state: string | null
          status: string | null
          surface_covered: number | null
          surface_total: number | null
          tenant_id: string
          updated_at: string | null
          valor_venta: number | null
        }
        Insert: {
          address: string
          alias?: string | null
          amenities?: string[] | null
          barrio?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          categoria?: string | null
          city: string
          code: string
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estado_publicacion?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          monto_alquiler?: number | null
          operacion?: string | null
          photos?: Json | null
          postal_code?: string | null
          property_type: string
          state?: string | null
          status?: string | null
          surface_covered?: number | null
          surface_total?: number | null
          tenant_id: string
          updated_at?: string | null
          valor_venta?: number | null
        }
        Update: {
          address?: string
          alias?: string | null
          amenities?: string[] | null
          barrio?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          categoria?: string | null
          city?: string
          code?: string
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estado_publicacion?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          monto_alquiler?: number | null
          operacion?: string | null
          photos?: Json | null
          postal_code?: string | null
          property_type?: string
          state?: string | null
          status?: string | null
          surface_covered?: number | null
          surface_total?: number | null
          tenant_id?: string
          updated_at?: string | null
          valor_venta?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pms_properties_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pms_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pms_tenants: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          settings: Json | null
          slug: string
          tenant_type: Database["public"]["Enums"]["pms_tenant_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          settings?: Json | null
          slug: string
          tenant_type?: Database["public"]["Enums"]["pms_tenant_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          settings?: Json | null
          slug?: string
          tenant_type?: Database["public"]["Enums"]["pms_tenant_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      pms_tenants_renters: {
        Row: {
          created_at: string | null
          credit_score: number | null
          document_number: string
          document_type: string
          email: string
          emergency_contact: Json | null
          employment_info: Json | null
          full_name: string
          id: string
          is_active: boolean | null
          notes: string | null
          phone: string | null
          tenant_id: string
          tenant_references: Json | null
          tenant_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          credit_score?: number | null
          document_number: string
          document_type: string
          email: string
          emergency_contact?: Json | null
          employment_info?: Json | null
          full_name: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          phone?: string | null
          tenant_id: string
          tenant_references?: Json | null
          tenant_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          credit_score?: number | null
          document_number?: string
          document_type?: string
          email?: string
          emergency_contact?: Json | null
          employment_info?: Json | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          phone?: string | null
          tenant_id?: string
          tenant_references?: Json | null
          tenant_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pms_tenants_renters_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pms_tenants"
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
      user_roles: {
        Row: {
          approved_at: string | null
          created_at: string | null
          id: string
          module: Database["public"]["Enums"]["module_type"]
          role: Database["public"]["Enums"]["user_role_type"]
          status: Database["public"]["Enums"]["request_status"] | null
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          created_at?: string | null
          id?: string
          module: Database["public"]["Enums"]["module_type"]
          role: Database["public"]["Enums"]["user_role_type"]
          status?: Database["public"]["Enums"]["request_status"] | null
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          created_at?: string | null
          id?: string
          module?: Database["public"]["Enums"]["module_type"]
          role?: Database["public"]["Enums"]["user_role_type"]
          status?: Database["public"]["Enums"]["request_status"] | null
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pms_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          approved: boolean | null
          company_name: string | null
          created_at: string | null
          email: string
          email_verified: boolean | null
          entity_type: Database["public"]["Enums"]["entity_type"]
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          approved?: boolean | null
          company_name?: string | null
          created_at?: string | null
          email: string
          email_verified?: boolean | null
          entity_type?: Database["public"]["Enums"]["entity_type"]
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          approved?: boolean | null
          company_name?: string | null
          created_at?: string | null
          email?: string
          email_verified?: boolean | null
          entity_type?: Database["public"]["Enums"]["entity_type"]
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_contract: {
        Args: { contract_id_param: string }
        Returns: undefined
      }
      apply_automatic_adjustments: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      approve_payment_submission: {
        Args: { submission_id_param: string }
        Returns: undefined
      }
      approve_user: {
        Args: { user_id_param: string }
        Returns: undefined
      }
      cancel_contract: {
        Args: {
          cancellation_date_param: string
          cancellation_reason_param: string
          cancelled_by_param: string
          contract_id_param: string
        }
        Returns: undefined
      }
      check_expired_contracts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      deny_user: {
        Args: { user_id_param: string }
        Returns: undefined
      }
      extend_contract: {
        Args: {
          contract_id_param: string
          new_end_date_param: string
          notes_param?: string
        }
        Returns: undefined
      }
      generate_contract_monthly_projections: {
        Args: { contract_id_param: string }
        Returns: undefined
      }
      generate_payment_schedule_items: {
        Args: { contract_id_param: string }
        Returns: undefined
      }
      generate_reference_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
          role: Database["public"]["Enums"]["user_role_type"]
          status: Database["public"]["Enums"]["request_status"]
        }[]
      }
      get_default_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_property_auto_status: {
        Args: { property_id_param: string }
        Returns: string
      }
      has_pms_role: {
        Args:
          | {
              _role: Database["public"]["Enums"]["pms_app_role"]
              _tenant_id?: string
              _user_id: string
            }
          | { _role: string; _tenant_id?: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _module?: Database["public"]["Enums"]["module_type"]
          _role: Database["public"]["Enums"]["user_role_type"]
          _user_id: string
        }
        Returns: boolean
      }
      update_contract_projections_with_indices: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_overdue_payment_items: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
      entity_type: "persona" | "empresa"
      module_type: "WM" | "PMS"
      pms_app_role:
        | "SUPERADMIN"
        | "INMOBILIARIA"
        | "ADMINISTRADOR"
        | "PROPIETARIO"
        | "INQUILINO"
        | "PROVEEDOR"
      pms_tenant_type:
        | "inmobiliaria"
        | "administrador"
        | "propietario"
        | "inquilino"
        | "proveedor_servicios"
        | "sistema"
      request_status: "pending" | "approved" | "denied"
      user_role: "superadmin" | "admin"
      user_role_type:
        | "superadmin"
        | "admin"
        | "propietario"
        | "inquilino"
        | "inmobiliaria"
        | "proveedor"
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
      entity_type: ["persona", "empresa"],
      module_type: ["WM", "PMS"],
      pms_app_role: [
        "SUPERADMIN",
        "INMOBILIARIA",
        "ADMINISTRADOR",
        "PROPIETARIO",
        "INQUILINO",
        "PROVEEDOR",
      ],
      pms_tenant_type: [
        "inmobiliaria",
        "administrador",
        "propietario",
        "inquilino",
        "proveedor_servicios",
        "sistema",
      ],
      request_status: ["pending", "approved", "denied"],
      user_role: ["superadmin", "admin"],
      user_role_type: [
        "superadmin",
        "admin",
        "propietario",
        "inquilino",
        "inmobiliaria",
        "proveedor",
      ],
    },
  },
} as const
