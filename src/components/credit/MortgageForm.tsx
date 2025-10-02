import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatNumber, parseFormattedNumber } from '@/utils/numberFormat';

interface MortgageFormProps {
  onSubmit: (data: {
    valor_propiedad: number;
    ingreso_mensual: number;
    plazo_deseado: number;
    perfil_usuario: string;
    destino_credito: string;
  }) => void;
  loading: boolean;
}

export const MortgageForm = ({ onSubmit, loading }: MortgageFormProps) => {
  const { t, language } = useLanguage();
  
  const [formData, setFormData] = useState({
    valor_propiedad: '',
    ingreso_mensual: '',
    plazo_deseado: '240',
    perfil_usuario: '',
    destino_credito: ''
  });

  const handleNumberChange = (field: string, value: string) => {
    const formatted = formatNumber(parseFormattedNumber(value), language);
    setFormData(prev => ({ ...prev, [field]: formatted }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSubmit({
      valor_propiedad: parseFormattedNumber(formData.valor_propiedad),
      ingreso_mensual: parseFormattedNumber(formData.ingreso_mensual),
      plazo_deseado: parseInt(formData.plazo_deseado),
      perfil_usuario: formData.perfil_usuario,
      destino_credito: formData.destino_credito
    });
  };

  const isValid = formData.valor_propiedad && 
                  formData.ingreso_mensual && 
                  formData.plazo_deseado && 
                  formData.perfil_usuario && 
                  formData.destino_credito;

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Property Value */}
          <div className="space-y-2">
            <Label htmlFor="valor_propiedad">{t('mortgage.form.propertyValue')}</Label>
            <Input
              id="valor_propiedad"
              type="text"
              value={formData.valor_propiedad}
              onChange={(e) => handleNumberChange('valor_propiedad', e.target.value)}
              placeholder={formatCurrency(0, language)}
              required
            />
          </div>

          {/* Monthly Income */}
          <div className="space-y-2">
            <Label htmlFor="ingreso_mensual">{t('mortgage.form.monthlyIncome')}</Label>
            <Input
              id="ingreso_mensual"
              type="text"
              value={formData.ingreso_mensual}
              onChange={(e) => handleNumberChange('ingreso_mensual', e.target.value)}
              placeholder={formatCurrency(0, language)}
              required
            />
          </div>

          {/* Desired Term */}
          <div className="space-y-2">
            <Label htmlFor="plazo_deseado">{t('mortgage.form.desiredTerm')}</Label>
            <Select
              value={formData.plazo_deseado}
              onValueChange={(value) => setFormData(prev => ({ ...prev, plazo_deseado: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="120">10 {t('mortgage.form.years')}</SelectItem>
                <SelectItem value="180">15 {t('mortgage.form.years')}</SelectItem>
                <SelectItem value="240">20 {t('mortgage.form.years')}</SelectItem>
                <SelectItem value="300">25 {t('mortgage.form.years')}</SelectItem>
                <SelectItem value="360">30 {t('mortgage.form.years')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* User Profile */}
          <div className="space-y-2">
            <Label htmlFor="perfil_usuario">{t('mortgage.form.userProfile')}</Label>
            <Select
              value={formData.perfil_usuario}
              onValueChange={(value) => setFormData(prev => ({ ...prev, perfil_usuario: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('mortgage.form.selectProfile')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="empleado_dependencia">{t('mortgage.profile.employee')}</SelectItem>
                <SelectItem value="monotributista">{t('mortgage.profile.monotributista')}</SelectItem>
                <SelectItem value="responsable_inscripto">{t('mortgage.profile.responsableInscripto')}</SelectItem>
                <SelectItem value="empleado_publico">{t('mortgage.profile.publicEmployee')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Credit Destination */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="destino_credito">{t('mortgage.form.creditDestination')}</Label>
            <Select
              value={formData.destino_credito}
              onValueChange={(value) => setFormData(prev => ({ ...prev, destino_credito: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('mortgage.form.selectDestination')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primera_vivienda">{t('mortgage.destination.firstHome')}</SelectItem>
                <SelectItem value="segunda_vivienda">{t('mortgage.destination.secondHome')}</SelectItem>
                <SelectItem value="construccion">{t('mortgage.destination.construction')}</SelectItem>
                <SelectItem value="refaccion">{t('mortgage.destination.renovation')}</SelectItem>
                <SelectItem value="otro">{t('mortgage.destination.other')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={!isValid || loading}>
          {loading ? t('common.loading') : t('mortgage.form.simulate')}
        </Button>
      </form>
    </Card>
  );
};
