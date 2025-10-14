import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PropertyStatus {
  status: string | null;
  contract: any | null;
  isAutomatic: boolean;
  loading: boolean;
}

export const usePropertyStatus = (propertyId: string | undefined) => {
  const [state, setState] = useState<PropertyStatus>({
    status: null,
    contract: null,
    isAutomatic: false,
    loading: true
  });

  const refresh = async () => {
    if (!propertyId) {
      setState({ status: null, contract: null, isAutomatic: false, loading: false });
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      // Obtener propiedad
      const { data: property } = await supabase
        .from('pms_properties')
        .select('status')
        .eq('id', propertyId)
        .single();

      // Buscar contrato activo
      const { data: contract } = await supabase
        .from('pms_contracts')
        .select('*')
        .eq('property_id', propertyId)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString().split('T')[0])
        .lte('start_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Si está en mantenimiento, es manual
      const isManualMaintenance = property?.status === 'maintenance';
      
      // Si hay contrato activo y el status es 'rented', es automático
      const isAutoRented = contract && property?.status === 'rented';
      
      // Si no hay contrato y el status es 'available', es automático
      const isAutoAvailable = !contract && property?.status === 'available';

      const isAutomatic = !isManualMaintenance && (isAutoRented || isAutoAvailable);

      setState({
        status: property?.status || null,
        contract: contract || null,
        isAutomatic,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching property status:', error);
      setState({ status: null, contract: null, isAutomatic: false, loading: false });
    }
  };

  useEffect(() => {
    refresh();
  }, [propertyId]);

  return { ...state, refresh };
};
