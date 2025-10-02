import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ComparisonItem } from "@/types/credit";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatCurrency } from "@/utils/numberFormat";
import { X, Trash2 } from "lucide-react";

interface CreditComparatorProps {
  items: ComparisonItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

const CreditComparator = ({ items, onRemove, onClear }: CreditComparatorProps) => {
  const { t, language } = useLanguage();

  if (items.length === 0) {
    return null;
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('credit.comparator.title')}</CardTitle>
          <Button variant="outline" size="sm" onClick={onClear}>
            <Trash2 className="h-4 w-4 mr-2" />
            {t('credit.comparator.clear')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('credit.comparator.entidad')}</TableHead>
                <TableHead>{t('credit.comparator.producto')}</TableHead>
                <TableHead className="text-right">{t('credit.comparator.cuota')}</TableHead>
                <TableHead className="text-right">{t('credit.comparator.porcentaje')}</TableHead>
                <TableHead className="text-right">{t('credit.comparator.tasa')}</TableHead>
                <TableHead className="text-right">{t('credit.comparator.cft')}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.entidad}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.producto}
                      {item.esUVA && (
                        <Badge variant="secondary" className="text-xs">UVA</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-primary">
                    {formatCurrency(item.cuota, language, 'ARS')}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.porcentajeIngreso.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right">
                    {item.tasa > 0 ? `${(item.tasa * 100).toFixed(2)}%` : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.cft > 0 ? `${(item.cft * 100).toFixed(2)}%` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {items.some(item => item.esUVA) && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>{t('credit.comparator.uva.note')}:</strong> {t('credit.comparator.uva.description')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CreditComparator;
