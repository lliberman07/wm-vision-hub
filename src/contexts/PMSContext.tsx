import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

type PMSRole = 'SUPERADMIN' | 'INMOBILIARIA' | 'ADMINISTRADOR' | 'PROPIETARIO' | 'INQUILINO' | 'PROVEEDOR';

interface PMSTenant {
  id: string;
  name: string;
  slug: string;
}

interface PMSRoleContext {
  role: PMSRole;
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
}

interface PMSContextType {
  hasPMSAccess: boolean;
  pmsRoles: PMSRole[];
  allRoleContexts: PMSRoleContext[];
  activeRoleContext: PMSRoleContext | null;
  userRole: PMSRole | null;
  currentTenant: PMSTenant | null;
  loading: boolean;
  switchContext: (roleContext: PMSRoleContext) => void;
  requestAccess: (role: PMSRole, reason: string, userData?: {
    email: string;
    entity_type: 'fisica' | 'juridica';
    address: string;
    city: string;
    state: string;
    postal_code: string;
    contract_number?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    document_id?: string;
    cuit_cuil?: string;
    razon_social?: string;
    cuit?: string;
    contact_name?: string;
  }) => Promise<{ error: any }>;
  checkPMSAccess: () => Promise<void>;
}

const PMSContext = createContext<PMSContextType | undefined>(undefined);

export const usePMS = () => {
  const context = useContext(PMSContext);
  if (!context) {
    throw new Error('usePMS must be used within a PMSProvider');
  }
  return context;
};

export const PMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [hasPMSAccess, setHasPMSAccess] = useState(false);
  const [pmsRoles, setPMSRoles] = useState<PMSRole[]>([]);
  const [allRoleContexts, setAllRoleContexts] = useState<PMSRoleContext[]>([]);
  const [activeRoleContext, setActiveRoleContext] = useState<PMSRoleContext | null>(null);
  const [userRole, setUserRole] = useState<PMSRole | null>(null);
  const [currentTenant, setCurrentTenant] = useState<PMSTenant | null>(null);
  const [loading, setLoading] = useState(true);

  const checkPMSAccess = async () => {
    if (!user) {
      setHasPMSAccess(false);
      setPMSRoles([]);
      setAllRoleContexts([]);
      setActiveRoleContext(null);
      setUserRole(null);
      setCurrentTenant(null);
      setLoading(false);
      return;
    }

    try {
      // ✅ NEW: Use v_current_user_tenants view (more efficient than RPC)
      const { data: rolesData, error: rolesError } = await supabase
        .from('v_current_user_tenants')
        .select('*')
        .eq('user_id', user.id);

      if (rolesError) {
        console.error('[PMSContext] Error fetching roles:', rolesError);
        throw rolesError;
      }

      if (!rolesData || rolesData.length === 0) {
        setHasPMSAccess(false);
        setPMSRoles([]);
        setAllRoleContexts([]);
        setActiveRoleContext(null);
        setUserRole(null);
        setCurrentTenant(null);
        setLoading(false);
        return;
      }

      // Build role contexts from view result
      // Note: The view returns 1 row per tenant with roles[] array
      // We flatMap to expand into individual role contexts
      const contexts: PMSRoleContext[] = rolesData.flatMap((row: any) => 
        (row.roles || []).map((role: string) => ({
          role: role.toUpperCase() as PMSRole,
          tenant_id: row.tenant_id,
          tenant_name: row.name || 'Sin nombre',
          tenant_slug: row.slug || ''
        }))
      );

      setAllRoleContexts(contexts);
      
      // Try to restore context from sessionStorage with integrity verification
      const savedContext = sessionStorage.getItem('pms_active_context');
      let activeContext = contexts[0]; // Default to first
      
      if (savedContext) {
        try {
          const parsed = JSON.parse(savedContext);
          // SECURITY: Verify the saved context still exists in current contexts
          // This prevents manipulation of sessionStorage to access unauthorized contexts
          const verified = contexts.find(c => 
            c.role === parsed.role && c.tenant_id === parsed.tenant_id
          );
          if (verified) {
            activeContext = verified;
          } else {
            // Context was tampered with or no longer valid, clear it
            sessionStorage.removeItem('pms_active_context');
          }
        } catch (e) {
          // Invalid JSON in sessionStorage, clear it
          sessionStorage.removeItem('pms_active_context');
        }
      }
      
      setActiveRoleContext(activeContext);
      
      // Extract unique roles
      const uniqueRoles = Array.from(new Set(contexts.map(c => c.role))) as PMSRole[];
      setPMSRoles(uniqueRoles);
      
      // Update legacy states for compatibility
      setUserRole(activeContext.role);
      setCurrentTenant({
        id: activeContext.tenant_id,
        name: activeContext.tenant_name,
        slug: activeContext.tenant_slug
      });
      
      setHasPMSAccess(true);
    } catch (error) {
      console.error('[PMSContext] Error in checkPMSAccess:', error);
      setHasPMSAccess(false);
      setPMSRoles([]);
      setAllRoleContexts([]);
      setActiveRoleContext(null);
      setUserRole(null);
      setCurrentTenant(null);
    } finally {
      setLoading(false);
    }
  };

  const switchContext = (roleContext: PMSRoleContext) => {
    setActiveRoleContext(roleContext);
    
    // Save to sessionStorage (persists during session only)
    sessionStorage.setItem('pms_active_context', JSON.stringify({
      role: roleContext.role,
      tenant_id: roleContext.tenant_id
    }));
    
    // Update legacy states for compatibility
    setUserRole(roleContext.role);
    setCurrentTenant({
      id: roleContext.tenant_id,
      name: roleContext.tenant_name,
      slug: roleContext.tenant_slug
    });
  };

  const requestAccess = async (
    role: PMSRole, 
    reason: string,
    userData?: {
      email: string;
      entity_type: 'fisica' | 'juridica';
      address: string;
      city: string;
      state: string;
      postal_code: string;
      contract_number?: string;
      first_name?: string;
      last_name?: string;
      phone?: string;
      document_id?: string;
      cuit_cuil?: string;
      razon_social?: string;
      cuit?: string;
      contact_name?: string;
    }
  ) => {
    if (!userData?.email) {
      return { error: { message: 'Email es requerido' } };
    }

    try {
      // Get the default tenant ID
      const { data: tenantId, error: tenantError } = await supabase
        .rpc('get_default_tenant_id');

      if (tenantError) {
        console.error('Error fetching default tenant:', tenantError);
        return { error: { message: 'Error al obtener tenant predeterminado' } };
      }

      if (!tenantId) {
        return { error: { message: 'Tenant predeterminado no encontrado. Contacte al administrador.' } };
      }

      // Check if user exists with this email by querying auth.users indirectly
      const { data: existingUsers } = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email)
        .limit(1);

      // Use existing user ID if found, otherwise null
      // When admin approves a request with null user_id, they'll create the user account
      const userId = existingUsers && existingUsers.length > 0 
        ? existingUsers[0].id 
        : null;

      // Preparar datos según entity_type
      const insertData: any = {
        user_id: userId,
        tenant_id: tenantId,
        email: userData.email,
        requested_role: role.toUpperCase() as any,
        reason: reason,
        entity_type: userData.entity_type,
        address: userData.address,
        city: userData.city,
        state: userData.state,
        postal_code: userData.postal_code,
        contract_number: userData.contract_number || null,
        status: 'pending',
      };

      // Si es Persona Física
      if (userData.entity_type === 'fisica') {
        insertData.first_name = userData.first_name;
        insertData.last_name = userData.last_name;
        insertData.phone = userData.phone;
        insertData.document_id = userData.document_id;
        insertData.cuit_cuil = userData.cuit_cuil;
      }
      
      // Si es Persona Jurídica
      if (userData.entity_type === 'juridica') {
        insertData.razon_social = userData.razon_social;
        insertData.tax_id = userData.cuit; // El CUIT va a tax_id
        insertData.contact_name = userData.contact_name;
        insertData.phone = userData.phone;
      }

      // Insert into pms_access_requests table
      const { error: requestError } = await supabase
        .from('pms_access_requests')
        .insert([insertData]);

      if (requestError) {
        console.error('Error creating access request:', requestError);
        return { error: { message: 'Error al crear solicitud de acceso: ' + requestError.message } };
      }

      return { error: null };
    } catch (error: any) {
      console.error('Unexpected error:', error);
      return { error: { message: 'Error inesperado al procesar solicitud' } };
    }
  };

  useEffect(() => {
    checkPMSAccess();
  }, [user]);

  const value = {
    hasPMSAccess,
    pmsRoles,
    allRoleContexts,
    activeRoleContext,
    userRole,
    currentTenant,
    loading,
    switchContext,
    requestAccess,
    checkPMSAccess,
  };

  return (
    <PMSContext.Provider value={value}>
      {children}
    </PMSContext.Provider>
  );
};
