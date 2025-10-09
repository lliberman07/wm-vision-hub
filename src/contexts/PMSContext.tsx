import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

type PMSRole = 'SUPERADMIN' | 'INMOBILIARIA' | 'ADMINISTRADOR' | 'PROPIETARIO' | 'INQUILINO';

interface PMSTenant {
  id: string;
  name: string;
  slug: string;
}

interface PMSContextType {
  hasPMSAccess: boolean;
  pmsRoles: PMSRole[];
  currentTenant: PMSTenant | null;
  loading: boolean;
  requestAccess: (role: PMSRole, reason: string, userData?: {
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
  const [currentTenant, setCurrentTenant] = useState<PMSTenant | null>(null);
  const [loading, setLoading] = useState(true);

  const checkPMSAccess = async () => {
    if (!user) {
      setHasPMSAccess(false);
      setPMSRoles([]);
      setCurrentTenant(null);
      setLoading(false);
      return;
    }

    try {
      console.log('[PMSContext] Checking PMS access for user:', user.id);
      
      // First, get user roles
      const { data: roles, error: rolesError } = await supabase
        .from('pms_user_roles')
        .select('role, tenant_id')
        .eq('user_id', user.id);

      console.log('[PMSContext] Roles query result:', { roles, error: rolesError });

      if (rolesError) {
        console.error('[PMSContext] Error fetching roles:', rolesError);
        throw rolesError;
      }

      if (roles && roles.length > 0) {
        setHasPMSAccess(true);
        setPMSRoles(roles.map(r => r.role as PMSRole));
        
        // Then get tenant information separately
        const { data: tenant, error: tenantError } = await supabase
          .from('pms_tenants')
          .select('id, name, slug')
          .eq('id', roles[0].tenant_id)
          .single();

        console.log('[PMSContext] Tenant query result:', { tenant, error: tenantError });

        if (tenant && !tenantError) {
          setCurrentTenant({
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug
          });
        } else {
          console.warn('[PMSContext] Could not fetch tenant, but user has roles');
          setCurrentTenant(null);
        }
      } else {
        console.log('[PMSContext] No roles found for user');
        setHasPMSAccess(false);
        setPMSRoles([]);
        setCurrentTenant(null);
      }
    } catch (error) {
      console.error('[PMSContext] Error checking PMS access:', error);
      setHasPMSAccess(false);
      setPMSRoles([]);
      setCurrentTenant(null);
    } finally {
      setLoading(false);
    }
  };

  const requestAccess = async (
    role: PMSRole, 
    reason: string,
    userData?: {
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
    if (!user) {
      return { error: { message: 'Debes iniciar sesión para solicitar acceso' } };
    }

    try {
      // Use the security definer function to get default tenant ID
      const { data: tenantId, error: tenantError } = await supabase
        .rpc('get_default_tenant_id');

      if (tenantError) {
        console.error('Error fetching default tenant:', tenantError);
        return { error: { message: 'Error al obtener tenant predeterminado' } };
      }

      if (!tenantId) {
        return { error: { message: 'Tenant predeterminado no encontrado. Contacte al administrador.' } };
      }

      const { error } = await supabase
        .from('pms_access_requests')
        .insert({
          user_id: user.id,
          tenant_id: tenantId,
          requested_role: role,
          reason: reason,
          first_name: userData?.first_name,
          last_name: userData?.last_name,
          phone: userData?.phone,
          document_id: userData?.document_id,
          address: userData?.address,
          city: userData?.city,
          state: userData?.state,
          postal_code: userData?.postal_code,
          company_name: userData?.company_name,
          tax_id: userData?.tax_id,
        });

      if (error) {
        console.error('Error creating access request:', error);
        return { error: { message: 'Error al crear solicitud de acceso' } };
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
    currentTenant,
    loading,
    requestAccess,
    checkPMSAccess,
  };

  return (
    <PMSContext.Provider value={value}>
      {children}
    </PMSContext.Provider>
  );
};
