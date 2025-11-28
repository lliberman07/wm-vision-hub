import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ShieldQuestion } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePMS } from "@/contexts/PMSContext";
import { PMSLayout } from "@/components/pms/PMSLayout";
import { useToast } from "@/components/ui/use-toast";

const PMSRequestAccess = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { hasPMSAccess } = usePMS();
  const { toast } = useToast();

  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/pms/login");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (hasPMSAccess) {
      navigate("/pms");
    }
  }, [hasPMSAccess, navigate]);

  const handleSubmit = async () => {
    if (!user) return;

    try {
      setSubmitting(true);

      const { error } = await supabase.from("access_requests").insert({
        user_id: user.id,
        module: "PMS",
        requested_roles: ["admin"],
        reason: reason || null,
      });

      if (error) {
        console.error("Error creating access request", error);
        toast({
          title: "Error al solicitar acceso",
          description:
            "Ocurrió un problema al enviar tu solicitud. Intenta nuevamente más tarde.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Solicitud enviada",
        description:
          "Tu solicitud de acceso al PMS fue registrada. Un administrador la revisará pronto.",
      });

      navigate("/pms");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PMSLayout>
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <Card className="w-full max-w-xl">
          <CardHeader className="flex flex-row items-start gap-3">
            <div className="mt-1 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 p-2">
              <ShieldQuestion className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Solicitar acceso al PMS</CardTitle>
              <CardDescription>
                Envía una solicitud para que un administrador te otorgue permisos de acceso al sistema de gestión de propiedades.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Motivo de la solicitud (opcional)
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej. Soy parte del equipo de administración y necesito gestionar propiedades y contratos."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => navigate("/pms")}
              >
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar solicitud
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PMSLayout>
  );
};

export default PMSRequestAccess;
