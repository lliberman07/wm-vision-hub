import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  new_end_date: z.string().min(1, 'Fecha requerida'),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ExtendContractDialogProps {
  contractId: string;
  contractNumber: string;
  currentEndDate: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ExtendContractDialog({
  contractId,
  contractNumber,
  currentEndDate,
  open,
  onOpenChange,
  onSuccess,
}: ExtendContractDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      new_end_date: '',
      notes: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc('extend_contract', {
        contract_id_param: contractId,
        new_end_date_param: values.new_end_date,
        notes_param: values.notes || null,
      });

      if (error) throw error;

      toast.success('Contrato extendido correctamente');
      onOpenChange(false);
      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error('Error extending contract:', error);
      toast.error(error.message || 'Error al extender contrato');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Extender Contrato {contractNumber}</DialogTitle>
          <DialogDescription>
            Fecha de finalización actual: {new Date(currentEndDate).toLocaleDateString('es-AR')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="new_end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nueva Fecha de Finalización</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      min={currentEndDate}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Motivo de la extensión..."
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Extender Contrato
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
