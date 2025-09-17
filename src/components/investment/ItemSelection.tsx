import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { InvestmentItem, CreditType } from '@/types/investment';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '@/utils/numberFormat';

interface ItemSelectionProps {
  items: InvestmentItem[];
  onUpdateItem: (id: string, updates: Partial<InvestmentItem>) => void;
  onAddCustomItem: (item: Omit<InvestmentItem, 'id'>) => void;
  onRemoveItem: (id: string) => void;
}

const getCreditLabel = (type: CreditType, t: (key: string) => string) =>
  type === 'personal'
    ? t('simulator.items.creditType.personal')
    : type === 'capital'
    ? t('simulator.items.creditType.capital')
    : t('simulator.items.creditType.mortgage');

const CREDIT_TYPE_COLORS: Record<CreditType, string> = {
  personal: 'bg-blue-100 text-blue-800',
  capital: 'bg-green-100 text-green-800',
  mortgage: 'bg-purple-100 text-purple-800'
};

export const ItemSelection = ({ items, onUpdateItem, onAddCustomItem, onRemoveItem }: ItemSelectionProps) => {
  const { language, t } = useLanguage();
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customItem, setCustomItem] = useState({
    name: '',
    amount: 0,
    creditType: 'personal' as CreditType
  });

  const handleItemToggle = (id: string, checked: boolean) => {
    onUpdateItem(id, { isSelected: checked });
  };

  const handleAmountChange = (id: string, amount: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    
    const roundedAmount = Math.round(amount);
    const advanceAmount = Math.round((roundedAmount * item.advancePercentage) / 100);
    const financeBalance = roundedAmount - advanceAmount;
    
    onUpdateItem(id, { 
      amount: roundedAmount, 
      advanceAmount,
      financeBalance
    });
  };

  const handleAdvanceChange = (id: string, percentage: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    
    const advanceAmount = Math.round((item.amount * percentage) / 100);
    const financeBalance = item.amount - advanceAmount;
    
    onUpdateItem(id, { 
      advancePercentage: percentage,
      advanceAmount,
      financeBalance
    });
  };

  const handleAdvanceAmountChange = (id: string, advanceAmount: number) => {
    const item = items.find(i => i.id === id);
    if (!item || item.amount === 0) return;
    
    const roundedAdvance = Math.round(advanceAmount);
    const percentage = Math.round((roundedAdvance / item.amount) * 100);
    const financeBalance = item.amount - roundedAdvance;
    
    onUpdateItem(id, { 
      advancePercentage: percentage,
      advanceAmount: roundedAdvance,
      financeBalance
    });
  };

  const handleAddCustomItem = () => {
    if (customItem.name && customItem.amount > 0) {
      onAddCustomItem({
        ...customItem,
        amount: Math.round(customItem.amount),
        isSelected: true,
        advancePercentage: 0,
        advanceAmount: 0,
        financeBalance: Math.round(customItem.amount),
        isCustom: true
      });
      setCustomItem({ name: '', amount: 0, creditType: 'personal' });
      setShowCustomForm(false);
    }
  };

  const totalInvestment = items
    .filter(item => item.isSelected)
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">{t('simulator.items.title')}</h3>
          <p className="text-muted-foreground">
            {t('simulator.items.description')}
          </p>
        </div>
        <div className="text-right">
          <Label className="text-sm text-muted-foreground">{t('simulator.items.totalInvestment')}</Label>
          <div className="text-2xl font-bold text-primary">
            {formatCurrency(totalInvestment, language)}
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.id} className={`transition-all ${item.isSelected ? 'ring-2 ring-primary' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={item.isSelected}
                    onCheckedChange={(checked) => handleItemToggle(item.id, !!checked)}
                  />
                  <div>
                    <CardTitle className="text-base">{item.nameKey ? t(item.nameKey) : item.name}</CardTitle>
                    <Badge className={CREDIT_TYPE_COLORS[item.creditType]} variant="secondary">
                      {getCreditLabel(item.creditType, t)}
                    </Badge>
                  </div>
                </div>
                {item.isCustom && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveItem(item.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            
            {item.isSelected && (
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>{t('simulator.items.totalAmount')}</Label>
                    <Input
                      type="number"
                      value={item.amount || ''}
                      onChange={(e) => handleAmountChange(item.id, Number(e.target.value) || 0)}
                      placeholder="0"
                      className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{t('simulator.items.advancePercentage')}</Label>
                    <Input
                      type="number"
                      value={item.advancePercentage || ''}
                      onChange={(e) => handleAdvanceChange(item.id, Number(e.target.value) || 0)}
                      min="0"
                      max="100"
                      className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{t('simulator.items.advanceAmount')}</Label>
                    <Input
                      type="number"
                      value={item.advanceAmount || ''}
                      onChange={(e) => handleAdvanceAmountChange(item.id, Number(e.target.value) || 0)}
                      min="0"
                      max={item.amount}
                      className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{t('simulator.items.financeBalance')}</Label>
                    <Input
                      type="number"
                      value={item.financeBalance}
                      readOnly
                      className="bg-muted [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>{t('simulator.items.creditType')}</Label>
                  <div className="p-2 border rounded-md bg-muted">
                    <Badge className={CREDIT_TYPE_COLORS[item.creditType]} variant="secondary">
                      {getCreditLabel(item.creditType, t)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Custom Item Form */}
      {showCustomForm ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('simulator.items.customTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t('simulator.items.itemName')}</Label>
                <Input
                  value={customItem.name}
                  onChange={(e) => setCustomItem(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('simulator.items.itemNamePlaceholder')}
                />
              </div>
              
              <div className="space-y-2">
                <Label>{t('simulator.items.estimatedAmount')}</Label>
                <Input
                  type="number"
                  value={customItem.amount || ''}
                  onChange={(e) => setCustomItem(prev => ({ ...prev, amount: Number(e.target.value) || 0 }))}
                  placeholder="0"
                  className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                />
              </div>
              
              <div className="space-y-2">
                <Label>{t('simulator.items.creditType')}</Label>
                <Select
                  value={customItem.creditType}
                  onValueChange={(value) => setCustomItem(prev => ({ ...prev, creditType: value as CreditType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">{t('simulator.items.creditType.personal')}</SelectItem>
                    <SelectItem value="capital">{t('simulator.items.creditType.capital')}</SelectItem>
                    <SelectItem value="mortgage">{t('simulator.items.creditType.mortgage')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={handleAddCustomItem}>{t('simulator.items.add')}</Button>
              <Button variant="outline" onClick={() => setShowCustomForm(false)}>
                {t('simulator.items.cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" onClick={() => setShowCustomForm(true)} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          {t('simulator.items.addCustom')}
        </Button>
      )}
    </div>
  );
};