import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePMS } from '@/contexts/PMSContext';

interface SubscriptionStatus {
  has_subscription: boolean;
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
  usage?: {
    user_count: number;
    property_count: number;
    contract_count: number;
    branch_count: number;
  };
  pending_invoice?: {
    id: string;
    amount: number;
    due_date: string;
    status: string;
    days_overdue: number;
  };
  message?: string;
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

      setSubscriptionStatus(data as unknown as SubscriptionStatus);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasFeature = (featureName: string): boolean => {
    if (!subscriptionStatus?.plan) return false;
    return subscriptionStatus.plan.features[featureName] === true;
  };

  const isSubscriptionActive = (): boolean => {
    if (!subscriptionStatus?.subscription) return false;
    return ['active', 'trial'].includes(subscriptionStatus.subscription.status);
  };

  const getUsagePercentage = (resourceType: 'user' | 'property' | 'contract' | 'branch'): number => {
    if (!subscriptionStatus?.usage || !subscriptionStatus?.plan) return 0;

    const usage = subscriptionStatus.usage;
    const plan = subscriptionStatus.plan;

    let current = 0;
    let limit: number | null = null;

    switch (resourceType) {
      case 'user':
        current = usage.user_count;
        limit = plan.max_users;
        break;
      case 'property':
        current = usage.property_count;
        limit = plan.max_properties;
        break;
      case 'contract':
        current = usage.contract_count;
        limit = plan.max_contracts;
        break;
      case 'branch':
        current = usage.branch_count;
        limit = plan.max_branches;
        break;
    }

    if (limit === null) return 0; // Ilimitado
    if (limit === 0) return 100; // Sin permitido

    return Math.round((current / limit) * 100);
  };

  return {
    subscriptionStatus,
    loading,
    hasFeature,
    isSubscriptionActive,
    getUsagePercentage,
    refetch: fetchSubscriptionStatus
  };
}