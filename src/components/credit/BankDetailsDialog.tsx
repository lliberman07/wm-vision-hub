import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Building2, DollarSign, Calendar, Home, Gift } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatCurrency } from "@/utils/numberFormat";
import { CreditType, CreditProduct } from "@/types/credit";
import { Card, CardContent } from "@/components/ui/card";

interface BankGroup {
  entityCode: number;
  entityName: string;
  products: CreditProduct[];
  minTea: number;
  maxTerm: number;
  maxAmount: number;
  maxLtv: number;
}

interface BankDetailsDialogProps {
  bank: BankGroup;
  creditType: CreditType;
  open: boolean;
  onClose: () => void;
}

const BankDetailsDialog = ({ bank, creditType, open, onClose }: BankDetailsDialogProps) => {
  const { t, language } = useLanguage();

  const getProductName = (product: any): string => {
    if (creditType === 'hipotecario') return product.nombre_corto_del_prestamo_hipotecario || product.denominacion;
    if (creditType === 'personal') return product.nombre_corto_del_prestamo_personal || product.denominacion;
    if (creditType === 'prendario') return product.nombre_corto_del_prestamo_prendario || product.denominacion;
    return product.denominacion;
  };

  const getMaxAmount = (product: any): number => {
    if (creditType === 'hipotecario') return product.monto_maximo_otorgable_del_prestamo || 0;
    return product.monto_maximo_otorgable || 0;
  };

  const getMaxTerm = (product: any): number => {
    if (creditType === 'hipotecario') return product.plazo_maximo_otorgable || 0;
    if (creditType === 'personal') return (product.plazo_maximo_otorgable_anos || 0);
    if (creditType === 'prendario') return Math.floor((product.plazo_maximo_otorgable_meses || 0) / 12);
    return 0;
  };

  const getLtv = (product: any): number | null => {
    if (creditType === 'personal') return null;
    return (product.relacion_monto_tasacion || 0) * 100;
  };

  const getCancellationCharge = (product: any): string => {
    const charge = product.cargo_maximo_por_cancelacion_anticipada;
    if (!charge || charge === 0 || charge === null) return t('credit.bank.noCharge');
    return `${charge.toFixed(2)}%`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl mb-1">{bank.entityName}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {creditType === 'hipotecario' && t('credit.type.hipotecario')}
                  {creditType === 'personal' && t('credit.type.personal')}
                  {creditType === 'prendario' && t('credit.type.prendario')}
                </p>
              </div>
            </div>
            <Badge className="bg-primary text-primary-foreground">
              {t('credit.bank.from')} {bank.minTea.toFixed(2)}% CFT
            </Badge>
          </div>
        </DialogHeader>

        {/* General Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
          <div className="flex flex-col gap-2 p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs">{t('credit.bank.maxAmount')}</span>
            </div>
            <span className="font-semibold text-lg">{formatCurrency(bank.maxAmount, language)}</span>
          </div>
          
          <div className="flex flex-col gap-2 p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-xs">{t('credit.bank.maxTerm')}</span>
            </div>
            <span className="font-semibold text-lg">{bank.maxTerm} {t('credit.bank.years')}</span>
          </div>

          {creditType !== 'personal' && (
            <div className="flex flex-col gap-2 p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Home className="h-4 w-4" />
                <span className="text-xs">{t('credit.bank.financing')}</span>
              </div>
              <span className="font-semibold text-lg">{t('credit.bank.upTo')} {(bank.maxLtv * 100).toFixed(0)}%</span>
            </div>
          )}

          <div className="flex flex-col gap-2 p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Gift className="h-4 w-4" />
              <span className="text-xs">{t('credit.bank.earlyCancellation')}</span>
            </div>
            <span className="font-semibold text-lg">{getCancellationCharge(bank.products[0])}</span>
          </div>
        </div>

        {/* Available Credit Lines */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t('credit.bank.availableLines')}</h3>
          <div className="space-y-3">
            {bank.products.map((product, idx) => {
              const productLtv = getLtv(product);
              return (
                <Card key={idx} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{getProductName(product)}</h4>
                          <Badge variant="outline" className="text-xs">
                            TEA {t('credit.bank.from')} {product.tasa_efectiva_anual_maxima?.toFixed(2) || 'N/A'}%
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">{t('credit.bank.maxAmount')}: </span>
                            <span className="font-medium">{formatCurrency(getMaxAmount(product), language)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t('credit.bank.maxTerm')}: </span>
                            <span className="font-medium">{getMaxTerm(product)} {t('credit.bank.years')}</span>
                          </div>
                          {productLtv !== null && (
                            <div>
                              <span className="text-muted-foreground">{t('credit.bank.financing')}: </span>
                              <span className="font-medium">{productLtv.toFixed(0)}%</span>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">CFT: </span>
                            <span className="font-medium">{product.costo_financiero_efectivo_total_maximo?.toFixed(2) || 'N/A'}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Note about simulation */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            {t('credit.bank.simulationNote')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BankDetailsDialog;
