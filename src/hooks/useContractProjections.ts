import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ContractProjection {
  id: string;
  month_number: number;
  period_date: string;
  item: 'A' | 'B';
  base_amount: number;
  adjustment_applied: boolean;
  adjustment_percentage: number;
  adjusted_amount: number;
  indices_used: any;
  pending_indices: boolean;
}

export const useContractProjections = (contractId: string | undefined) => {
  const [projections, setProjections] = useState<ContractProjection[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!contractId) {
      setProjections([]);
      setLoading(false);
      return;
    }

    const fetchProjections = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('pms_contract_monthly_projections')
          .select('*')
          .eq('contract_id', contractId)
          .order('period_date', { ascending: true })
          .order('item', { ascending: true });

        if (error) throw error;
        setProjections((data || []) as ContractProjection[]);
      } catch (error: any) {
        console.error('Error fetching projections:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las proyecciones mensuales",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProjections();

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('contract-projections-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pms_contract_monthly_projections',
          filter: `contract_id=eq.${contractId}`,
        },
        () => {
          fetchProjections();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contractId, toast]);

  return { projections, loading };
};
