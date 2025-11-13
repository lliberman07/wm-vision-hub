import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

type PMSRole = 'SUPERADMIN' | 'INMOBILIARIA' | 'GESTOR' | 'PROPIETARIO' | 'INQUILINO' | 'PROVEEDOR';

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
    checkPMSAccess,
  };

  return (
    <PMSContext.Provider value={value}>
      {children}
    </PMSContext.Provider>
  );
};
