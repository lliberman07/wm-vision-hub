import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvestmentItem, CreditLine, CreditType, DEFAULT_ITEMS } from "@/types/investment";
import { ItemSelection } from "@/components/investment/ItemSelection";
import { FinancingSources } from "@/components/investment/FinancingSources";
import { ResultsAnalysis } from "@/components/investment/ResultsAnalysis";
import { useInvestmentCalculations } from "@/hooks/useInvestmentCalculations";
import { useLanguage } from "@/contexts/LanguageContext";

const BusinessSimulator = () => {
  const { t } = useLanguage();
  const [items, setItems] = useState<InvestmentItem[]>(() =>
    DEFAULT_ITEMS.map((item, index) => ({ ...item, id: `item-${index}` }))
  );
  const [creditLines, setCreditLines] = useState<CreditLine[]>([]);
  const [estimatedMonthlyIncome, setEstimatedMonthlyIncome] = useState<number>(0);
  const [grossMarginPercentage, setGrossMarginPercentage] = useState<number>(30);

  const { selectedItems, creditLines: calculatedCreditLines, analysis, alerts } = useInvestmentCalculations(
    items,
    estimatedMonthlyIncome,
    grossMarginPercentage
  );

  const handleUpdateItem = (id: string, updates: Partial<InvestmentItem>) => {
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleAddCustomItem = (newItem: Omit<InvestmentItem, 'id'>) => {
    const id = `custom-${Date.now()}`;
    setItems(prev => [...prev, { ...newItem, id }]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateCreditLine = (type: CreditType, updates: Partial<CreditLine>) => {
    setCreditLines(prev => {
      const existingIndex = prev.findIndex(cl => cl.type === type);
      if (existingIndex >= 0) {
        return prev.map((cl, index) =>
          index === existingIndex ? { ...cl, ...updates } : cl
        );
      } else {
        const defaultCreditLine = calculatedCreditLines.find(cl => cl.type === type);
        if (defaultCreditLine) {
          return [...prev, { ...defaultCreditLine, ...updates }];
        }
        return prev;
      }
    });
  };

  // Use custom credit lines if available, otherwise use calculated ones
  const activeCreditLines = creditLines.length > 0 ? creditLines : calculatedCreditLines;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">{t('simulator.title')}</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {t('simulator.description')}
        </p>
      </div>

      <Tabs defaultValue="items" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="items">{t('simulator.tabs.configuration')}</TabsTrigger>
          <TabsTrigger value="financing">{t('simulator.tabs.financing')}</TabsTrigger>
          <TabsTrigger value="results">{t('simulator.tabs.results')}</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-6">
          <ItemSelection
            items={items}
            onUpdateItem={handleUpdateItem}
            onAddCustomItem={handleAddCustomItem}
            onRemoveItem={handleRemoveItem}
          />
        </TabsContent>

        <TabsContent value="financing" className="space-y-6">
          <FinancingSources
            creditLines={activeCreditLines}
            onUpdateCreditLine={handleUpdateCreditLine}
          />
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <ResultsAnalysis
            items={items}
            creditLines={activeCreditLines}
            analysis={analysis}
            alerts={alerts}
            estimatedMonthlyIncome={estimatedMonthlyIncome}
            grossMarginPercentage={grossMarginPercentage}
            onIncomeChange={setEstimatedMonthlyIncome}
            onMarginChange={setGrossMarginPercentage}
          />
        </TabsContent>
      </Tabs>
      
      <div className="mt-8 p-4 bg-muted/50 rounded-lg border text-center text-sm text-muted-foreground">
        <p>
          {t('simulator.disclaimer.text')}{' '}
          <a 
            href="#footer" 
            className="text-primary hover:underline"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector('footer')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {t('simulator.disclaimer.seeMore')}
          </a>
        </p>
      </div>
    </div>
  );
};

export default BusinessSimulator;