import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface ClientData {
  id: string;
  name: string;
  slug: string;
  tenant_type: string;
  settings: any;
  is_active: boolean;
}

interface SubscriptionData {
  id: string;
  plan_id: string;
  plan_name: string;
  status: string;
  start_date: string;
  end_date: string | null;
  trial_end_date: string | null;
  is_trial: boolean;
  auto_renew: boolean;
}

interface ClientContextType {
  isClientAdmin: boolean;
  clientData: ClientData | null;
  subscription: SubscriptionData | null;
  loading: boolean;
  refreshClientData: () => Promise<void>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const useClient = () => {
  const context = useContext(ClientContext);
  if (!context) {
    // Return default values when not within provider
    return {
      isClientAdmin: false,
      clientData: null,
      subscription: null,
      loading: false,
      refreshClientData: async () => {},
    };
  }
  return context;
};

export const ClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isClientAdmin, setIsClientAdmin] = useState(false);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshClientData = async () => {
    if (!user) {
      setIsClientAdmin(false);
      setClientData(null);
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      // Check if user has INMOBILIARIA or GESTOR role via v_current_user_tenants
      const { data: rolesData, error: rolesError } = await supabase
        .from('v_current_user_tenants')
        .select('*')
        .eq('user_id', user.id);

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
      }

      // Check if any tenant has INMOBILIARIA or GESTOR role
      // INMOBILIARIA users are owners/admins of their own tenant
      const adminTenant = rolesData?.find((row: any) => {
        const roles = row.roles || [];
        const hasInmobiliariaRole = roles.some((role: string) => 
          role.toUpperCase() === 'INMOBILIARIA'
        );
        const hasGestorRole = roles.some((role: string) => 
          role.toUpperCase() === 'GESTOR'
        );
        return hasInmobiliariaRole || hasGestorRole;
      });

      // Also check for CLIENT_ADMIN in pms_client_users
      const { data: clientUserData } = await supabase
        .from('pms_client_users')
        .select('tenant_id, user_type, is_active')
        .eq('user_id', user.id)
        .eq('user_type', 'CLIENT_ADMIN')
        .eq('is_active', true)
        .maybeSingle();

      const tenantId = adminTenant?.tenant_id || clientUserData?.tenant_id;
      const hasAdminAccess = !!(adminTenant || clientUserData);

      if (!hasAdminAccess || !tenantId) {
        setIsClientAdmin(false);
        setClientData(null);
        setSubscription(null);
        setLoading(false);
        return;
      }

      setIsClientAdmin(true);

      // Get client (tenant) data
      const { data: tenantData, error: tenantError } = await supabase
        .from('pms_tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

      if (tenantError) {
        console.error('Error fetching client data:', tenantError);
        setLoading(false);
        return;
      }

      setClientData(tenantData as ClientData);

      // Get subscription data
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('tenant_subscriptions')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!subscriptionError && subscriptionData) {
        // Get plan name separately
        const { data: planData } = await supabase
          .from('subscription_plans')
          .select('name')
          .eq('id', subscriptionData.plan_id)
          .single();

        const currentPeriodEnd = subscriptionData.current_period_end ? new Date(subscriptionData.current_period_end) : null;
        const now = new Date();
        const isTrial = currentPeriodEnd ? currentPeriodEnd > now && subscriptionData.status === 'trial' : false;

        setSubscription({
          id: subscriptionData.id,
          plan_id: subscriptionData.plan_id,
          plan_name: planData?.name || 'Plan Desconocido',
          status: subscriptionData.status,
          start_date: subscriptionData.created_at || '',
          end_date: subscriptionData.current_period_end,
          trial_end_date: isTrial ? subscriptionData.current_period_end : null,
          is_trial: isTrial,
          auto_renew: !subscriptionData.cancel_at_period_end,
        });
      }

    } catch (error) {
      console.error('Error in refreshClientData:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshClientData();
  }, [user]);

  const value = {
    isClientAdmin,
    clientData,
    subscription,
    loading,
    refreshClientData,
  };

  return (
    <ClientContext.Provider value={value}>
      {children}
    </ClientContext.Provider>
  );
};
