import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
  index_type: z.enum(["IPC", "ICL", "UVA"]),
  period: z.string().min(1, "Período requerido"),
  value: z.coerce.number().positive("El valor debe ser positivo"),
  source: z.string().optional()
}).refine(data => {
  // Validar formato según tipo
  if (data.index_type === 'ICL') {
    // Debe ser formato YYYY-MM-DD (fecha completa)
    return /^\d{4}-\d{2}-\d{2}$/.test(data.period);
  } else {
    // Debe ser formato YYYY-MM (mes)
    return /^\d{4}-\d{2}$/.test(data.period);
  }
}, {
  message: "Formato de período incorrecto para el tipo de índice seleccionado",
  path: ["period"]
});

type FormValues = z.infer<typeof formSchema>;

interface IndicesFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  indice?: any;
}

const canEditIndex = (period: string): boolean => {
  try {
    let periodDate: Date;
    
    if (period.length === 10) {
      // YYYY-MM-DD (ICL)
      periodDate = new Date(period);
    } else if (period.length === 7) {
      // YYYY-MM (IPC/UVA)
      periodDate = new Date(period + '-01');
    } else {
      return false;
    }
    
    // Calcular cutoff: primer día del mes P+2
    const cutoffDate = new Date(periodDate);
    cutoffDate.setMonth(cutoffDate.getMonth() + 2);
    cutoffDate.setDate(1);
    cutoffDate.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return today < cutoffDate;
  } catch {
    return false;
  }
};

export function IndicesForm({ open, onOpenChange, onSuccess, indice }: IndicesFormProps) {
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: indice || {
      index_type: "IPC",
      period: new Date().toISOString().slice(0, 7),
      value: 0,
      source: ""
    }
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      if (indice) {
        // MODO EDICIÓN: Validar ventana temporal
        if (!canEditIndex(indice.period)) {
          toast({
            title: "Fuera de ventana de edición",
            description: `El índice de ${indice.period} solo puede editarse durante ese mes y el siguiente. Para corregirlo, elimínelo y créelo nuevamente.`,
            variant: "destructive",
          });
          return;
        }

        const { error } = await supabase
          .from('pms_economic_indices')
          .update({
            index_type: values.index_type,
            period: values.period,
            value: values.value,
            source: values.source,
          })
          .eq('id', indice.id);

        if (error) throw error;
        toast({ title: "Índice actualizado correctamente" });
      } else {
        // MODO CREACIÓN
        const { error } = await supabase
          .from('pms_economic_indices')
          .insert([{
            index_type: values.index_type,
            period: values.period,
            value: values.value,
            source: values.source,
            created_by: user.id
          }]);

        if (error) throw error;
        toast({ title: "Índice registrado correctamente" });
      }

      form.reset();
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{indice ? "Editar Índice" : "Registrar Índice Económico"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="index_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Índice</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="IPC">IPC - Índice de Precios al Consumidor</SelectItem>
                      <SelectItem value="ICL">ICL - Índice de Contratos de Locación</SelectItem>
                      <SelectItem value="UVA">UVA - Unidad de Valor Adquisitivo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="period"
              render={({ field }) => {
                const indexType = form.watch('index_type');
                const isICL = indexType === 'ICL';
                
                return (
                  <FormItem>
                    <FormLabel>
                      {isICL ? 'Fecha (YYYY-MM-DD)' : 'Período (YYYY-MM)'}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type={isICL ? "date" : "month"} 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(e);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.0001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fuente</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ej: INDEC, BCRA" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {indice ? "Actualizar" : "Registrar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
