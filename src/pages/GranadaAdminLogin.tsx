import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import granadaLogo from "@/assets/granada-logo-full.jpg";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const GranadaAdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in with Granada role
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const hasGranadaRole = await verifyGranadaRole(session.user.id);
      if (hasGranadaRole) {
        navigate("/granada-admin");
      }
    }
  };

  const verifyGranadaRole = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('granada_platform_users')
        .select('role, is_active')
        .eq('user_id', userId)
        .single();

      if (error || !data || !data.is_active) {
        return false;
      }

      const validRoles = ['GRANADA_ADMIN', 'GRANADA_SUPERADMIN'];
      return validRoles.includes(data.role);
    } catch (error) {
      console.error('Error verifying Granada role:', error);
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Sign in with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        toast.error("Error al iniciar sesión", {
          description: signInError.message,
        });
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError("Error al obtener información del usuario");
        setLoading(false);
        return;
      }

      // Verify Granada role
      const hasGranadaRole = await verifyGranadaRole(data.user.id);

      if (!hasGranadaRole) {
        // Sign out if user doesn't have Granada role
        await supabase.auth.signOut();
        setError("No tienes permisos para acceder al panel de administración de Granada Platform. Este acceso es exclusivo para administradores de la plataforma.");
        toast.error("Acceso denegado", {
          description: "No tienes permisos para acceder a Granada Admin",
        });
        setLoading(false);
        return;
      }

      // Success - redirect to Granada Admin
      toast.success("Inicio de sesión exitoso");
      navigate("/granada-admin");
    } catch (error: any) {
      console.error('Login error:', error);
      setError("Error inesperado al iniciar sesión");
      toast.error("Error", {
        description: "Ocurrió un error inesperado",
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md space-y-2">
        {/* Logo and Header */}
        <div className="text-center space-y-1">
          <div className="flex justify-center">
            <img 
              src={granadaLogo} 
              alt="Granada Platform" 
              className="h-80 w-auto object-contain mx-auto transition-transform duration-300 hover:scale-105 cursor-pointer animate-fade-in"
            />
          </div>
          <div>
            <p className="text-muted-foreground">Panel de Administración Granada Platform</p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Acceso Administrativo</CardTitle>
            <CardDescription>
              Este panel es exclusivo para administradores de Granada Platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@granadaplatform.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Back to home */}
        <div className="text-center space-y-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/granada-platform")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Granada Platform
          </Button>
          
          <div className="text-sm text-muted-foreground">
            <p>¿Eres cliente? <a href="/pms/login" className="text-primary hover:underline">Accede al PMS aquí</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GranadaAdminLogin;
