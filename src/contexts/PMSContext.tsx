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
    first_name: string;
    last_name: string;
    phone: string;
    document_id: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
    company_name?: string;
    tax_id?: string;
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
      // Call RPC to get user roles in real-time (no localStorage)
      const { data: rolesData, error: rolesError } = await supabase
        .rpc('get_user_pms_role', { _user_id: user.id });

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

      // Build role contexts from RPC result
      const contexts: PMSRoleContext[] = rolesData.map((r: any) => ({
        role: r.role.toUpperCase() as PMSRole,
        tenant_id: r.tenant_id,
        tenant_name: r.tenant_name || 'Sin nombre',
        tenant_slug: r.tenant_slug || ''
      }));

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
      first_name: string;
      last_name: string;
      phone: string;
      document_id: string;
      address: string;
      city: string;
      state: string;
      postal_code: string;
      company_name?: string;
      tax_id?: string;
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

      // Insert into pms_access_requests table (which doesn't require authentication)
      const { error: requestError } = await supabase
        .from('pms_access_requests')
        .insert([{
          user_id: userId,
          tenant_id: tenantId,
          email: userData.email,
          requested_role: role.toUpperCase() as any,
          reason: reason,
          first_name: userData.first_name,
          last_name: userData.last_name,
          phone: userData.phone,
          document_id: userData.document_id,
          address: userData.address,
          city: userData.city,
          state: userData.state,
          postal_code: userData.postal_code,
          company_name: userData.company_name || null,
          tax_id: userData.tax_id || null,
          status: 'pending',
        }]);

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
