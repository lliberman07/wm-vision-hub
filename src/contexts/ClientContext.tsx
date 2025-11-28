import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from './UserProfileContext';

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
  const { user, granadaUser, loading: profileLoading } = useUserProfile();
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

    // Wait for profile to load
    if (profileLoading) {
      return;
    }

    try {
      // If Granada Platform user, NOT a ClientAdmin (use shared data)
      if (granadaUser?.is_active) {
        setIsClientAdmin(false);
        setClientData(null);
        setSubscription(null);
        setLoading(false);
        return;
      }

      // Parallelize independent queries
      const [rolesResult, clientUserResult] = await Promise.all([
        supabase
          .from('v_current_user_tenants')
          .select('*')
          .eq('user_id', user.id),
        supabase
          .from('pms_client_users')
          .select('tenant_id, user_type, is_active')
          .eq('user_id', user.id)
          .eq('user_type', 'CLIENT_ADMIN')
          .eq('is_active', true)
          .maybeSingle()
      ]);

      if (rolesResult.error) {
        console.error('Error fetching user roles:', rolesResult.error);
      }

      // Check if any tenant has INMOBILIARIA or GESTOR role
      const adminTenant = rolesResult.data?.find((row: any) => {
        const roles = row.roles || [];
        return roles.some((role: string) => 
          role.toUpperCase() === 'INMOBILIARIA' || role.toUpperCase() === 'GESTOR'
        );
      });

      const tenantId = adminTenant?.tenant_id || clientUserResult.data?.tenant_id;
      const hasAdminAccess = !!(adminTenant || clientUserResult.data);

      if (!hasAdminAccess || !tenantId) {
        setIsClientAdmin(false);
        setClientData(null);
        setSubscription(null);
        setLoading(false);
        return;
      }

      setIsClientAdmin(true);

      // Parallelize tenant and subscription queries
      const [tenantResult, subscriptionResult] = await Promise.all([
        supabase
          .from('pms_tenants')
          .select('*')
          .eq('id', tenantId)
          .single(),
        supabase
          .from('tenant_subscriptions')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
      ]);

      if (tenantResult.error) {
        console.error('Error fetching client data:', tenantResult.error);
        setLoading(false);
        return;
      }

      setClientData(tenantResult.data as ClientData);

      if (!subscriptionResult.error && subscriptionResult.data) {
        const { data: planData } = await supabase
          .from('subscription_plans')
          .select('name')
          .eq('id', subscriptionResult.data.plan_id)
          .single();

        const currentPeriodEnd = subscriptionResult.data.current_period_end 
          ? new Date(subscriptionResult.data.current_period_end) 
          : null;
        const now = new Date();
        const isTrial = currentPeriodEnd 
          ? currentPeriodEnd > now && subscriptionResult.data.status === 'trial' 
          : false;

        setSubscription({
          id: subscriptionResult.data.id,
          plan_id: subscriptionResult.data.plan_id,
          plan_name: planData?.name || 'Plan Desconocido',
          status: subscriptionResult.data.status,
          start_date: subscriptionResult.data.created_at || '',
          end_date: subscriptionResult.data.current_period_end,
          trial_end_date: isTrial ? subscriptionResult.data.current_period_end : null,
          is_trial: isTrial,
          auto_renew: !subscriptionResult.data.cancel_at_period_end,
        });
      }

    } catch (error) {
      console.error('Error in refreshClientData:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!profileLoading) {
      refreshClientData();
    }
  }, [user, profileLoading, granadaUser]);

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
