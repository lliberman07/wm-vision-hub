import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useGranadaAuth } from '@/contexts/GranadaAuthContext';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface GranadaProtectedRouteProps {
  children: React.ReactNode;
}

const GranadaProtectedRoute = ({ children }: GranadaProtectedRouteProps) => {
  const { user, isGranadaAdmin, loading } = useGranadaAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      setIsChecking(false);
    }
  }, [loading]);

  // Show loading state while checking authentication
  if (isChecking || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/granada-admin/login" replace />;
  }

  // Show access denied if not Granada admin
  if (!isGranadaAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Acceso Denegado</CardTitle>
            <CardDescription>
              No tienes permisos para acceder al panel de administración de Granada Platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Solo administradores de Granada Platform pueden acceder a esta sección.
            </p>
            <div className="flex gap-2">
              <a href="/granada-platform" className="text-sm text-primary hover:underline">
                Volver a Granada Platform
              </a>
              <span className="text-sm text-muted-foreground">|</span>
              <a href="/pms" className="text-sm text-primary hover:underline">
                Ir al PMS
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is authenticated and has Granada admin access
  return <>{children}</>;
};

export default GranadaProtectedRoute;
