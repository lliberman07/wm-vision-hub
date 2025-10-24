import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Loader2, Download, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OwnerReportExportDialogProps {
  contractId: string;
  propertyId: string;
  contractStartDate: string;
  contractEndDate: string;
  children: React.ReactNode;
  sendEmail?: boolean;
}

interface Owner {
  id: string;
  full_name: string;
  email: string;
  share_percent: number;
}

export const OwnerReportExportDialog = ({
  contractId,
  propertyId,
  contractStartDate,
  contractEndDate,
  children,
  sendEmail = false,
}: OwnerReportExportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [additionalEmail, setAdditionalEmail] = useState("");
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      fetchOwners();
      generateAvailablePeriods();
    }
  }, [open]);

  const fetchOwners = async () => {
    console.log("Fetching owners for property:", propertyId);
    const { data, error } = await supabase
      .from("pms_owner_properties")
      .select(`
        owner_id,
        share_percent,
        pms_owners!inner(id, full_name, email)
      `)
      .eq("property_id", propertyId)
      .gt("share_percent", 0)
      .or("end_date.is.null,end_date.gte." + new Date().toISOString().split('T')[0]);

    if (error) {
      console.error("Error fetching owners:", error);
      toast.error("Error al cargar propietarios");
      return;
    }

    console.log("Owners data received:", data);

    const ownersData = data.map((item: any) => ({
      id: item.pms_owners.id,
      full_name: item.pms_owners.full_name,
      email: item.pms_owners.email,
      share_percent: item.share_percent,
    }));

    console.log("Processed owners:", ownersData);
    setOwners(ownersData);
  };

  const generateAvailablePeriods = () => {
    const start = new Date(contractStartDate);
    const end = new Date(contractEndDate);
    const now = new Date();
    const periods: string[] = [];

    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    // Incluir el mes en curso
    const lastAvailable = new Date(now.getFullYear(), now.getMonth(), 1);

    while (current <= end && current <= lastAvailable) {
      const periodStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
      periods.push(periodStr);
      current.setMonth(current.getMonth() + 1);
    }

    setAvailablePeriods(periods.reverse());
    if (periods.length > 0) {
      setSelectedPeriod(periods[0]);
    }
  };

  const formatPeriod = (period: string) => {
    const [year, month] = period.split("-");
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const toggleOwner = (ownerId: string) => {
    setSelectedOwners(prev => 
      prev.includes(ownerId) 
        ? prev.filter(id => id !== ownerId)
        : [...prev, ownerId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOwners.length === owners.length) {
      setSelectedOwners([]);
    } else {
      setSelectedOwners(owners.map(o => o.id));
    }
  };

  const handleGenerate = async () => {
    console.log("handleGenerate called - selectedOwners:", selectedOwners, "selectedPeriod:", selectedPeriod);
    
    if (selectedOwners.length === 0) {
      toast.error("Seleccione al menos un propietario");
      return;
    }

    if (!selectedPeriod) {
      toast.error("Seleccione un período");
      return;
    }

    setLoading(true);
    console.log("Starting report generation...");

    try {
      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      for (const ownerId of selectedOwners) {
        console.log("Processing owner:", ownerId);
        const { data, error } = await supabase.functions.invoke("send-owner-monthly-report", {
          body: {
            contract_id: contractId,
            period: selectedPeriod,
            owner_id: ownerId,
            send_email: sendEmail,
            manual: true,
          },
        });

        console.log("Response for owner", ownerId, ":", { data, error });

        if (error) {
          console.error("Edge function error:", error);
          failCount++;
          const owner = owners.find(o => o.id === ownerId);
          errors.push(`${owner?.email || "Desconocido"} (${error.message || "Error desconocido"})`);
        } else if (!data?.success) {
          console.error("Function returned failure:", data);
          failCount++;
          const owner = owners.find(o => o.id === ownerId);
          const errorMsg = data?.error || "Error al generar reporte";
          errors.push(`${owner?.email || "Desconocido"} (${errorMsg})`);
        } else {
          console.log("Success for owner:", ownerId);
          successCount++;
        }
      }

      if (failCount === 0) {
        toast.success(
          sendEmail
            ? `Reportes enviados exitosamente a ${successCount} propietario${successCount > 1 ? 's' : ''}`
            : `Reportes generados exitosamente para ${successCount} propietario${successCount > 1 ? 's' : ''}`
        );
        setOpen(false);
      } else {
        toast.warning(
          `${successCount} enviado${successCount > 1 ? 's' : ''}, ${failCount} fallido${failCount > 1 ? 's' : ''}. Emails con error: ${errors.join(", ")}`
        );
      }
    } catch (error: any) {
      console.error("Error generating reports:", error);
      toast.error("Error al generar reportes: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const allSelected = selectedOwners.length === owners.length && owners.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {sendEmail ? "Enviar Reporte por Email" : "Descargar Reporte PDF"}
          </DialogTitle>
          <DialogDescription>
            Seleccione el período y los propietarios para generar el reporte
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selector de Período */}
          <div>
            <Label>Período</Label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione mes/año" />
              </SelectTrigger>
              <SelectContent>
                {availablePeriods.map(period => (
                  <SelectItem key={period} value={period}>
                    {formatPeriod(period)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lista de Propietarios */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Propietarios</Label>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={toggleSelectAll}
                type="button"
              >
                {allSelected ? "Deseleccionar todos" : "Seleccionar todos"}
              </Button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-lg p-4">
              {owners.map(owner => (
                <div key={owner.id} className="flex items-center gap-3">
                  <Checkbox 
                    checked={selectedOwners.includes(owner.id)}
                    onCheckedChange={() => toggleOwner(owner.id)}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{owner.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {owner.email} • {owner.share_percent}%
                    </p>
                  </div>
                </div>
              ))}
              {owners.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay propietarios configurados para esta propiedad
                </p>
              )}
            </div>
          </div>

          {/* Email adicional (opcional) */}
          {sendEmail && (
            <div>
              <Label>Email adicional (opcional)</Label>
              <Input 
                type="email"
                placeholder="destinatario@ejemplo.com"
                value={additionalEmail}
                onChange={(e) => setAdditionalEmail(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} type="button">
            Cancelar
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={loading || selectedOwners.length === 0}
            type="button"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                {sendEmail ? (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar Email
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Descargar PDF
                  </>
                )}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
