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
  const [showResetPassword, setShowResetPassword] = useState(false);
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Pasar el email directamente a la edge function
      const { data, error: functionError } = await supabase.functions.invoke('reset-user-password', {
        body: { email }
      });

      if (functionError) {
        const errorMessage = data?.error || functionError.message;
        setError(errorMessage);
        toast.error("Error al enviar email de recuperación", {
          description: errorMessage,
        });
      } else if (data?.error) {
        setError(data.error);
        toast.error("Error", {
          description: data.error,
        });
      } else {
        toast.success("Email enviado exitosamente", {
          description: "Revisa tu correo. Te enviamos un link para crear una nueva contraseña (válido por 1 hora).",
        });
        setShowResetPassword(false);
        setEmail(""); // Clear email field
      }
    } catch (error: any) {
      setError(error.message);
      toast.error("Error", {
        description: error.message,
      });
    }

    setLoading(false);
  };

  return (
    <div className="granada-theme min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
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
            {showResetPassword ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
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
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(""); // Clear errors when typing
                    }}
                    required
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Te enviaremos un link seguro para crear una nueva contraseña
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Enviando link..." : "Enviar Link de Recuperación"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowResetPassword(false);
                    setError("");
                  }}
                  className="w-full"
                  disabled={loading}
                >
                  Volver al inicio de sesión
                </Button>
              </form>
            ) : (
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

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
              </form>
            )}
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
