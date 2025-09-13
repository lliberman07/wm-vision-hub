import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Download, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExportPDFDialogProps {
  simulationData: any;
  analysisResults: any;
  creditLines?: any[];
  estimatedMonthlyIncome?: number;
  grossMarginPercentage?: number;
  children: React.ReactNode;
}

export const ExportPDFDialog = ({ 
  simulationData, 
  analysisResults, 
  creditLines = [], 
  estimatedMonthlyIncome = 0, 
  grossMarginPercentage = 30, 
  children 
}: ExportPDFDialogProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const handleExport = async () => {
    if (!email) {
      toast({
        title: t("Error"),
        description: t("Please enter your email address"),
        variant: "destructive",
      });
      return;
    }

    if (!email.includes('@')) {
      toast({
        title: t("Error"),
        description: t("Please enter a valid email address"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Save simulation to database and request PDF
      const { data, error } = await supabase.functions.invoke('export-pdf-report', {
        body: {
          email,
          simulationData,
          analysisResults,
          language,
          creditLines,
          estimatedMonthlyIncome,
          grossMarginPercentage
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: t("Export Requested"),
        description: t("Your PDF report is being generated and will be sent to your email shortly. Reference: ") + data.referenceNumber,
      });

      setEmail('');
      setIsOpen(false);
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: t("Export Failed"),
        description: error.message || t("Failed to export PDF report"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t("Export to PDF")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("Email Address")}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder={t("Enter your email address")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {t("Your investment simulation report will be generated and sent to this email address.")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleExport}
              disabled={isLoading || !email}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("Generating...")}
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  {t("Generate PDF")}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              {t("Cancel")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};