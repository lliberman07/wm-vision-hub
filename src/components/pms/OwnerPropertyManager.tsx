import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { OwnerForm } from "./OwnerForm";

interface Owner {
  id: string;
  full_name: string;
}

interface OwnerProperty {
  id?: string;
  owner_id: string;
  owner_name?: string;
  share_percent: number;
}

interface OwnerPropertyManagerProps {
  propertyId?: string;
  tenantId: string;
  onOwnersChange?: (owners: OwnerProperty[]) => void;
  initialOwners?: OwnerProperty[];
  disabled?: boolean;
}

export function OwnerPropertyManager({ propertyId, tenantId, onOwnersChange, initialOwners = [], disabled = false }: OwnerPropertyManagerProps) {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [propertyOwners, setPropertyOwners] = useState<OwnerProperty[]>(initialOwners);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
  const [sharePercent, setSharePercent] = useState<string>("");
  const [showOwnerForm, setShowOwnerForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOwners();
    if (propertyId) {
      fetchPropertyOwners();
    }
  }, [propertyId]);

  const fetchOwners = async () => {
    const { data, error } = await supabase
      .from('pms_owners')
      .select('id, full_name')
      .eq('tenant_id', tenantId)
      .order('full_name');

    if (!error && data) {
      setOwners(data);
    }
  };

  const fetchPropertyOwners = async () => {
    if (!propertyId) return;

    const { data, error } = await supabase
      .from('pms_owner_properties')
      .select(`
        id,
        owner_id,
        share_percent,
        pms_owners!inner(full_name)
      `)
      .eq('property_id', propertyId)
      .is('end_date', null);

    if (!error && data) {
      const formatted = data.map(op => ({
        id: op.id,
        owner_id: op.owner_id,
        owner_name: (op.pms_owners as any).full_name,
        share_percent: op.share_percent
      }));
      setPropertyOwners(formatted);
      onOwnersChange?.(formatted);
    }
  };

  const totalPercent = propertyOwners.reduce((sum, po) => sum + po.share_percent, 0);
  const isValid = totalPercent === 100;

  const handleAddOwner = () => {
    if (!selectedOwnerId || !sharePercent) {
      toast({
        title: "Error",
        description: "Selecciona un propietario e ingresa el porcentaje",
        variant: "destructive"
      });
      return;
    }

    const percent = parseFloat(sharePercent);
    if (percent <= 0 || percent > 100) {
      toast({
        title: "Error",
        description: "El porcentaje debe estar entre 0 y 100",
        variant: "destructive"
      });
      return;
    }

    if (totalPercent + percent > 100) {
      toast({
        title: "Error",
        description: `El total no puede exceder 100%. Disponible: ${100 - totalPercent}%`,
        variant: "destructive"
      });
      return;
    }

    const ownerExists = propertyOwners.some(po => po.owner_id === selectedOwnerId);
    if (ownerExists) {
      toast({
        title: "Error",
        description: "Este propietario ya está asignado",
        variant: "destructive"
      });
      return;
    }

    const owner = owners.find(o => o.id === selectedOwnerId);
    const newOwner: OwnerProperty = {
      owner_id: selectedOwnerId,
      owner_name: owner?.full_name,
      share_percent: percent
    };

    const updated = [...propertyOwners, newOwner];
    setPropertyOwners(updated);
    onOwnersChange?.(updated);
    setSelectedOwnerId("");
    setSharePercent("");
  };

  const handleRemoveOwner = (index: number) => {
    const updated = propertyOwners.filter((_, i) => i !== index);
    setPropertyOwners(updated);
    onOwnersChange?.(updated);
  };

  const handleOwnerCreated = (newOwnerId?: string) => {
    fetchOwners();
    if (newOwnerId) {
      setSelectedOwnerId(newOwnerId);
    }
    setShowOwnerForm(false);
  };

  return (
    <div className="space-y-4">
      {disabled && (
        <Alert variant="default" className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            No puedes modificar propietarios de una propiedad con contrato activo o historial.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Propietarios de la Propiedad</Label>
        <div className="text-sm">
          Total: <span className={totalPercent === 100 ? "text-green-600 font-bold" : "text-orange-600 font-bold"}>{totalPercent}%</span>
        </div>
      </div>

      <Progress value={totalPercent} className="h-3" />

      {!isValid && propertyOwners.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            La suma de porcentajes debe ser exactamente 100%. {totalPercent < 100 ? `Falta ${100 - totalPercent}%` : `Sobra ${totalPercent - 100}%`}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between mb-2">
        <Label className="text-sm">Seleccionar Propietario</Label>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={() => setShowOwnerForm(true)}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-1" />
          Nuevo Propietario
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <Select value={selectedOwnerId} onValueChange={setSelectedOwnerId} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar propietario" />
            </SelectTrigger>
            <SelectContent>
              {owners.map((owner) => (
                <SelectItem key={owner.id} value={owner.id}>
                  {owner.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="%"
            min="0"
            max="100"
            step="0.01"
            value={sharePercent}
            onChange={(e) => setSharePercent(e.target.value)}
            disabled={disabled}
          />
          <Button type="button" onClick={handleAddOwner} size="icon" disabled={disabled}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {propertyOwners.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Propietario</TableHead>
              <TableHead className="text-right">Porcentaje</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {propertyOwners.map((po, index) => (
              <TableRow key={index}>
                <TableCell>{po.owner_name || owners.find(o => o.id === po.owner_id)?.full_name}</TableCell>
                <TableCell className="text-right font-mono">{po.share_percent}%</TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveOwner(index)}
                    disabled={disabled}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <OwnerForm
        open={showOwnerForm}
        onOpenChange={setShowOwnerForm}
        onSuccess={handleOwnerCreated}
      />
    </div>
  );
}
