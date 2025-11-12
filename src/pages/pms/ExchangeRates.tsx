import { PMSLayout } from "@/components/pms/PMSLayout";
import { PMSPageWrapper } from "@/components/pms/PMSPageWrapper";
import { ExchangeRatesAnalytics } from "@/components/pms/ExchangeRatesAnalytics";

export default function ExchangeRates() {
  return (
    <PMSPageWrapper>
      <PMSLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Tipos de Cambio</h1>
            <p className="text-muted-foreground mt-1">
              Evolución histórica del tipo de cambio oficial para referencia en pagos
            </p>
          </div>
          
          <ExchangeRatesAnalytics />
        </div>
      </PMSLayout>
    </PMSPageWrapper>
  );
}
