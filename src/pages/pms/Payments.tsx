import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePMS } from '@/contexts/PMSContext';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PMSLayout } from '@/components/pms/PMSLayout';
import { PaymentsDashboard } from '@/components/pms/PaymentsDashboard';
import { ContractPaymentSelector } from '@/components/pms/ContractPaymentSelector';
import { PaymentScheduleView } from '@/components/pms/PaymentScheduleView';
import { PaymentSubmissionsTable } from '@/components/pms/PaymentSubmissionsTable';

const Payments = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentTenant, hasPMSAccess } = usePMS();
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);

  if (!user || !hasPMSAccess) {
    navigate('/pms');
    return null;
  }

  return (
    <PMSLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Gestión de Pagos</h1>
          <p className="text-muted-foreground">{currentTenant?.name}</p>
        </div>

        <PaymentsDashboard />

        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="schedule">Calendario de Pagos</TabsTrigger>
            <TabsTrigger value="submissions">Pagos Informados</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-6">
            <ContractPaymentSelector
              onContractSelect={(id) => setSelectedContractId(id)}
              selectedContractId={selectedContractId}
            />
            {selectedContractId && (
              <PaymentScheduleView
                contractId={selectedContractId}
              />
            )}
          </TabsContent>

          <TabsContent value="submissions">
            <PaymentSubmissionsTable />
          </TabsContent>
        </Tabs>
      </div>
    </PMSLayout>
  );
};

export default Payments;
