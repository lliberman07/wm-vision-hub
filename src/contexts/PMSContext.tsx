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
  requestAccess: (role: PMSRole, reason: string) => Promise<{ error: any }>;
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

  const requestAccess = async (role: PMSRole, reason: string) => {
    if (!user) {
      return { error: { message: 'You must be logged in to request access' } };
    }

    try {
      const { data: defaultTenant, error: tenantError } = await supabase
        .from('pms_tenants')
        .select('id')
        .eq('slug', 'wm-default')
        .maybeSingle();

      if (tenantError) {
        console.error('Error fetching default tenant:', tenantError);
        return { error: { message: 'Error al obtener tenant predeterminado' } };
      }

      if (!defaultTenant) {
        return { error: { message: 'Tenant predeterminado no encontrado. Contacte al administrador.' } };
      }

      const { error } = await supabase
        .from('pms_access_requests')
        .insert({
          user_id: user.id,
          tenant_id: defaultTenant.id,
          requested_role: role,
          reason: reason
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
