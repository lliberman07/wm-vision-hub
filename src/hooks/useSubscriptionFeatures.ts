import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePMS } from '@/contexts/PMSContext';

interface SubscriptionInfo {
  id: string;
  plan_id: string;
  plan_name: string;
  status: string;
  billing_cycle: string;
  current_period_start: string;
  current_period_end: string;
  days_remaining: number;
  cancel_at_period_end: boolean;
  is_addon: boolean;
  display_order: number;
}

interface AggregatedLimits {
  max_users: number;
  max_properties: number | null;
  max_contracts: number | null;
  max_branches: number;
}

interface AggregatedFeatures {
  [key: string]: boolean;
}

interface UsageInfo {
  user_count: number;
  property_count: number;
  contract_count: number;
  branch_count: number;
}

interface PendingInvoice {
  id: string;
  amount: number;
  due_date: string;
  status: string;
  days_overdue: number;
}

interface SubscriptionStatus {
  has_subscription: boolean;
  subscriptions: SubscriptionInfo[];
  primary_subscription?: SubscriptionInfo;
  aggregated_limits: AggregatedLimits;
  aggregated_features: AggregatedFeatures;
  usage: UsageInfo;
  pending_invoice?: PendingInvoice;
  message?: string;
  // Legacy compatibility - points to primary subscription
  subscription?: {
    id: string;
    status: string;
    billing_cycle: string;
    current_period_start: string;
    current_period_end: string;
    days_remaining: number;
    cancel_at_period_end: boolean;
  };
  plan?: {
    id: string;
    name: string;
    max_users: number;
    max_properties: number | null;
    max_contracts: number | null;
    max_branches: number;
    features: Record<string, boolean>;
    additional_limits: Record<string, number | null>;
  };
}

export function useSubscriptionFeatures() {
  const { currentTenant } = usePMS();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentTenant) {
      fetchSubscriptionStatus();
    }
  }, [currentTenant]);

  const fetchSubscriptionStatus = async () => {
    if (!currentTenant) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_tenant_subscription_status', {
        p_tenant_id: currentTenant.id
      });

      if (error) throw error;

      const rawData = data as any;
      
      // Transform response to include legacy compatibility
      const transformed: SubscriptionStatus = {
        has_subscription: rawData.has_subscription,
        subscriptions: rawData.subscriptions || [],
        primary_subscription: rawData.primary_subscription,
        aggregated_limits: rawData.aggregated_limits || {
          max_users: 0,
          max_properties: 0,
          max_contracts: 0,
          max_branches: 0
        },
        aggregated_features: rawData.aggregated_features || {},
        usage: rawData.usage || {
          user_count: 0,
          property_count: 0,
          contract_count: 0,
          branch_count: 0
        },
        pending_invoice: rawData.pending_invoice,
        message: rawData.message,
        // Legacy compatibility mappings
        subscription: rawData.primary_subscription ? {
          id: rawData.primary_subscription.id,
          status: rawData.primary_subscription.status,
          billing_cycle: rawData.primary_subscription.billing_cycle,
          current_period_start: rawData.primary_subscription.current_period_start,
          current_period_end: rawData.primary_subscription.current_period_end,
          days_remaining: rawData.primary_subscription.days_remaining,
          cancel_at_period_end: rawData.primary_subscription.cancel_at_period_end,
        } : undefined,
        plan: rawData.primary_subscription ? {
          id: rawData.primary_subscription.plan_id,
          name: rawData.primary_subscription.plan_name,
          max_users: rawData.aggregated_limits?.max_users || 0,
          max_properties: rawData.aggregated_limits?.max_properties,
          max_contracts: rawData.aggregated_limits?.max_contracts,
          max_branches: rawData.aggregated_limits?.max_branches || 0,
          features: rawData.aggregated_features || {},
          additional_limits: {},
        } : undefined,
      };

      setSubscriptionStatus(transformed);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasFeature = (featureName: string): boolean => {
    if (!subscriptionStatus) return false;
    // Use aggregated features (OR logic across all subscriptions)
    return subscriptionStatus.aggregated_features[featureName] === true;
  };

  const isSubscriptionActive = (): boolean => {
    if (!subscriptionStatus?.subscriptions?.length) return false;
    // At least one subscription must be active or trial
    return subscriptionStatus.subscriptions.some(sub => 
      ['active', 'trial'].includes(sub.status)
    );
  };

  const getUsagePercentage = (resourceType: 'user' | 'property' | 'contract' | 'branch'): number => {
    if (!subscriptionStatus?.usage || !subscriptionStatus?.aggregated_limits) return 0;

    const usage = subscriptionStatus.usage;
    const limits = subscriptionStatus.aggregated_limits;

    let current = 0;
    let limit: number | null = null;

    switch (resourceType) {
      case 'user':
        current = usage.user_count;
        limit = limits.max_users;
        break;
      case 'property':
        current = usage.property_count;
        limit = limits.max_properties;
        break;
      case 'contract':
        current = usage.contract_count;
        limit = limits.max_contracts;
        break;
      case 'branch':
        current = usage.branch_count;
        limit = limits.max_branches;
        break;
    }

    if (limit === null) return 0; // Unlimited
    if (limit === 0) return 100; // Not allowed

    return Math.round((current / limit) * 100);
  };

  // Get all active subscriptions (base + addons)
  const getActiveSubscriptions = (): SubscriptionInfo[] => {
    if (!subscriptionStatus?.subscriptions) return [];
    return subscriptionStatus.subscriptions.filter(sub => 
      ['active', 'trial'].includes(sub.status)
    );
  };

  // Get addon subscriptions only
  const getAddonSubscriptions = (): SubscriptionInfo[] => {
    return getActiveSubscriptions().filter(sub => sub.is_addon);
  };

  // Get base subscription (non-addon)
  const getBaseSubscription = (): SubscriptionInfo | undefined => {
    return getActiveSubscriptions().find(sub => !sub.is_addon);
  };

  return {
    subscriptionStatus,
    loading,
    hasFeature,
    isSubscriptionActive,
    getUsagePercentage,
    getActiveSubscriptions,
    getAddonSubscriptions,
    getBaseSubscription,
    refetch: fetchSubscriptionStatus
  };
}
