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

interface ItemSelectionProps {
  items: InvestmentItem[];
  onUpdateItem: (id: string, updates: Partial<InvestmentItem>) => void;
  onAddCustomItem: (item: Omit<InvestmentItem, 'id'>) => void;
  onRemoveItem: (id: string) => void;
}

const CREDIT_TYPE_LABELS: Record<CreditType, string> = {
  personal: 'Personal',
  capital: 'Bienes de Capital',
  mortgage: 'Hipotecario'
};

const CREDIT_TYPE_COLORS: Record<CreditType, string> = {
  personal: 'bg-blue-100 text-blue-800',
  capital: 'bg-green-100 text-green-800',
  mortgage: 'bg-purple-100 text-purple-800'
};

export const ItemSelection = ({ items, onUpdateItem, onAddCustomItem, onRemoveItem }: ItemSelectionProps) => {
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
    
    const advanceAmount = (amount * item.advancePercentage) / 100;
    const financeBalance = amount - advanceAmount;
    
    onUpdateItem(id, { 
      amount, 
      advanceAmount: Math.round(advanceAmount),
      financeBalance: Math.round(financeBalance)
    });
  };

  const handleAdvanceChange = (id: string, percentage: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    
    const advanceAmount = (item.amount * percentage) / 100;
    const financeBalance = item.amount - advanceAmount;
    
    onUpdateItem(id, { 
      advancePercentage: percentage,
      advanceAmount: Math.round(advanceAmount),
      financeBalance: Math.round(financeBalance)
    });
  };

  const handleAdvanceAmountChange = (id: string, advanceAmount: number) => {
    const item = items.find(i => i.id === id);
    if (!item || item.amount === 0) return;
    
    const percentage = (advanceAmount / item.amount) * 100;
    const financeBalance = item.amount - advanceAmount;
    
    onUpdateItem(id, { 
      advancePercentage: Math.round(percentage),
      advanceAmount,
      financeBalance: Math.round(financeBalance)
    });
  };

  const handleAddCustomItem = () => {
    if (customItem.name && customItem.amount > 0) {
      onAddCustomItem({
        ...customItem,
        isSelected: true,
        advancePercentage: 0,
        advanceAmount: 0,
        financeBalance: customItem.amount,
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
          <h3 className="text-xl font-semibold">Selección de Ítems de Inversión</h3>
          <p className="text-muted-foreground">
            Seleccione los ítems que componen su plan de inversión
          </p>
        </div>
        <div className="text-right">
          <Label className="text-sm text-muted-foreground">Total de Inversión</Label>
          <div className="text-2xl font-bold text-primary">
            ${totalInvestment.toLocaleString()}
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
                    <CardTitle className="text-base">{item.name}</CardTitle>
                    <Badge className={CREDIT_TYPE_COLORS[item.creditType]} variant="secondary">
                      {CREDIT_TYPE_LABELS[item.creditType]}
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
                    <Label>Monto Total</Label>
                    <Input
                      type="number"
                      value={item.amount}
                      onChange={(e) => handleAmountChange(item.id, Number(e.target.value))}
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Adelanto (%)</Label>
                    <Input
                      type="number"
                      value={item.advancePercentage}
                      onChange={(e) => handleAdvanceChange(item.id, Number(e.target.value))}
                      min="0"
                      max="100"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Adelanto ($)</Label>
                    <Input
                      type="number"
                      value={item.advanceAmount}
                      onChange={(e) => handleAdvanceAmountChange(item.id, Number(e.target.value))}
                      min="0"
                      max={item.amount}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>A Financiar</Label>
                    <Input
                      type="number"
                      value={item.financeBalance}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Tipo de Crédito</Label>
                  <Select
                    value={item.creditType}
                    onValueChange={(value) => onUpdateItem(item.id, { creditType: value as CreditType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Crédito Personal</SelectItem>
                      <SelectItem value="capital">Bienes de Capital</SelectItem>
                      <SelectItem value="mortgage">Crédito Hipotecario</SelectItem>
                    </SelectContent>
                  </Select>
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
            <CardTitle>Agregar Ítem Personalizado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Nombre del Ítem</Label>
                <Input
                  value={customItem.name}
                  onChange={(e) => setCustomItem(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Equipamiento especializado"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Monto Estimado</Label>
                <Input
                  type="number"
                  value={customItem.amount}
                  onChange={(e) => setCustomItem(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Tipo de Crédito</Label>
                <Select
                  value={customItem.creditType}
                  onValueChange={(value) => setCustomItem(prev => ({ ...prev, creditType: value as CreditType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Crédito Personal</SelectItem>
                    <SelectItem value="capital">Bienes de Capital</SelectItem>
                    <SelectItem value="mortgage">Crédito Hipotecario</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={handleAddCustomItem}>Agregar</Button>
              <Button variant="outline" onClick={() => setShowCustomForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" onClick={() => setShowCustomForm(true)} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Agregar Ítem Personalizado
        </Button>
      )}
    </div>
  );
};