import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, AlertTriangle } from "lucide-react";
import * as XLSX from 'xlsx';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";

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

interface PreviewData {
  total: number;
  toImport: number;
  lastDate: string | null;
  firstDate: string | null;
  lastParsedDate: string | null;
  expectedDays: number | null;
  warnings: string[];
}

export function IndicesBulkImport({ open, onOpenChange, onSuccess, indexType }: IndicesBulkImportProps) {
  const { toast } = useToast();
  const config = indexConfig[indexType];
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
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
          
          // Get the range
          const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
          const parsed: ParsedIndexData[] = [];
          
          // Skip header row (start from row 1 instead of 0)
          for (let rowNum = range.s.r + 1; rowNum <= range.e.r; rowNum++) {
            const dateCell = worksheet[XLSX.utils.encode_cell({ r: rowNum, c: 0 })];
            const valueCell = worksheet[XLSX.utils.encode_cell({ r: rowNum, c: 1 })];
            
            if (!dateCell || !valueCell) continue;
            
            let dateStr: string;
            
            // Detectar si es un número serial de Excel (SIEMPRE convertir manualmente)
            if (typeof dateCell.v === 'number') {
              // Fórmula estándar de Microsoft: 25569 = días entre Excel epoch y Unix epoch
              // Esta fórmula ya maneja automáticamente el bug del 29/02/1900
              const jsDate = new Date((dateCell.v - 25569) * 86400000);
              
              // Extraer componentes de la fecha usando UTC para evitar timezone issues
              const day = String(jsDate.getUTCDate()).padStart(2, '0');
              const month = String(jsDate.getUTCMonth() + 1).padStart(2, '0');
              const year = jsDate.getUTCFullYear();
              
              dateStr = `${day}/${month}/${year}`;
              
              // Debug logging (opcional - primeras 5 filas)
              if (rowNum <= 6) {
                console.log(`Row ${rowNum}:`, {
                  'dateCell.v': dateCell.v,
                  'dateCell.w': dateCell.w,
                  'dateStr': dateStr
                });
              }
            } else {
              // Usar el texto formateado o el valor como string
              dateStr = (dateCell.w || String(dateCell.v)).trim();
            }
            
            const valueStr = String(valueCell.v).trim();
            
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
      
      // Validations for daily indices
      const warnings: string[] = [];
      let expectedDays: number | null = null;
      
      if ((indexType === 'ICL' || indexType === 'UVA') && toImport.length > 0) {
        const firstDate = new Date(toImport[0].date);
        const lastParsedDate = new Date(toImport[toImport.length - 1].date);
        const daysDiff = Math.floor((lastParsedDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        expectedDays = daysDiff;
        
        // Check for date coherence
        if (daysDiff > toImport.length * 1.5) {
          warnings.push(`⚠️ Hay ${daysDiff} días entre primera y última fecha, pero solo ${toImport.length} registros`);
        }
        
        // Check for suspicious date patterns (all starting on same day)
        const daysOfMonth = toImport.map(item => {
          const d = new Date(item.date);
          return d.getDate();
        });
        const uniqueDays = new Set(daysOfMonth);
        if (uniqueDays.size === 1 && toImport.length > 10) {
          warnings.push(`⚠️ Todas las fechas caen el día ${Array.from(uniqueDays)[0]} del mes - verifica el formato`);
        }
        
        // Validar que la primera fecha sea lógica
        const firstParsed = toImport[0].date;
        const [year, month, day] = firstParsed.split('-').map(Number);
        
        if (day > 31 || day < 1) {
          warnings.push(`⚠️ Primera fecha sospechosa: ${firstParsed}. Posible error de conversión.`);
        }
        
        if (year < 2024 || year > 2026) {
          warnings.push(`⚠️ Año sospechoso: ${year}. Verifica que las fechas estén correctas.`);
        }
      }
      
      setParsedData(toImport);
      setPreview({
        total: parsed.length,
        toImport: toImport.length,
        lastDate,
        firstDate: toImport.length > 0 ? toImport[0].date : null,
        lastParsedDate: toImport.length > 0 ? toImport[toImport.length - 1].date : null,
        expectedDays,
        warnings
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
              {preview.warnings.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      {preview.warnings.map((warning, idx) => (
                        <p key={idx}>{warning}</p>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p><strong>Total de registros en el archivo:</strong> {preview.total}</p>
                    <p><strong>Última fecha en base de datos:</strong> {preview.lastDate ? format(new Date(preview.lastDate), 'dd/MM/yyyy') : 'Sin datos previos'}</p>
                    <p><strong>Registros nuevos a importar:</strong> {preview.toImport}</p>
                    {preview.firstDate && preview.lastParsedDate && (
                      <>
                        <p><strong>Primera fecha a importar:</strong> {format(new Date(preview.firstDate), 'dd/MM/yyyy')}</p>
                        <p><strong>Última fecha a importar:</strong> {format(new Date(preview.lastParsedDate), 'dd/MM/yyyy')}</p>
                        {preview.expectedDays && (
                          <p><strong>Días en el rango:</strong> {preview.expectedDays}</p>
                        )}
                      </>
                    )}
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
