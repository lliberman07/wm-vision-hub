import { useState, useEffect } from 'react';
import { usePMS } from '@/contexts/PMSContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Download, FileText, CheckCircle, XCircle, Clock, Eye, Mail } from 'lucide-react';
import { ReceiptsFilterBar, ReceiptFilters } from './ReceiptsFilterBar';
import { BulkDownloadDialog } from './BulkDownloadDialog';
import { PaymentReceiptViewer } from './PaymentReceiptViewer';
import { formatDateDisplay } from '@/utils/dateUtils';

interface Receipt {
  id: string;
  receipt_number: string;
  receipt_date: string;
  pdf_url: string;
  status: string;
  pdf_generated_at: string;
  metadata: any;
  tenant_id: string;
  payment_id: string;
  contract_id: string;
  payment?: {
    paid_amount: number;
    contract: {
      contract_number: string;
      tenant_renter: {
        full_name: string;
      };
    };
  };
}

export function ReceiptsManagement() {
  const { currentTenant } = usePMS();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipts, setSelectedReceipts] = useState<Set<string>>(new Set());
  const [bulkDownloadOpen, setBulkDownloadOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    if (currentTenant) {
      fetchReceipts();
    }
  }, [currentTenant]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pms_payment_receipts' as any)
        .select(`
          *,
          payment:pms_payments (
            paid_amount,
            contract:pms_contracts (
              contract_number,
              tenant_renter:pms_tenants_renters (
                full_name
              )
            )
          )
        `)
        .eq('tenant_id', currentTenant.id)
        .order('receipt_date', { ascending: false });

      if (error) throw error;

      const receiptsData = (data || []) as unknown as Receipt[];
      setReceipts(receiptsData);
      setFilteredReceipts(receiptsData);
    } catch (error: any) {
      console.error('Error fetching receipts:', error);
      toast.error('Error al cargar recibos');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filters: ReceiptFilters) => {
    let filtered = [...receipts];

    // Filtro por búsqueda
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(receipt => 
        receipt.receipt_number.toLowerCase().includes(searchLower) ||
        receipt.payment?.contract?.contract_number?.toLowerCase().includes(searchLower) ||
        receipt.payment?.contract?.tenant_renter?.full_name?.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por estado
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(receipt => receipt.status === filters.status);
    }

    // Filtro por fecha desde
    if (filters.dateFrom) {
      filtered = filtered.filter(receipt => 
        new Date(receipt.receipt_date) >= filters.dateFrom!
      );
    }

    // Filtro por fecha hasta
    if (filters.dateTo) {
      filtered = filtered.filter(receipt => 
        new Date(receipt.receipt_date) <= filters.dateTo!
      );
    }

    setFilteredReceipts(filtered);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReceipts(new Set(filteredReceipts.map(r => r.id)));
    } else {
      setSelectedReceipts(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedReceipts);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedReceipts(newSelected);
  };

  const handleBulkDownload = () => {
    if (selectedReceipts.size === 0) {
      toast.error('Seleccione al menos un recibo');
      return;
    }
    setBulkDownloadOpen(true);
  };

  const handleDownloadSingle = async (receipt: Receipt) => {
    if (!receipt.pdf_url) {
      toast.error('El recibo no tiene PDF generado');
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('payment-receipts')
        .download(receipt.pdf_url);

      if (error) throw error;

      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${receipt.receipt_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Recibo descargado');
    } catch (error: any) {
      console.error('Error downloading receipt:', error);
      toast.error('Error al descargar recibo');
    }
  };

  const handleResendEmails = async (receiptId: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-payment-receipt-emails', {
        body: { receipt_id: receiptId },
      });

      if (error) throw error;

      toast.success('Emails reenviados correctamente');
    } catch (error: any) {
      console.error('Error resending emails:', error);
      toast.error('Error al reenviar emails');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'generated':
        return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" /> Generado</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pendiente</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const selectedReceiptsData = filteredReceipts.filter(r => selectedReceipts.has(r.id));

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Recibos</h1>
          <p className="text-muted-foreground">Administrar y descargar recibos de pago</p>
        </div>

        {selectedReceipts.size > 0 && (
          <Button onClick={handleBulkDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Descargar Seleccionados ({selectedReceipts.size})
          </Button>
        )}
      </div>

      {/* Filtros */}
      <ReceiptsFilterBar
        onFilterChange={handleFilterChange}
        totalCount={receipts.length}
        filteredCount={filteredReceipts.length}
      />

      {/* Tabla de recibos */}
      <Card>
        <CardContent className="p-0">
          {filteredReceipts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No se encontraron recibos</h3>
              <p className="text-muted-foreground">
                Intente ajustar los filtros de búsqueda
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedReceipts.size === filteredReceipts.length && filteredReceipts.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>N° Recibo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Inquilino</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceipts.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedReceipts.has(receipt.id)}
                        onCheckedChange={(checked) => handleSelectOne(receipt.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{receipt.receipt_number}</TableCell>
                    <TableCell>{formatDateDisplay(receipt.receipt_date)}</TableCell>
                    <TableCell>{receipt.payment?.contract?.contract_number || '-'}</TableCell>
                    <TableCell>{receipt.payment?.contract?.tenant_renter?.full_name || '-'}</TableCell>
                    <TableCell className="text-right font-medium">
                      ${receipt.payment?.paid_amount?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) || '0.00'}
                    </TableCell>
                    <TableCell>{getStatusBadge(receipt.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPaymentId(receipt.payment_id);
                            setViewerOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {receipt.status === 'generated' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadSingle(receipt)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResendEmails(receipt.id)}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Diálogos */}
      <BulkDownloadDialog
        open={bulkDownloadOpen}
        onOpenChange={setBulkDownloadOpen}
        selectedReceipts={selectedReceiptsData}
      />

      {selectedPaymentId && (
        <PaymentReceiptViewer
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          paymentId={selectedPaymentId}
        />
      )}
    </div>
  );
}
