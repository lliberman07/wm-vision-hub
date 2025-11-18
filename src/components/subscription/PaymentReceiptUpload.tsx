import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, Loader2 } from 'lucide-react';

interface PaymentReceiptUploadProps {
  invoiceId: string;
  tenantId: string;
  amount: number;
  onSuccess?: () => void;
}

export function PaymentReceiptUpload({ 
  invoiceId, 
  tenantId, 
  amount,
  onSuccess 
}: PaymentReceiptUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          title: 'Formato no válido',
          description: 'Solo se permiten imágenes (JPG, PNG) o archivos PDF',
          variant: 'destructive',
        });
        return;
      }
      
      // Validar tamaño (máx 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: 'Archivo muy grande',
          description: 'El archivo no debe superar los 5MB',
          variant: 'destructive',
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'Archivo requerido',
        description: 'Por favor selecciona un comprobante de pago',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Subir archivo a storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${invoiceId}_${Date.now()}.${fileExt}`;
      const filePath = `payment-receipts/${tenantId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Crear registro de comprobante
      const { error: insertError } = await supabase
        .from('payment_receipts')
        .insert({
          invoice_id: invoiceId,
          tenant_id: tenantId,
          receipt_url: publicUrl,
          payment_date: paymentDate,
          amount,
          uploaded_by: user.id,
          verification_status: 'pending',
          receipt_type: fileExt === 'pdf' ? 'pdf' : 'image',
        });

      if (insertError) throw insertError;

      toast({
        title: 'Comprobante subido',
        description: 'Tu comprobante está siendo verificado por nuestro equipo',
      });

      setFile(null);
      onSuccess?.();
    } catch (error) {
      console.error('Error uploading receipt:', error);
      toast({
        title: 'Error',
        description: 'No se pudo subir el comprobante. Intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Subir Comprobante de Pago
        </CardTitle>
        <CardDescription>
          Sube tu comprobante de transferencia o depósito para verificar tu pago
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="payment-date">Fecha de Pago</Label>
          <Input
            id="payment-date"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div>
          <Label htmlFor="receipt-file">Comprobante (JPG, PNG o PDF)</Label>
          <Input
            id="receipt-file"
            type="file"
            accept="image/jpeg,image/png,image/jpg,application/pdf"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {file && (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              {file.name} ({(file.size / 1024).toFixed(0)} KB)
            </div>
          )}
        </div>

        <Button 
          onClick={handleUpload} 
          disabled={!file || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Subir Comprobante
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
