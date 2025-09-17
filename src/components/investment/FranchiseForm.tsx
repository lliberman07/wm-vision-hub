import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { FranchiseData } from '@/types/investment';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '@/utils/numberFormat';
import { ARGENTINA_DATA, Province, City } from '@/data/argentina';

interface FranchiseFormProps {
  data: FranchiseData;
  onUpdate: (data: FranchiseData) => void;
}

export const FranchiseForm = ({ data, onUpdate }: FranchiseFormProps) => {
  const { language, t } = useLanguage();
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  // Initialize province and city selection based on data
  useEffect(() => {
    if (data.province) {
      const province = ARGENTINA_DATA.find(p => p.id === data.province);
      if (province) {
        setSelectedProvince(province);
        if (data.city) {
          const city = province.cities.find(c => c.id === data.city);
          if (city) {
            setSelectedCity(city);
          }
        }
      }
    }
  }, [data.province, data.city]);

  const handleInputChange = (field: keyof FranchiseData, value: string | number) => {
    onUpdate({ ...data, [field]: value });
  };

  const handleProvinceChange = (provinceId: string) => {
    const province = ARGENTINA_DATA.find(p => p.id === provinceId);
    setSelectedProvince(province || null);
    setSelectedCity(null);
    onUpdate({ 
      ...data, 
      province: provinceId, 
      city: '', 
      neighborhood: '' 
    });
  };

  const handleCityChange = (cityId: string) => {
    const city = selectedProvince?.cities.find(c => c.id === cityId);
    setSelectedCity(city || null);
    onUpdate({ 
      ...data, 
      city: cityId, 
      neighborhood: '' 
    });
  };

  // Calculate total amount
  const totalAmount = 
    data.entryFee + 
    data.constructionAndRemodel + 
    data.equipment + 
    data.variousFees + 
    data.realEstateExpenses + 
    data.launchExpenses + 
    data.staffTraining + 
    data.initialStock + 
    data.localRent + 
    data.localDeposit + 
    data.others;

  return (
    <div className="space-y-6">
      {/* Información General */}
      <Card>
        <CardHeader>
          <CardTitle>{t('franchise.generalInfo.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t('franchise.generalInfo.franchiseName')}</Label>
              <Input
                value={data.franchiseName}
                onChange={(e) => handleInputChange('franchiseName', e.target.value)}
                placeholder={t('franchise.generalInfo.franchiseNamePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('franchise.generalInfo.businessSector')}</Label>
              <Input
                value={data.businessSector}
                onChange={(e) => handleInputChange('businessSector', e.target.value)}
                placeholder={t('franchise.generalInfo.businessSectorPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('franchise.generalInfo.franchiseManager')}</Label>
              <Input
                value={data.franchiseManager}
                onChange={(e) => handleInputChange('franchiseManager', e.target.value)}
                placeholder={t('franchise.generalInfo.franchiseManagerPlaceholder')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información Financiera */}
      <Card>
        <CardHeader>
          <CardTitle>{t('franchise.financialInfo.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t('franchise.financialInfo.entryFee')}</Label>
              <Input
                type="number"
                value={data.entryFee || ''}
                onChange={(e) => handleInputChange('entryFee', Number(e.target.value) || 0)}
                placeholder="0"
                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('franchise.financialInfo.constructionAndRemodel')}</Label>
              <Input
                type="number"
                value={data.constructionAndRemodel || ''}
                onChange={(e) => handleInputChange('constructionAndRemodel', Number(e.target.value) || 0)}
                placeholder="0"
                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('franchise.financialInfo.equipment')}</Label>
              <Input
                type="number"
                value={data.equipment || ''}
                onChange={(e) => handleInputChange('equipment', Number(e.target.value) || 0)}
                placeholder="0"
                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('franchise.financialInfo.variousFees')}</Label>
              <Input
                type="number"
                value={data.variousFees || ''}
                onChange={(e) => handleInputChange('variousFees', Number(e.target.value) || 0)}
                placeholder="0"
                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('franchise.financialInfo.realEstateExpenses')}</Label>
              <Input
                type="number"
                value={data.realEstateExpenses || ''}
                onChange={(e) => handleInputChange('realEstateExpenses', Number(e.target.value) || 0)}
                placeholder="0"
                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('franchise.financialInfo.launchExpenses')}</Label>
              <Input
                type="number"
                value={data.launchExpenses || ''}
                onChange={(e) => handleInputChange('launchExpenses', Number(e.target.value) || 0)}
                placeholder="0"
                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('franchise.financialInfo.staffTraining')}</Label>
              <Input
                type="number"
                value={data.staffTraining || ''}
                onChange={(e) => handleInputChange('staffTraining', Number(e.target.value) || 0)}
                placeholder="0"
                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('franchise.financialInfo.initialStock')}</Label>
              <Input
                type="number"
                value={data.initialStock || ''}
                onChange={(e) => handleInputChange('initialStock', Number(e.target.value) || 0)}
                placeholder="0"
                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('franchise.financialInfo.localRent')}</Label>
              <Input
                type="number"
                value={data.localRent || ''}
                onChange={(e) => handleInputChange('localRent', Number(e.target.value) || 0)}
                placeholder="0"
                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('franchise.financialInfo.localDeposit')}</Label>
              <Input
                type="number"
                value={data.localDeposit || ''}
                onChange={(e) => handleInputChange('localDeposit', Number(e.target.value) || 0)}
                placeholder="0"
                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('franchise.financialInfo.others')}</Label>
              <Input
                type="number"
                value={data.others || ''}
                onChange={(e) => handleInputChange('others', Number(e.target.value) || 0)}
                placeholder="0"
                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex justify-between items-center">
            <Label className="text-lg font-semibold">{t('franchise.financialInfo.total')}</Label>
            <div className="text-xl font-bold text-primary">
              {formatCurrency(totalAmount, language)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ubicación del Local Comercial */}
      <Card>
        <CardHeader>
          <CardTitle>{t('franchise.location.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label>{t('franchise.location.province')}</Label>
              <Select value={data.province} onValueChange={handleProvinceChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t('franchise.location.selectProvince')} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {ARGENTINA_DATA.map((province) => (
                    <SelectItem key={province.id} value={province.id}>
                      {province.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>{t('franchise.location.city')}</Label>
              <Select 
                value={data.city} 
                onValueChange={handleCityChange}
                disabled={!selectedProvince}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('franchise.location.selectCity')} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {selectedProvince?.cities.map((city) => (
                    <SelectItem key={city.id} value={city.id}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t('franchise.location.neighborhood')}</Label>
              <Select 
                value={data.neighborhood} 
                onValueChange={(value) => handleInputChange('neighborhood', value)}
                disabled={!selectedCity}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('franchise.location.selectNeighborhood')} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {selectedCity?.neighborhoods.map((neighborhood) => (
                    <SelectItem key={neighborhood} value={neighborhood}>
                      {neighborhood}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>{t('franchise.location.address')}</Label>
              <Input
                value={data.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder={t('franchise.location.addressPlaceholder')}
              />
            </div>
            
            <div className="space-y-2">
              <Label>{t('franchise.location.squareMeters')}</Label>
              <Input
                type="number"
                value={data.squareMeters || ''}
                onChange={(e) => handleInputChange('squareMeters', Number(e.target.value) || 0)}
                placeholder="0"
                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};