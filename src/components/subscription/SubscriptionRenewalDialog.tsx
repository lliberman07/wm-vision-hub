import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, CreditCard, CheckCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SubscriptionRenewalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: string;
  planName: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  currentPeriodEnd: string;
  onSuccess: () => void;
}

export function SubscriptionRenewalDialog({
  open,
  onOpenChange,
  subscriptionId,
  planName,
  priceMonthly,
  priceYearly,
  currency,
  currentPeriodEnd,
  onSuccess,
}: SubscriptionRenewalDialogProps) {
  const { toast } = useToast();
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);

  const yearlyDiscount = priceMonthly > 0 
    ? Math.round((1 - priceYearly / (priceMonthly * 12)) * 100) 
    : 0;

  const handleRenewal = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-subscription-renewal', {
        body: {
          subscription_id: subscriptionId,
          new_billing_cycle: selectedCycle,
        },
      });

      if (error) throw error;

      toast({
        title: '¡Renovación exitosa!',
        description: `Tu suscripción ha sido renovada con pago ${selectedCycle === 'yearly' ? 'anual' : 'mensual'}. Se ha generado la factura.`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error renewing subscription:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo procesar la renovación',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const newPeriodStart = new Date(currentPeriodEnd);
  newPeriodStart.setDate(newPeriodStart.getDate() + 1);

  const newPeriodEndMonthly = new Date(newPeriodStart);
  newPeriodEndMonthly.setDate(newPeriodEndMonthly.getDate() + 29);

  const newPeriodEndYearly = new Date(newPeriodStart);
  newPeriodEndYearly.setFullYear(newPeriodEndYearly.getFullYear() + 1);
  newPeriodEndYearly.setDate(newPeriodEndYearly.getDate() - 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Renovar Suscripción
          </DialogTitle>
          <DialogDescription>
            Tu ciclo de 12 meses ha finalizado. Selecciona cómo deseas continuar con tu plan <strong>{planName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <RadioGroup
            value={selectedCycle}
            onValueChange={(value) => setSelectedCycle(value as 'monthly' | 'yearly')}
            className="space-y-3"
          >
            {/* Monthly Option */}
            <Card 
              className={`cursor-pointer transition-all ${
                selectedCycle === 'monthly' 
                  ? 'border-primary ring-2 ring-primary/20' 
                  : 'hover:border-muted-foreground/50'
              }`}
              onClick={() => setSelectedCycle('monthly')}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <RadioGroupItem value="monthly" id="monthly" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="monthly" className="text-base font-semibold cursor-pointer">
                      Pago Mensual
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      12 facturas mensuales de ${priceMonthly.toLocaleString('es-AR')} {currency}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Total anual: ${(priceMonthly * 12).toLocaleString('es-AR')} {currency}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Yearly Option */}
            <Card 
              className={`cursor-pointer transition-all ${
                selectedCycle === 'yearly' 
                  ? 'border-primary ring-2 ring-primary/20' 
                  : 'hover:border-muted-foreground/50'
              }`}
              onClick={() => setSelectedCycle('yearly')}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <RadioGroupItem value="yearly" id="yearly" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="yearly" className="text-base font-semibold cursor-pointer">
                        Pago Anual
                      </Label>
                      {yearlyDiscount > 0 && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Ahorrás {yearlyDiscount}%
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      1 factura única de ${priceYearly.toLocaleString('es-AR')} {currency}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">
                        Sin preocuparte por pagos mensuales
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </RadioGroup>

          {/* Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-sm">Resumen de tu renovación:</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nuevo período:</span>
                <span>
                  {format(newPeriodStart, 'dd/MM/yyyy', { locale: es })} - {' '}
                  {format(
                    selectedCycle === 'yearly' ? newPeriodEndYearly : newPeriodEndMonthly,
                    'dd/MM/yyyy',
                    { locale: es }
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Factura a pagar:</span>
                <span className="font-semibold">
                  ${(selectedCycle === 'yearly' ? priceYearly : priceMonthly).toLocaleString('es-AR')} {currency}
                </span>
              </div>
              {selectedCycle === 'monthly' && (
                <p className="text-xs text-muted-foreground mt-2">
                  * Se generarán facturas automáticas cada mes durante 12 meses
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleRenewal} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              'Confirmar Renovación'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
