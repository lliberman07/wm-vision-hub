import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import * as XLSX from 'xlsx';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface IndicesBulkImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  indexType: 'ICL' | 'UVA' | 'IPC';
}

interface ParsedIndexData {
  date: string; // YYYY-MM-DD for ICL/UVA, YYYY-MM for IPC
  value: number;
}

const indexConfig = {
  ICL: {
    title: 'Importación Masiva de ICL',
    description: 'Carga valores diarios de ICL desde Excel del IVC',
    source: 'IVC',
    format: 'dd/mm/yyyy',
    periodFormat: 'YYYY-MM-DD'
  },
  UVA: {
    title: 'Importación Masiva de UVA',
    description: 'Carga valores diarios de UVA desde Excel del BCRA',
    source: 'BCRA',
    format: 'dd/mm/yyyy',
    periodFormat: 'YYYY-MM-DD'
  },
  IPC: {
    title: 'Importación Masiva de IPC',
    description: 'Carga valores mensuales de IPC desde Excel del INDEC',
    source: 'INDEC',
    format: 'mm/yyyy',
    periodFormat: 'YYYY-MM'
  }
};

export function IndicesBulkImport({ open, onOpenChange, onSuccess, indexType }: IndicesBulkImportProps) {
  const { toast } = useToast();
  const config = indexConfig[indexType];
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<{ total: number; toImport: number; lastDate: string | null } | null>(null);
  const [parsedData, setParsedData] = useState<ParsedIndexData[]>([]);

  const parseExcelFile = async (file: File): Promise<ParsedIndexData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          const parsed: ParsedIndexData[] = [];
          
          // Skip header row (index 0)
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row[0] || !row[1]) continue;
            
            const dateStr = String(row[0]).trim();
            const valueStr = String(row[1]).trim();
            
            let isoDate: string;
            
            if (indexType === 'IPC') {
              // Parse mm/yyyy format
              const monthParts = dateStr.split('/');
              if (monthParts.length !== 2) continue;
              const month = monthParts[0].padStart(2, '0');
              const year = monthParts[1];
              isoDate = `${year}-${month}`;
            } else {
              // Parse dd/mm/yyyy format for ICL and UVA
              const dateParts = dateStr.split('/');
              if (dateParts.length !== 3) continue;
              const day = dateParts[0].padStart(2, '0');
              const month = dateParts[1].padStart(2, '0');
              const year = dateParts[2];
              isoDate = `${year}-${month}-${day}`;
            }
            
            // Parse value (replace comma with dot)
            const value = parseFloat(valueStr.replace(',', '.'));
            if (isNaN(value)) continue;
            
            parsed.push({ date: isoDate, value });
          }
          
          resolve(parsed);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsBinaryString(file);
    });
  };

  const getLastIndexDate = async (indexType: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from('pms_economic_indices')
      .select('period')
      .eq('index_type', indexType)
      .order('period', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    return data && data.length > 0 ? data[0].period : null;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setPreview(null);
    setParsedData([]);

    try {
      // Parse Excel file
      const parsed = await parseExcelFile(file);
      
      if (parsed.length === 0) {
        toast({
          title: "Error",
          description: "No se encontraron datos válidos en el archivo",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }

      // Get last index date from database
      const lastDate = await getLastIndexDate(indexType);
      
      // Filter only dates after last loaded date
      const toImport = lastDate 
        ? parsed.filter(item => item.date > lastDate)
        : parsed;
      
      setParsedData(toImport);
      setPreview({
        total: parsed.length,
        toImport: toImport.length,
        lastDate
      });

      if (toImport.length === 0) {
        toast({
          title: "Información",
          description: "Todos los registros del archivo ya están cargados en la base de datos",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error al procesar archivo",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    setIsProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Prepare batch insert data
      const records = parsedData.map(item => ({
        index_type: indexType,
        period: item.date,
        value: item.value,
        source: config.source,
        created_by: user?.id
      }));

      // Insert in batches of 100
      const batchSize = 100;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const { error } = await supabase
          .from('pms_economic_indices')
          .insert(batch);
        
        if (error) throw error;
      }

      toast({
        title: "Importación exitosa",
        description: `Se importaron ${parsedData.length} registros de ${indexType}`,
      });

      onSuccess();
      onOpenChange(false);
      setPreview(null);
      setParsedData([]);
    } catch (error: any) {
      toast({
        title: "Error al importar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>
            {config.description}. Solo se importarán fechas posteriores a la última cargada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              Formato esperado: Excel con columnas "Fecha ({config.format})" y "Valor"
            </p>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              id="excel-upload"
              disabled={isProcessing}
            />
            <label htmlFor="excel-upload">
              <Button asChild disabled={isProcessing}>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  {isProcessing ? "Procesando..." : "Seleccionar archivo Excel"}
                </span>
              </Button>
            </label>
          </div>

          {preview && (
            <div className="space-y-3">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p><strong>Total de registros en el archivo:</strong> {preview.total}</p>
                    <p><strong>Última fecha en base de datos:</strong> {preview.lastDate || 'Sin datos previos'}</p>
                    <p><strong>Registros nuevos a importar:</strong> {preview.toImport}</p>
                  </div>
                </AlertDescription>
              </Alert>

              {preview.toImport === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No hay registros nuevos para importar. Todos los datos del archivo ya existen en la base de datos.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
                    Cancelar
                  </Button>
                  <Button onClick={handleImport} disabled={isProcessing}>
                    {isProcessing ? "Importando..." : `Importar ${preview.toImport} registros`}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
