import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, FileText, X } from "lucide-react";

interface ReceiptUploadProps {
  onUploadComplete: (url: string) => void;
  currentUrl?: string;
}

export function ReceiptUpload({ onUploadComplete, currentUrl }: ReceiptUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentUrl || "");

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from("payment-receipts")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from("payment-receipts")
        .getPublicUrl(filePath);

      setPreviewUrl(urlData.publicUrl);
      onUploadComplete(urlData.publicUrl);
      toast.success("Comprobante subido exitosamente");
    } catch (error) {
      console.error("Error uploading receipt:", error);
      toast.error("Error al subir el comprobante");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl("");
    onUploadComplete("");
  };

  return (
    <div className="space-y-2">
      {previewUrl ? (
        <div className="flex items-center gap-2 p-3 border rounded-lg">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm flex-1 truncate">Comprobante adjunto</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => window.open(previewUrl, "_blank")}
          >
            Ver
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileUpload}
            disabled={uploading}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Subiendo..." : "Subir"}
          </Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Formatos soportados: JPG, PNG, PDF (máx. 5MB)
      </p>
    </div>
  );
}
