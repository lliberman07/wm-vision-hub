import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePMS } from "@/contexts/PMSContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Home, User, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Contract {
  id: string;
  contract_number: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  currency: string;
  status: string;
  property: {
    address: string;
    code: string;
  };
  tenant_renter: {
    full_name: string;
  };
}

interface ContractPaymentSelectorProps {
  onContractSelect: (contractId: string | null) => void;
  selectedContractId: string | null;
}

export function ContractPaymentSelector({
  onContractSelect,
  selectedContractId,
}: ContractPaymentSelectorProps) {
  const { currentTenant } = usePMS();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  useEffect(() => {
    if (currentTenant) {
      fetchContracts();
    }
  }, [currentTenant]);

  useEffect(() => {
    if (selectedContractId && contracts.length > 0) {
      const contract = contracts.find((c) => c.id === selectedContractId);
      setSelectedContract(contract || null);
    } else {
      setSelectedContract(null);
    }
  }, [selectedContractId, contracts]);

  const fetchContracts = async () => {
    if (!currentTenant) return;

    try {
      setLoading(false);
      const { data, error } = await supabase
        .from('pms_contracts')
        .select(`
          id,
          contract_number,
          start_date,
          end_date,
          monthly_rent,
          currency,
          status,
          property:pms_properties(address, code),
          tenant_renter:pms_tenants_renters(full_name)
        `)
        .eq('tenant_id', currentTenant.id)
        .in('status', ['active', 'expired'])
        .order('start_date', { ascending: false });

      if (error) throw error;
      setContracts(data as any);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      active: { label: "Activo", variant: "default" },
      expired: { label: "Vencido", variant: "secondary" },
    };
    const config = variants[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <Select value={selectedContractId || ""} onValueChange={onContractSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Seleccionar contrato..." />
        </SelectTrigger>
        <SelectContent>
          {contracts.map((contract) => (
            <SelectItem key={contract.id} value={contract.id}>
              {contract.contract_number}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedContract && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Propiedad</p>
                  <p className="text-sm font-medium">{selectedContract.property.code}</p>
                  <p className="text-xs text-muted-foreground">{selectedContract.property.address}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Inquilino</p>
                  <p className="text-sm font-medium">{selectedContract.tenant_renter.full_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Vigencia</p>
                  <p className="text-sm font-medium">
                    {format(new Date(selectedContract.start_date + 'T00:00:00'), 'dd/MM/yyyy')} -{' '}
                    {format(new Date(selectedContract.end_date + 'T00:00:00'), 'dd/MM/yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Monto Base</p>
                  <p className="text-sm font-medium">
                    {selectedContract.currency} ${selectedContract.monthly_rent.toLocaleString('es-AR')}
                  </p>
                  <div className="mt-1">{getStatusBadge(selectedContract.status)}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
