import { useState } from 'react';
import { FileDown, Presentation, FileText, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  downloadUltraExecutivePDF,
  downloadExecutivePDF,
  downloadFullPDF,
} from '@/utils/pmsPresentationPDF';

export const ExportPresentationButton = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleDownload = async (type: 'ultra' | 'executive' | 'full') => {
    setIsGenerating(true);
    
    try {
      switch (type) {
        case 'ultra':
          downloadUltraExecutivePDF();
          toast({
            title: 'PDF generado',
            description: 'Presentación Ultra-Ejecutiva (5 slides) descargada',
          });
          break;
        case 'executive':
          downloadExecutivePDF();
          toast({
            title: 'PDF generado',
            description: 'Presentación Ejecutiva (10 slides) descargada',
          });
          break;
        case 'full':
          downloadFullPDF();
          toast({
            title: 'PDF generado',
            description: 'Presentación Completa (20 slides) descargada',
          });
          break;
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'No se pudo generar el PDF. Intente nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isGenerating}>
          <Presentation className="h-4 w-4 mr-2" />
          {isGenerating ? 'Generando...' : 'Descargar Presentación'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 bg-background border">
        <DropdownMenuLabel className="text-muted-foreground">
          Seleccionar versión
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => handleDownload('ultra')}
          className="cursor-pointer py-3"
        >
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div>
              <div className="font-medium">Ultra-Ejecutiva</div>
              <div className="text-sm text-muted-foreground">
                5 slides • Elevator pitch (2 min)
              </div>
            </div>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleDownload('executive')}
          className="cursor-pointer py-3"
        >
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <div className="font-medium">Ejecutiva</div>
              <div className="text-sm text-muted-foreground">
                10 slides • Primera reunión (10 min)
              </div>
            </div>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleDownload('full')}
          className="cursor-pointer py-3"
        >
          <div className="flex items-start gap-3">
            <FileDown className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <div className="font-medium">Completa</div>
              <div className="text-sm text-muted-foreground">
                20 slides • Cierre de venta (30 min)
              </div>
            </div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
