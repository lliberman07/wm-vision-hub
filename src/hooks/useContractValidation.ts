import { supabase } from '@/integrations/supabase/client';
import { formatDateForDB } from '@/utils/dateUtils';

interface ContractConflict {
  hasConflict: boolean;
  activeContract?: {
    id: string;
    contract_number: string;
    tenant_name: string;
    start_date: string;
    end_date: string;
    status: string;
  };
  message?: string;
}

export function useContractValidation() {
  const checkPropertyAvailability = async (
    propertyId: string,
    startDate: Date,
    endDate: Date,
    currentContractId?: string
  ): Promise<ContractConflict> => {
    // 1. Buscar contratos activos de la propiedad
    const { data: activeContracts } = await supabase
      .from('pms_contracts')
      .select(`
        id,
        contract_number,
        start_date,
        end_date,
        status,
        pms_tenants_renters!inner(full_name)
      `)
      .eq('property_id', propertyId)
      .in('status', ['active', 'draft'])
      .neq('id', currentContractId || '')
      .order('start_date', { ascending: true });

    if (!activeContracts || activeContracts.length === 0) {
      return { hasConflict: false };
    }

    // 2. Verificar superposición de fechas
    const startStr = formatDateForDB(startDate);
    const endStr = formatDateForDB(endDate);

    for (const contract of activeContracts) {
      const contractStart = contract.start_date;
      const contractEnd = contract.end_date;

      // Lógica de superposición: Hay conflicto SI: (start1 <= end2) AND (end1 >= start2)
      const hasOverlap = startStr <= contractEnd && endStr >= contractStart;

      // Excepción: Si el nuevo contrato inicia justo después del anterior, permitir (renovación secuencial)
      const nextDay = new Date(contractEnd);
      nextDay.setDate(nextDay.getDate() + 1);
      const isSequentialRenewal = startStr === formatDateForDB(nextDay);

      if (hasOverlap && !isSequentialRenewal) {
        return {
          hasConflict: true,
          activeContract: {
            id: contract.id,
            contract_number: contract.contract_number,
            tenant_name: contract.pms_tenants_renters.full_name,
            start_date: contract.start_date,
            end_date: contract.end_date,
            status: contract.status
          },
          message: `Superposición de fechas con contrato ${contract.contract_number}`
        };
      }
    }

    return { hasConflict: false };
  };

  return { checkPropertyAvailability };
}
