import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CreditFormData, CreditType } from "@/types/credit";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calculator } from "lucide-react";

interface CreditFormProps {
  tipo: CreditType;
  onSubmit: (data: CreditFormData) => void;
  loading: boolean;
}

const CreditForm = ({ tipo, onSubmit, loading }: CreditFormProps) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<Partial<CreditFormData>>({
    tipo,
    inflacionEsperada: 140
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid()) {
      onSubmit(formData as CreditFormData);
    }
  };

  const isFormValid = () => {
    if (!formData.monto || !formData.ingreso || !formData.edad || !formData.antiguedad || !formData.plazo) {
      return false;
    }
    if ((tipo === 'hipotecario' || tipo === 'prendario') && !formData.tasacion) {
      return false;
    }
    return true;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('credit.form.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="monto">{t('credit.form.monto')}</Label>
            <Input
              id="monto"
              type="number"
              placeholder="Ej: 5000000"
              value={formData.monto || ''}
              onChange={(e) => setFormData({ ...formData, monto: Number(e.target.value) })}
              required
            />
          </div>

          <div>
            <Label htmlFor="plazo">{t('credit.form.plazo')}</Label>
            <Input
              id="plazo"
              type="number"
              placeholder={tipo === 'personal' ? t('credit.form.plazo.years') : t('credit.form.plazo.months')}
              value={formData.plazo || ''}
              onChange={(e) => {
                let plazo = Number(e.target.value);
                // Convertir años a meses para personal
                if (tipo === 'personal') {
                  plazo = plazo * 12;
                }
                setFormData({ ...formData, plazo });
              }}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {tipo === 'personal' ? t('credit.form.plazo.years.hint') : t('credit.form.plazo.months.hint')}
            </p>
          </div>

          <div>
            <Label htmlFor="ingreso">{t('credit.form.ingreso')}</Label>
            <Input
              id="ingreso"
              type="number"
              placeholder="Ej: 500000"
              value={formData.ingreso || ''}
              onChange={(e) => setFormData({ ...formData, ingreso: Number(e.target.value) })}
              required
            />
          </div>

          <div>
            <Label htmlFor="edad">{t('credit.form.edad')}</Label>
            <Input
              id="edad"
              type="number"
              placeholder="Ej: 35"
              value={formData.edad || ''}
              onChange={(e) => setFormData({ ...formData, edad: Number(e.target.value) })}
              required
            />
          </div>

          <div>
            <Label htmlFor="antiguedad">{t('credit.form.antiguedad')}</Label>
            <Input
              id="antiguedad"
              type="number"
              placeholder="Ej: 24"
              value={formData.antiguedad || ''}
              onChange={(e) => setFormData({ ...formData, antiguedad: Number(e.target.value) })}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">{t('credit.form.antiguedad.hint')}</p>
          </div>

          {(tipo === 'hipotecario' || tipo === 'prendario') && (
            <div>
              <Label htmlFor="tasacion">{t('credit.form.tasacion')}</Label>
              <Input
                id="tasacion"
                type="number"
                placeholder="Ej: 10000000"
                value={formData.tasacion || ''}
                onChange={(e) => setFormData({ ...formData, tasacion: Number(e.target.value) })}
                required
              />
            </div>
          )}

          <div>
            <Label htmlFor="inflacion">{t('credit.form.inflacion')}</Label>
            <Input
              id="inflacion"
              type="number"
              placeholder="140"
              value={formData.inflacionEsperada || 140}
              onChange={(e) => setFormData({ ...formData, inflacionEsperada: Number(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground mt-1">{t('credit.form.inflacion.hint')}</p>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !isFormValid()}>
            <Calculator className="h-4 w-4 mr-2" />
            {loading ? t('credit.form.simulating') : t('credit.form.simulate')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreditForm;
