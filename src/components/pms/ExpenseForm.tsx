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
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  property_id: z.string().min(1, "Propiedad requerida"),
  contract_id: z.string().optional(),
  category: z.string().min(1, "Categoría requerida"),
  amount: z.coerce.number().positive("El monto debe ser positivo"),
  currency: z.string().default("ARS"),
  expense_date: z.string().min(1, "Fecha requerida"),
  description: z.string().optional(),
  receipt_url: z.string().optional(),
  is_reimbursable: z.boolean().default(false)
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
  const [hasActiveContract, setHasActiveContract] = useState(false);
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
      receipt_url: "",
      is_reimbursable: false
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
          receipt_url: expense.receipt_url || "",
          is_reimbursable: expense.is_reimbursable || false
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
          receipt_url: "",
          is_reimbursable: false
        });
      }
    }
  }, [open, expense, form]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'property_id' && value.property_id) {
        fetchContracts(value.property_id);
        // No resetear contract_id aquí - fetchContracts lo maneja automáticamente
      }
      if (name === 'contract_id') {
        const hasContract = value.contract_id && value.contract_id !== 'none';
        setHasActiveContract(hasContract);
        if (!hasContract) {
          form.setValue('is_reimbursable', false);
        }
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
      setHasActiveContract(false);
      form.setValue('contract_id', '');
      form.setValue('is_reimbursable', false);
      return;
    }
    
    const { data } = await supabase
      .from('pms_contracts')
      .select('id, contract_number, status')
      .eq('property_id', propertyId)
      .eq('status', 'active')
      .order('contract_number');
    
    if (data && data.length > 0) {
      setContracts(data);
      setHasActiveContract(true);
      
      // AUTO-SELECCIÓN: Si hay exactamente 1 contrato activo
      if (data.length === 1) {
        form.setValue('contract_id', data[0].id);
      } else {
        // Si hay múltiples contratos, resetear la selección para que el usuario elija
        form.setValue('contract_id', '');
        form.setValue('is_reimbursable', false);
      }
    } else {
      setContracts([]);
      setHasActiveContract(false);
      form.setValue('contract_id', '');
      form.setValue('is_reimbursable', false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Validar que si es reembolsable, debe tener contrato
      if (values.is_reimbursable && (!values.contract_id || values.contract_id === 'none')) {
        toast({
          title: "Error",
          description: "Los gastos reembolsables deben estar asociados a un contrato activo",
          variant: "destructive"
        });
        return;
      }
      
      const expenseData: any = {
        ...values,
        tenant_id: tenantId,
        created_by: user?.id,
        contract_id: values.contract_id === 'none' ? null : values.contract_id,
        reimbursement_status: values.is_reimbursable ? 'pending' : null
      };

      if (expense?.id) {
        const { data: updatedExpense, error } = await supabase
          .from('pms_expenses')
          .update(expenseData)
          .eq('id', expense.id)
          .select()
          .single();

        if (error) throw error;
        
        // Si es reembolsable y hay contrato, llamar al edge function
        if (values.is_reimbursable && values.contract_id && values.contract_id !== 'none') {
          await supabase.functions.invoke('create-reimbursement-schedule-item', {
            body: { expense: { ...updatedExpense, contract_id: values.contract_id } }
          });
        }
        
        toast({ title: "Gasto actualizado correctamente" });
      } else {
        const { data: newExpense, error } = await supabase
          .from('pms_expenses')
          .insert([expenseData])
          .select()
          .single();

        if (error) throw error;
        
        // Si es reembolsable y hay contrato, llamar al edge function
        if (values.is_reimbursable && values.contract_id && values.contract_id !== 'none') {
          await supabase.functions.invoke('create-reimbursement-schedule-item', {
            body: { expense: { ...newExpense, contract_id: values.contract_id } }
          });
        }
        
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
                  <FormLabel>
                    {contracts.length === 0 
                      ? "Sin contrato activo" 
                      : contracts.length === 1 
                      ? "Contrato Activo" 
                      : "Contratos Activos (seleccionar)"}
                  </FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!form.watch('property_id')}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue 
                          placeholder={
                            contracts.length === 0 
                              ? "Esta propiedad no tiene contratos activos" 
                              : "Seleccionar contrato"
                          } 
                        />
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

            {hasActiveContract && (
              <FormField
                control={form.control}
                name="is_reimbursable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-muted/50">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 mt-1"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-semibold">
                        Reembolso a Propietarios
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Este gasto será agregado al calendario de pagos del inquilino como un item adicional a pagar en el mes correspondiente.
                        El monto será distribuido entre los propietarios según sus porcentajes de participación.
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {expense ? "Actualizar" : "Cargar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
