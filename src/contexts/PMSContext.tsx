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
      setUserRole(null);
      setCurrentTenant(null);
      setLoading(false);
      return;
    }

    try {
      console.log('[PMSContext] Checking PMS access for user:', user.id);
      
      // Get user roles with tenant info in a single query
      const { data: rolesWithTenants, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          role,
          tenant_id,
          pms_tenants (
            id,
            name,
            slug
          )
        `)
        .eq('user_id', user.id)
        .eq('module', 'PMS')
        .eq('status', 'approved');

      console.log('[PMSContext] Roles query result:', { rolesWithTenants, error: rolesError });

      if (rolesError) {
        console.error('[PMSContext] Error fetching roles:', rolesError);
        throw rolesError;
      }

      if (rolesWithTenants && rolesWithTenants.length > 0) {
        // Build contexts array
        const contexts: PMSRoleContext[] = rolesWithTenants.map(r => ({
          role: r.role.toUpperCase() as PMSRole,
          tenant_id: r.tenant_id,
          tenant_name: r.pms_tenants?.name || 'Sin nombre',
          tenant_slug: r.pms_tenants?.slug || ''
        }));

        console.log('[PMSContext] Built contexts:', contexts);
        setAllRoleContexts(contexts);
        
        // Try to restore saved context from localStorage
        const savedContextStr = localStorage.getItem('pms_active_context');
        let activeContext: PMSRoleContext | null = null;
        
        if (savedContextStr) {
          try {
            const savedContext = JSON.parse(savedContextStr);
            activeContext = contexts.find(
              c => c.role === savedContext.role && c.tenant_id === savedContext.tenant_id
            ) || null;
            console.log('[PMSContext] Restored saved context:', activeContext);
          } catch (e) {
            console.warn('[PMSContext] Failed to parse saved context:', e);
          }
        }
        
        // Default to first role if no saved context found
        if (!activeContext) {
          activeContext = contexts[0];
          console.log('[PMSContext] Using default first context:', activeContext);
        }
        
        setActiveRoleContext(activeContext);
        setHasPMSAccess(true);
        
        // Maintain legacy state for compatibility
        setPMSRoles(contexts.map(c => c.role));
        setUserRole(activeContext.role);
        setCurrentTenant({
          id: activeContext.tenant_id,
          name: activeContext.tenant_name,
          slug: activeContext.tenant_slug
        });
        
        console.log('[PMSContext] ✅ Multi-role context loaded successfully');
      } else {
        console.log('[PMSContext] No roles found for user');
        setHasPMSAccess(false);
        setPMSRoles([]);
        setAllRoleContexts([]);
        setActiveRoleContext(null);
        setUserRole(null);
        setCurrentTenant(null);
      }
    } catch (error) {
      console.error('[PMSContext] Error checking PMS access:', error);
      setHasPMSAccess(false);
      setPMSRoles([]);
      setUserRole(null);
      setCurrentTenant(null);
    } finally {
      setLoading(false);
    }
  };

  const switchContext = (roleContext: PMSRoleContext) => {
    console.log('[PMSContext] Switching to context:', roleContext);
    setActiveRoleContext(roleContext);
    
    // Update legacy states for compatibility
    setUserRole(roleContext.role);
    setCurrentTenant({
      id: roleContext.tenant_id,
      name: roleContext.tenant_name,
      slug: roleContext.tenant_slug
    });
    
    // Persist selection
    localStorage.setItem('pms_active_context', JSON.stringify({
      role: roleContext.role,
      tenant_id: roleContext.tenant_id
    }));
    
    console.log('[PMSContext] ✅ Context switched successfully');
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
