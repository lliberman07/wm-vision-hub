import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePMS } from '@/contexts/PMSContext';

interface LimitCheck {
  allowed: boolean;
  reason: string;
  current_count: number;
  limit: number | null;
}

export function useSubscriptionLimits() {
  const { currentTenant } = usePMS();
  const [loading, setLoading] = useState(false);

  const checkLimit = async (resourceType: 'user' | 'property' | 'contract' | 'branch'): Promise<LimitCheck> => {
    if (!currentTenant) {
      return {
        allowed: false,
        reason: 'No hay tenant seleccionado',
        current_count: 0,
        limit: 0
      };
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('check_tenant_limits', {
        p_tenant_id: currentTenant.id,
        p_resource_type: resourceType
      });

      if (error) throw error;

      return data as unknown as LimitCheck;
    } catch (error) {
      console.error('Error checking limit:', error);
      return {
        allowed: false,
        reason: 'Error al verificar límite',
        current_count: 0,
        limit: 0
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    checkLimit,
    loading
  };
}