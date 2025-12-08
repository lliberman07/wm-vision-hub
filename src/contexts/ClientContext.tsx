import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
  is_addon?: boolean;
  display_order?: number;
}

interface AggregatedSubscriptionData {
  subscriptions: SubscriptionData[];
  primary_subscription: SubscriptionData | null;
  aggregated_limits: {
    max_users: number;
    max_properties: number | null;
    max_contracts: number | null;
    max_branches: number;
  };
  aggregated_features: Record<string, boolean>;
}

interface ClientContextType {
  isClientAdmin: boolean;
  clientData: ClientData | null;
  subscription: SubscriptionData | null; // Primary subscription (legacy compatibility)
  subscriptionData: AggregatedSubscriptionData | null; // Full aggregated data
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
      subscriptionData: null,
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
  const [subscriptionData, setSubscriptionData] = useState<AggregatedSubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshClientData = async () => {
    if (!user) {
      setIsClientAdmin(false);
      setClientData(null);
      setSubscription(null);
      setSubscriptionData(null);
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
        setSubscriptionData(null);
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

      // Check if any tenant has INMOBILIARIA, GESTOR, or PROPIETARIO (with propietario tenant) role
      const adminTenant = rolesResult.data?.find((row: any) => {
        const roles = row.roles || [];
        const tenantType = row.type; // tenant_type from v_current_user_tenants
        return roles.some((role: string) => {
          const upperRole = role.toUpperCase();
          return upperRole === 'INMOBILIARIA' || 
                 upperRole === 'GESTOR' ||
                 (upperRole === 'PROPIETARIO' && tenantType === 'propietario');
        });
      });

      const tenantId = adminTenant?.tenant_id || clientUserResult.data?.tenant_id;
      const hasAdminAccess = !!(adminTenant || clientUserResult.data);

      if (!hasAdminAccess || !tenantId) {
        setIsClientAdmin(false);
        setClientData(null);
        setSubscription(null);
        setSubscriptionData(null);
        setLoading(false);
        return;
      }

      setIsClientAdmin(true);

      // Parallelize tenant and subscription status queries
      const [tenantResult, subscriptionStatusResult] = await Promise.all([
        supabase
          .from('pms_tenants')
          .select('*')
          .eq('id', tenantId)
          .single(),
        supabase.rpc('get_tenant_subscription_status', {
          p_tenant_id: tenantId
        })
      ]);

      if (tenantResult.error) {
        console.error('Error fetching client data:', tenantResult.error);
        setLoading(false);
        return;
      }

      setClientData(tenantResult.data as ClientData);

      if (!subscriptionStatusResult.error && subscriptionStatusResult.data) {
        const rawData = subscriptionStatusResult.data as any;
        
        // Build subscriptions array with plan names
        const subscriptions: SubscriptionData[] = (rawData.subscriptions || []).map((sub: any) => {
          const currentPeriodEnd = sub.current_period_end 
            ? new Date(sub.current_period_end) 
            : null;
          const now = new Date();
          const isTrial = currentPeriodEnd 
            ? currentPeriodEnd > now && sub.status === 'trial' 
            : false;

          return {
            id: sub.id,
            plan_id: sub.plan_id,
            plan_name: sub.plan_name || 'Plan Desconocido',
            status: sub.status,
            start_date: sub.current_period_start || '',
            end_date: sub.current_period_end,
            trial_end_date: isTrial ? sub.current_period_end : null,
            is_trial: isTrial,
            auto_renew: !sub.cancel_at_period_end,
            is_addon: sub.is_addon || false,
            display_order: sub.display_order || 0,
          };
        });

        // Set aggregated subscription data
        setSubscriptionData({
          subscriptions,
          primary_subscription: subscriptions.find(s => !s.is_addon) || subscriptions[0] || null,
          aggregated_limits: rawData.aggregated_limits || {
            max_users: 0,
            max_properties: 0,
            max_contracts: 0,
            max_branches: 0,
          },
          aggregated_features: rawData.aggregated_features || {},
        });

        // Set primary subscription for legacy compatibility
        const primary = subscriptions.find(s => !s.is_addon) || subscriptions[0];
        setSubscription(primary || null);
      } else {
        setSubscription(null);
        setSubscriptionData(null);
      }

    } catch (error) {
      console.error('Error in refreshClientData:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profileLoading) {
      setLoading(true);
    } else {
      refreshClientData();
    }
  }, [user, profileLoading, granadaUser]);

  const value = useMemo(() => ({
    isClientAdmin,
    clientData,
    subscription,
    subscriptionData,
    loading,
    refreshClientData,
  }), [isClientAdmin, clientData, subscription, subscriptionData, loading]);

  return (
    <ClientContext.Provider value={value}>
      {children}
    </ClientContext.Provider>
  );
};
