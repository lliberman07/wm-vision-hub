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
      const { data: roles, error } = await supabase
        .from('pms_user_roles')
        .select('role, tenant_id, pms_tenants(id, name, slug)')
        .eq('user_id', user.id);

      if (error) throw error;

      if (roles && roles.length > 0) {
        setHasPMSAccess(true);
        setPMSRoles(roles.map(r => r.role as PMSRole));
        
        const tenant = roles[0].pms_tenants as any;
        if (tenant) {
          setCurrentTenant({
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug
          });
        }
      } else {
        setHasPMSAccess(false);
        setPMSRoles([]);
        setCurrentTenant(null);
      }
    } catch (error) {
      console.error('Error checking PMS access:', error);
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
