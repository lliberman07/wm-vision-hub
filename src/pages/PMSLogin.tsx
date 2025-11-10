import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Home } from "lucide-react";
import granadaLogo from "@/assets/granada-logo-full.jpg";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const PMSLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const { signIn, user, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect');

  useEffect(() => {
    if (user) {
      // Redirect to the requested path or default to /pms
      navigate(redirectPath || "/pms");
    }
  }, [user, navigate, redirectPath]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      toast.error("Error al iniciar sesión", {
        description: error.message,
      });
    } else {
      toast.success("Inicio de sesión exitoso");
      // Redirect to the requested path or default to /pms
      navigate(redirectPath || "/pms");
    }

    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await resetPassword(email);

    if (error) {
      setError(error.message);
      toast.error("Error al enviar email de recuperación", {
        description: error.message,
      });
    } else {
      toast.success("Email enviado", {
        description: "Revisa tu correo para restablecer tu contraseña",
      });
      setShowResetPassword(false);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src={granadaLogo} 
              alt="Granada Property Management" 
              className="h-48 w-auto object-contain mx-auto transition-transform duration-300 hover:scale-105 cursor-pointer animate-fade-in"
            />
          </div>
          <div>
            <p className="text-muted-foreground">Sistema de Gestión de Propiedades</p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Acceso al Sistema</CardTitle>
            <CardDescription>
              Ingrese sus credenciales para acceder al sistema PMS
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
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Enviando..." : "Enviar Instrucciones"}
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
                    placeholder="correo@ejemplo.com"
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
                    placeholder="••••••••"
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

                <div className="space-y-3 mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        ¿No tienes acceso al sistema PMS?
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/pms/request-access')}
                    className="w-full"
                  >
                    Solicitar Acceso
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">Sistema de gestión exclusivo para usuarios autorizados</p>
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-sm"
          >
            <Home className="h-4 w-4 mr-2" />
            Volver a la página de inicio
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PMSLogin;
