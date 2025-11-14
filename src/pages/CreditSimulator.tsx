import { useState } from "react";
import { Helmet } from "react-helmet";
import { CreditType, CreditFormData } from "@/types/credit";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCreditSimulation } from "@/hooks/useCreditSimulation";
import { useCreditComparator } from "@/hooks/useCreditComparator";
import { useMortgageSimulation } from "@/hooks/useMortgageSimulation";
import CreditTypeSelector from "@/components/credit/CreditTypeSelector";
import CreditForm from "@/components/credit/CreditForm";
import CreditResults from "@/components/credit/CreditResults";
import CreditComparator from "@/components/credit/CreditComparator";
import CreditDisclaimer from "@/components/credit/CreditDisclaimer";
import UVAProjectionChart from "@/components/credit/UVAProjectionChart";
import UVAComparisonChart from "@/components/credit/UVAComparisonChart";
import UVARiskIndicator from "@/components/credit/UVARiskIndicator";
import UVAScenarioSimulator from "@/components/credit/UVAScenarioSimulator";
import BanksList from "@/components/credit/BanksList";
import { MortgageForm } from "@/components/credit/MortgageForm";
import { MortgageResultsTable } from "@/components/credit/MortgageResultsTable";
import { MortgageDisclaimer } from "@/components/credit/MortgageDisclaimer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const CreditSimulator = () => {
  const { t } = useLanguage();
  const [selectedType, setSelectedType] = useState<CreditType | undefined>();
  const [currentFormData, setCurrentFormData] = useState<CreditFormData | undefined>();
  const [showMortgageSimulator, setShowMortgageSimulator] = useState(false);
  
  const { simulate, loading, results, clearResults } = useCreditSimulation();
  const { items: comparisonItems, add: addToComparator, remove: removeFromComparator, clear: clearComparator } = useCreditComparator();
  
  const {
    results: mortgageResults,
    loading: mortgageLoading,
    error: mortgageError,
    simulateMortgage
  } = useMortgageSimulation();

  const handleTypeSelect = (type: CreditType) => {
    setSelectedType(type);
    setCurrentFormData(undefined);
    clearResults();
    setShowMortgageSimulator(type === 'hipotecario');
  };

  const handleMortgageSubmit = (data: any) => {
    simulateMortgage(data);
  };

  const handleFormSubmit = (data: CreditFormData) => {
    setCurrentFormData(data);
    simulate(data);
  };

  const handleBack = () => {
    setSelectedType(undefined);
    setCurrentFormData(undefined);
    clearResults();
    setShowMortgageSimulator(false);
  };

  const hasUVAInComparator = comparisonItems.some(item => item.esUVA);
  const firstUVAItem = comparisonItems.find(item => item.esUVA);

  return (
    <>
      <Helmet>
        <title>{t('credit.page.title')} - Granada Platform</title>
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

          {/* Mortgage Simulator */}
          {selectedType === 'hipotecario' && showMortgageSimulator && (
            <>
              <Button
                variant="ghost"
                onClick={handleBack}
                className="mb-6"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('credit.back')}
              </Button>

              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-6">{t('mortgage.form.title')}</h2>
                  <MortgageForm onSubmit={handleMortgageSubmit} loading={mortgageLoading} />
                </div>

                {mortgageError && (
                  <div className="bg-red-50 text-red-800 p-4 rounded-md">
                    {mortgageError}
                  </div>
                )}

                {mortgageResults.length > 0 && (
                  <MortgageResultsTable results={mortgageResults} />
                )}

                <MortgageDisclaimer />
              </div>
            </>
          )}

          {/* Banks List and Regular Simulator for personal and prendario */}
          {selectedType && selectedType !== 'hipotecario' && (
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

              <div className="mt-12">
                <h2 className="text-2xl font-bold mb-6">{t('credit.bank.customSimulation')}</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="sticky top-4 h-fit">
                    <CreditForm
                      tipo={selectedType}
                      onSubmit={handleFormSubmit}
                      loading={loading}
                    />
                  </div>

                  <div>
                    <CreditResults
                      results={results}
                      onAddToComparator={addToComparator}
                      loading={loading}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Comparator */}
          {comparisonItems.length > 0 && (
            <CreditComparator
              items={comparisonItems}
              onRemove={removeFromComparator}
              onClear={clearComparator}
            />
          )}

          {/* UVA Analysis Components */}
          {hasUVAInComparator && firstUVAItem && currentFormData && (
            <div className="space-y-8">
              {/* Original Projection Chart */}
              <UVAProjectionChart
                cuotaInicial={firstUVAItem.cuota}
                inflacionAnual={currentFormData.inflacionEsperada || 140}
                plazoMeses={currentFormData.plazo}
                ingreso={currentFormData.ingreso}
              />
              
              {/* Risk Indicator */}
              <UVARiskIndicator
                cuotaInicial={firstUVAItem.cuota}
                ingreso={currentFormData.ingreso}
                plazoMeses={currentFormData.plazo}
                inflacionAnual={currentFormData.inflacionEsperada || 140}
                aumentoSalarialEsperado={currentFormData.inflacionEsperada || 140}
              />
              
              {/* Comparison UVA vs Traditional */}
              <UVAComparisonChart
                monto={currentFormData.monto}
                plazoMeses={currentFormData.plazo}
                tasaUVA={firstUVAItem.tasa}
                tasaTradicional={firstUVAItem.tasa * 2} // Aproximación: tradicional ~2x la tasa UVA
                inflacionAnual={currentFormData.inflacionEsperada || 140}
                ingreso={currentFormData.ingreso}
              />
              
              {/* Multi-Scenario Simulator */}
              <UVAScenarioSimulator
                cuotaInicial={firstUVAItem.cuota}
                plazoMeses={currentFormData.plazo}
                ingreso={currentFormData.ingreso}
                inflacionBase={currentFormData.inflacionEsperada || 140}
              />
            </div>
          )}

          {/* Disclaimer */}
          <CreditDisclaimer />
        </div>
      </div>
    </>
  );
};

export default CreditSimulator;
