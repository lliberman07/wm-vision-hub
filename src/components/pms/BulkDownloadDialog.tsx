import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Download, FileText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import JSZip from 'jszip';

interface BulkDownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedReceipts: Array<{
    id: string;
    receipt_number: string;
    pdf_url: string;
    status: string;
  }>;
}

export function BulkDownloadDialog({ open, onOpenChange, selectedReceipts }: BulkDownloadDialogProps) {
  const [downloading, setDownloading] = useState(false);
  const [includeEmailLogs, setIncludeEmailLogs] = useState(false);

  const handleBulkDownload = async () => {
    setDownloading(true);
    try {
      const zip = new JSZip();
      const receiptsFolder = zip.folder('recibos');
      
      if (!receiptsFolder) {
        throw new Error('Error creating zip folder');
      }

      let successCount = 0;
      let errorCount = 0;

      // Descargar cada PDF
      for (const receipt of selectedReceipts) {
        if (receipt.status !== 'generated' || !receipt.pdf_url) {
          errorCount++;
          continue;
        }

        try {
          const { data, error } = await supabase.storage
            .from('payment-receipts')
            .download(receipt.pdf_url);

          if (error) throw error;

          // Agregar al ZIP
          receiptsFolder.file(`${receipt.receipt_number}.pdf`, data);
          successCount++;
        } catch (error) {
          console.error(`Error downloading receipt ${receipt.receipt_number}:`, error);
          errorCount++;
        }
      }

      // Si se solicitan logs de email, crear archivo CSV
      if (includeEmailLogs) {
        try {
          const receiptIds = selectedReceipts.map(r => r.id);
          const { data: emailLogs, error: logsError } = await supabase
            .from('pms_receipt_email_logs' as any)
            .select('*')
            .in('receipt_id', receiptIds)
            .order('sent_at', { ascending: false });

          if (!logsError && emailLogs && emailLogs.length > 0) {
            // Crear CSV
            const csvHeaders = 'Recibo ID,Email,Tipo,Estado,Fecha Envío,Error\n';
            const csvRows = emailLogs.map((log: any) => 
              `${log.receipt_id},"${log.recipient_email}",${log.recipient_type},${log.status},"${log.sent_at}","${log.error_message || ''}"`
            ).join('\n');
            
            const csvContent = csvHeaders + csvRows;
            receiptsFolder.file('registro_envios.csv', csvContent);
          }
        } catch (error) {
          console.error('Error generating email logs CSV:', error);
        }
      }

      // Generar y descargar ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recibos_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Descarga completada: ${successCount} recibos${errorCount > 0 ? `, ${errorCount} errores` : ''}`);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error in bulk download:', error);
      toast.error('Error al descargar recibos');
    } finally {
      setDownloading(false);
    }
  };

  const generatedCount = selectedReceipts.filter(r => r.status === 'generated').length;
  const totalCount = selectedReceipts.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Descarga Masiva de Recibos
          </DialogTitle>
          <DialogDescription>
            Descargar {totalCount} recibo{totalCount !== 1 ? 's' : ''} seleccionado{totalCount !== 1 ? 's' : ''} en un archivo ZIP
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {generatedCount < totalCount && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {totalCount - generatedCount} recibo{totalCount - generatedCount !== 1 ? 's' : ''} no {totalCount - generatedCount !== 1 ? 'están' : 'está'} generado{totalCount - generatedCount !== 1 ? 's' : ''} y {totalCount - generatedCount !== 1 ? 'serán omitidos' : 'será omitido'} de la descarga.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Recibos a descargar</p>
                  <p className="text-sm text-muted-foreground">
                    {generatedCount} archivo{generatedCount !== 1 ? 's' : ''} PDF
                  </p>
                </div>
              </div>
              <span className="text-2xl font-bold">{generatedCount}</span>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-logs"
                checked={includeEmailLogs}
                onCheckedChange={(checked) => setIncludeEmailLogs(checked as boolean)}
              />
              <Label htmlFor="include-logs" className="cursor-pointer">
                Incluir registro de envíos por email (CSV)
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={downloading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleBulkDownload}
            disabled={downloading || generatedCount === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {downloading ? 'Descargando...' : `Descargar ${generatedCount} Recibo${generatedCount !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
