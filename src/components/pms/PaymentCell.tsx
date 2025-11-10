import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/numberFormat';
import { CheckCircle2, Clock, AlertCircle, DollarSign } from 'lucide-react';

interface PaymentCellProps {
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  expectedAmount: number;
  paidAmount?: number;
  periodDate: string;
  onClick: () => void;
  isReimbursement?: boolean;
}

export function PaymentCell({ 
  status, 
  expectedAmount, 
  paidAmount, 
  periodDate,
  onClick,
  isReimbursement 
}: PaymentCellProps) {
  const isOverdue = new Date(periodDate) < new Date() && status !== 'paid';

  const getStatusConfig = () => {
    switch (status) {
      case 'paid':
        return {
          icon: CheckCircle2,
          color: 'bg-green-50 hover:bg-green-100 border-green-200',
          textColor: 'text-green-700',
          badge: 'Pagado',
          badgeVariant: 'default' as const,
        };
      case 'partial':
        return {
          icon: DollarSign,
          color: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
          textColor: 'text-orange-700',
          badge: 'Parcial',
          badgeVariant: 'secondary' as const,
        };
      case 'overdue':
        return {
          icon: AlertCircle,
          color: 'bg-red-50 hover:bg-red-100 border-red-200 animate-pulse',
          textColor: 'text-red-700',
          badge: 'Vencido',
          badgeVariant: 'destructive' as const,
        };
      default:
        return {
          icon: Clock,
          color: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200',
          textColor: 'text-yellow-700',
          badge: 'Pendiente',
          badgeVariant: 'outline' as const,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-3 rounded-lg border-2 transition-all cursor-pointer text-left',
        config.color,
        isOverdue && 'ring-2 ring-red-500 ring-offset-2',
        isReimbursement && 'border-purple-400 bg-gradient-to-br from-purple-50 to-purple-100/50'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Icon className={cn('h-4 w-4 flex-shrink-0', config.textColor)} />
            <Badge variant={config.badgeVariant} className="text-xs">
              {config.badge}
            </Badge>
            {isReimbursement && (
              <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-300">
                💰 Reembolso
              </Badge>
            )}
          </div>
          <p className={cn('text-sm font-semibold', config.textColor)}>
            {formatCurrency(expectedAmount, 'es', 'ARS')}
          </p>
          {paidAmount && paidAmount > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Pagado: {formatCurrency(paidAmount, 'es', 'ARS')}
            </p>
          )}
        </div>
      </div>
      {isOverdue && (
        <p className="text-xs text-red-600 mt-2 font-medium">
          ⚠️ Vencido
        </p>
      )}
    </button>
  );
}
