import { useEffect } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { useClient } from '@/contexts/ClientContext';
import { useGranadaAuth } from '@/contexts/GranadaAuthContext';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClientAdminLayout } from '@/components/client-admin/ClientAdminLayout';
import { ClientAdminDashboard } from '@/components/client-admin/ClientAdminDashboard';
import { ClientAnalyticsDashboard } from '@/components/client-admin/ClientAnalyticsDashboard';
import { ClientUsersManagement } from '@/components/client-admin/ClientUsersManagement';
import { ClientSubscriptionPanel } from '@/components/client-admin/ClientSubscriptionPanel';
import { ClientReportsPanel } from '@/components/client-admin/ClientReportsPanel';
import { ClientSettings } from '@/components/client-admin/ClientSettings';
import { CommissionTrackingDashboard } from '@/components/client-admin/CommissionTrackingDashboard';

export default function ClientAdmin() {
  const navigate = useNavigate();
  const { isClientAdmin, loading } = useClient();
  const { isGranadaSuperAdmin } = useGranadaAuth();

  // Block GRANADA_SUPERADMIN from accessing /client-admin
  useEffect(() => {
    if (!loading && isGranadaSuperAdmin) {
      navigate('/granada-admin');
      return;
    }
    
    if (!loading && !isClientAdmin) {
      navigate('/pms');
    }
  }, [isClientAdmin, isGranadaSuperAdmin, loading, navigate]);

  // Also block rendering
  if (isGranadaSuperAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isClientAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acceso Denegado</CardTitle>
            <CardDescription>
              No tienes permisos de CLIENT_ADMIN.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/pms')} className="w-full">
              Volver al PMS
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ClientAdminLayout>
      <Routes>
        <Route path="/" element={<ClientAdminDashboard />} />
        <Route path="/analytics" element={<ClientAnalyticsDashboard />} />
        <Route path="/users" element={<ClientUsersManagement />} />
        <Route path="/subscription" element={<ClientSubscriptionPanel />} />
        <Route path="/commissions" element={<CommissionTrackingDashboard />} />
        <Route path="/reports" element={<ClientReportsPanel />} />
        <Route path="/settings" element={<ClientSettings />} />
      </Routes>
    </ClientAdminLayout>
  );
}
