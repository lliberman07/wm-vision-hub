import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGranadaAuth } from '@/contexts/GranadaAuthContext';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function GranadaAdmin() {
  const navigate = useNavigate();
  const { user, isGranadaAdmin, loading } = useGranadaAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/pms/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isGranadaAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acceso Denegado</CardTitle>
            <CardDescription>
              No tienes permisos de administrador de Granada Platform.
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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Granada Platform Admin</h1>
          <p className="text-muted-foreground">Panel de administración del sistema</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Clientes Suscriptores</CardTitle>
              <CardDescription>Gestionar inmobiliarias, administradores y propietarios</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/granada-admin/clients')} className="w-full">
                Ver Clientes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Suscripciones</CardTitle>
              <CardDescription>Administrar planes y pagos</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/granada-admin/subscriptions')} className="w-full">
                Ver Suscripciones
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usuarios Granada</CardTitle>
              <CardDescription>Administradores de la plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/granada-admin/platform-users')} className="w-full">
                Ver Usuarios
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reportes Globales</CardTitle>
              <CardDescription>Estadísticas y métricas del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/granada-admin/reports')} className="w-full">
                Ver Reportes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transferencias</CardTitle>
              <CardDescription>Gestionar transferencias de propiedades</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/granada-admin/transfers')} className="w-full">
                Ver Transferencias
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuración</CardTitle>
              <CardDescription>Configuración general del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/granada-admin/settings')} className="w-full">
                Configuración
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
