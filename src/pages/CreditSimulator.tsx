import { useState } from "react";
import { Helmet } from "react-helmet";
import { CreditType, CreditFormData } from "@/types/credit";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCreditSimulation } from "@/hooks/useCreditSimulation";
import { useCreditComparator } from "@/hooks/useCreditComparator";
import CreditTypeSelector from "@/components/credit/CreditTypeSelector";
import CreditForm from "@/components/credit/CreditForm";
import CreditResults from "@/components/credit/CreditResults";
import CreditComparator from "@/components/credit/CreditComparator";
import CreditDisclaimer from "@/components/credit/CreditDisclaimer";
import UVAProjectionChart from "@/components/credit/UVAProjectionChart";
import BanksList from "@/components/credit/BanksList";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const CreditSimulator = () => {
  const { t } = useLanguage();
  const [selectedType, setSelectedType] = useState<CreditType | undefined>();
  const [currentFormData, setCurrentFormData] = useState<CreditFormData | undefined>();
  const { simulate, loading, results, clearResults } = useCreditSimulation();
  const { items: comparisonItems, add: addToComparator, remove: removeFromComparator, clear: clearComparator } = useCreditComparator();

  const handleTypeSelect = (type: CreditType) => {
    setSelectedType(type);
    setCurrentFormData(undefined);
    clearResults();
  };

  const handleFormSubmit = (data: CreditFormData) => {
    setCurrentFormData(data);
    simulate(data);
  };

  const handleBack = () => {
    setSelectedType(undefined);
    setCurrentFormData(undefined);
    clearResults();
  };

  const hasUVAInComparator = comparisonItems.some(item => item.esUVA);
  const firstUVAItem = comparisonItems.find(item => item.esUVA);

  return (
    <>
      <Helmet>
        <title>{t('credit.page.title')} - WM Global</title>
        <meta name="description" content={t('credit.page.description')} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">{t('credit.page.title')}</h1>
            <p className="text-lg text-muted-foreground">{t('credit.page.subtitle')}</p>
          </div>

          {/* Step 1: Type Selection */}
          {!selectedType && (
            <CreditTypeSelector onSelect={handleTypeSelect} selectedType={selectedType} />
          )}

          {/* Banks List - shown after disclaimer when a type is selected */}
          {selectedType && (
            <>
              <Button
                variant="ghost"
                onClick={handleBack}
                className="mb-6"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('credit.back')}
              </Button>

              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">{t('credit.bank.availableBanks')}</h2>
                <BanksList creditType={selectedType} />
              </div>
            </>
          )}

          {/* Step 2: Form and Results - Optional simulation */}
          {selectedType && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">{t('credit.bank.customSimulation')}</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Form */}
                <div className="sticky top-4 h-fit">
                  <CreditForm
                    tipo={selectedType}
                    onSubmit={handleFormSubmit}
                    loading={loading}
                  />
                </div>

                {/* Right: Results */}
                <div>
                  <CreditResults
                    results={results}
                    onAddToComparator={addToComparator}
                    loading={loading}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Comparator */}
          {comparisonItems.length > 0 && (
            <CreditComparator
              items={comparisonItems}
              onRemove={removeFromComparator}
              onClear={clearComparator}
            />
          )}

          {/* UVA Projection Chart */}
          {hasUVAInComparator && firstUVAItem && currentFormData && (
            <UVAProjectionChart
              cuotaInicial={firstUVAItem.cuota}
              inflacionAnual={currentFormData.inflacionEsperada || 140}
              plazoMeses={currentFormData.plazo}
              ingreso={currentFormData.ingreso}
            />
          )}

          {/* Disclaimer */}
          <CreditDisclaimer />
        </div>
      </div>
    </>
  );
};

export default CreditSimulator;
