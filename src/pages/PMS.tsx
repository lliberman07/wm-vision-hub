import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePMS } from '@/contexts/PMSContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Building2, Users, FileText, Wrench, DollarSign, BarChart3 } from 'lucide-react';

const PMS = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { hasPMSAccess, pmsRoles, currentTenant, loading: pmsLoading } = usePMS();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/pms/login');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || pmsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasPMSAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acceso al PMS Requerido</CardTitle>
            <CardDescription>
              No tienes acceso al sistema de gestión de propiedades. 
              Solicita acceso a un administrador.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/pms/request-access')} className="w-full">
              Solicitar Acceso
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">WM Admin Prop</h1>
          <p className="text-muted-foreground">
            {currentTenant?.name} • Rol: {pmsRoles.join(', ')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Propiedades</CardTitle>
                  <CardDescription>Gestión de inmuebles</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Administra el portafolio de propiedades
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Propietarios</CardTitle>
                  <CardDescription>Gestión de dueños</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Administra información de propietarios
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Inquilinos</CardTitle>
                  <CardDescription>Gestión de arrendatarios</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Administra información de inquilinos
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Contratos</CardTitle>
                  <CardDescription>Gestión de contratos</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Crea y administra contratos de alquiler
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Pagos</CardTitle>
                  <CardDescription>Gestión de cobros</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Controla pagos y vencimientos
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Wrench className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Mantenimiento</CardTitle>
                  <CardDescription>Solicitudes de reparación</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Gestiona solicitudes de mantenimiento
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Reportes</CardTitle>
                  <CardDescription>Análisis y estadísticas</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Visualiza métricas del negocio
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PMS;
