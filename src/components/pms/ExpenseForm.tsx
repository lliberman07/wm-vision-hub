import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  property_id: z.string().min(1, "Propiedad requerida"),
  contract_id: z.string().optional(),
  category: z.string().min(1, "Categoría requerida"),
  amount: z.coerce.number().positive("El monto debe ser positivo"),
  currency: z.string().default("ARS"),
  expense_date: z.string().min(1, "Fecha requerida"),
  description: z.string().optional(),
  receipt_url: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

interface ExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  expense?: any;
  tenantId: string;
}

export function ExpenseForm({ open, onOpenChange, onSuccess, expense, tenantId }: ExpenseFormProps) {
  const [properties, setProperties] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      property_id: "",
      contract_id: "",
      category: "",
      amount: 0,
      currency: "ARS",
      expense_date: new Date().toISOString().split('T')[0],
      description: "",
      receipt_url: ""
    }
  });

  useEffect(() => {
    if (open) {
      fetchProperties();
      if (expense) {
        form.reset({
          property_id: expense.property_id || "",
          contract_id: expense.contract_id || "",
          category: expense.category || "",
          amount: expense.amount || 0,
          currency: expense.currency || "ARS",
          expense_date: expense.expense_date || new Date().toISOString().split('T')[0],
          description: expense.description || "",
          receipt_url: expense.receipt_url || ""
        });
        if (expense.property_id) {
          fetchContracts(expense.property_id);
        }
      } else {
        form.reset({
          property_id: "",
          contract_id: "",
          category: "",
          amount: 0,
          currency: "ARS",
          expense_date: new Date().toISOString().split('T')[0],
          description: "",
          receipt_url: ""
        });
      }
    }
  }, [open, expense, form]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'property_id' && value.property_id) {
        fetchContracts(value.property_id);
        form.setValue('contract_id', '');
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const fetchProperties = async () => {
    const { data } = await supabase
      .from('pms_properties')
      .select('id, code, address')
      .eq('tenant_id', tenantId)
      .order('code');
    
    if (data) setProperties(data);
  };

  const fetchContracts = async (propertyId: string) => {
    if (!propertyId) {
      setContracts([]);
      return;
    }
    
    const { data } = await supabase
      .from('pms_contracts')
      .select('id, contract_number, status')
      .eq('property_id', propertyId)
      .eq('status', 'active')
      .order('contract_number');
    
    if (data) setContracts(data);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const expenseData: any = {
        ...values,
        tenant_id: tenantId,
        created_by: user?.id,
        contract_id: values.contract_id === 'none' ? null : values.contract_id
      };

      if (expense?.id) {
        const { error } = await supabase
          .from('pms_expenses')
          .update(expenseData)
          .eq('id', expense.id);

        if (error) throw error;
        toast({ title: "Gasto actualizado correctamente" });
      } else {
        const { error } = await supabase
          .from('pms_expenses')
          .insert([expenseData]);

        if (error) throw error;
        toast({ title: "Gasto registrado correctamente" });
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

  const categories = [
    "Mantenimiento",
    "Reparaciones",
    "Limpieza",
    "Servicios",
    "Impuestos",
    "Seguros",
    "Administración",
    "Otros"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{expense ? "Editar Gasto" : "Registrar Gasto"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="property_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Propiedad</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar propiedad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {properties.map((prop) => (
                        <SelectItem key={prop.id} value={prop.id}>
                          {prop.code} - {prop.address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contract_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contrato (opcional)</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!form.watch('property_id')}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sin contrato asociado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Sin contrato</SelectItem>
                      {contracts.map((contract) => (
                        <SelectItem key={contract.id} value={contract.id}>
                          {contract.contract_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expense_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moneda</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ARS">ARS</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="BTC">BTC</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="receipt_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL del Comprobante</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://..." />
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
                {expense ? "Actualizar" : "Registrar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
