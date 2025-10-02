import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { CreditType, CreditProduct } from "@/types/credit";
import BankCard from "./BankCard";
import BankDetailsDialog from "./BankDetailsDialog";
import { Loader2 } from "lucide-react";

interface BanksListProps {
  creditType: CreditType;
}

interface BankGroup {
  entityCode: number;
  entityName: string;
  products: CreditProduct[];
  minTea: number;
  maxTerm: number;
  maxAmount: number;
  maxLtv: number;
}

const BanksList = ({ creditType }: BanksListProps) => {
  const { t } = useLanguage();
  const [banks, setBanks] = useState<BankGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBank, setSelectedBank] = useState<BankGroup | null>(null);

  useEffect(() => {
    loadBanks();
  }, [creditType]);

  const loadBanks = async () => {
    setLoading(true);
    try {
      let data: any[] = [];
      let error = null;

      if (creditType === 'hipotecario') {
        const result = await supabase
          .from('creditos_hipotecarios')
          .select('*')
          .order('descripcion_de_entidad', { ascending: true })
          .order('tasa_efectiva_anual_maxima', { ascending: true });
        data = result.data || [];
        error = result.error;
      } else if (creditType === 'personal') {
        const result = await supabase
          .from('creditos_personales')
          .select('*')
          .order('descripcion_de_entidad', { ascending: true })
          .order('tasa_efectiva_anual_maxima', { ascending: true });
        data = result.data || [];
        error = result.error;
      } else if (creditType === 'prendario') {
        const result = await supabase
          .from('creditos_prendarios')
          .select('*')
          .order('descripcion_de_entidad', { ascending: true })
          .order('tasa_efectiva_anual_maxima', { ascending: true });
        data = result.data || [];
        error = result.error;
      }

      if (error) throw error;

      // Group by entity
      const grouped = data.reduce((acc, product) => {
        const entityCode = product.codigo_de_entidad;
        if (!acc[entityCode]) {
          acc[entityCode] = {
            entityCode,
            entityName: product.descripcion_de_entidad,
            products: [],
            minTea: product.tasa_efectiva_anual_maxima,
            maxTerm: 0,
            maxAmount: 0,
            maxLtv: 0
          };
        }
        
        acc[entityCode].products.push(product as CreditProduct);
        acc[entityCode].minTea = Math.min(acc[entityCode].minTea, product.tasa_efectiva_anual_maxima);
        
        // Get max values across products
        if (creditType === 'hipotecario') {
          acc[entityCode].maxTerm = Math.max(acc[entityCode].maxTerm, product.plazo_maximo_otorgable || 0);
          acc[entityCode].maxAmount = Math.max(acc[entityCode].maxAmount, product.monto_maximo_otorgable_del_prestamo || 0);
          acc[entityCode].maxLtv = Math.max(acc[entityCode].maxLtv, product.relacion_monto_tasacion || 0);
        } else if (creditType === 'personal') {
          acc[entityCode].maxTerm = Math.max(acc[entityCode].maxTerm, (product.plazo_maximo_otorgable_anos || 0));
          acc[entityCode].maxAmount = Math.max(acc[entityCode].maxAmount, product.monto_maximo_otorgable || 0);
          acc[entityCode].maxLtv = 1; // Personal loans don't have LTV
        } else if (creditType === 'prendario') {
          acc[entityCode].maxTerm = Math.max(acc[entityCode].maxTerm, Math.floor((product.plazo_maximo_otorgable_meses || 0) / 12));
          acc[entityCode].maxAmount = Math.max(acc[entityCode].maxAmount, product.monto_maximo_otorgable || 0);
          acc[entityCode].maxLtv = Math.max(acc[entityCode].maxLtv, product.relacion_monto_tasacion || 0);
        }
        
        return acc;
      }, {} as Record<number, BankGroup>);

      setBanks(Object.values(grouped));
    } catch (error) {
      console.error('Error loading banks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCreditTypeLabel = () => {
    if (creditType === 'hipotecario') return t('credit.type.hipotecario');
    if (creditType === 'personal') return t('credit.type.personal');
    if (creditType === 'prendario') return t('credit.type.prendario');
    return '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banks.map((bank) => (
          <BankCard
            key={bank.entityCode}
            entityCode={bank.entityCode}
            entityName={bank.entityName}
            creditType={getCreditTypeLabel()}
            tea={bank.minTea}
            maxTerm={bank.maxTerm}
            maxAmount={bank.maxAmount}
            ltv={bank.maxLtv}
            productCount={bank.products.length}
            onViewDetails={() => setSelectedBank(bank)}
          />
        ))}
      </div>

      {selectedBank && (
        <BankDetailsDialog
          bank={selectedBank}
          creditType={creditType}
          open={!!selectedBank}
          onClose={() => setSelectedBank(null)}
        />
      )}
    </>
  );
};

export default BanksList;
