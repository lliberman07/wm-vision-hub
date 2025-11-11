import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface OwnerReportDirectDownloadProps {
  contractId: string;
  propertyId: string;
  propertyCode?: string;
  children: React.ReactNode;
}

export const OwnerReportDirectDownload = ({ 
  contractId, 
  propertyId,
  propertyCode = 'Propiedad',
  children 
}: OwnerReportDirectDownloadProps) => {
  const [loading, setLoading] = useState(false);

  const handleDirectDownload = async () => {
    setLoading(true);
    
    try {
      // Usar el mes en curso al momento de la consulta
      const today = new Date();
      const currentPeriod = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      
      console.log("Generando PDF para período en curso:", currentPeriod);

      // Obtener propietarios activos de la propiedad
      const { data: ownersData, error: ownersError } = await supabase
        .from("pms_owner_properties")
        .select(`
          owner_id,
          share_percent,
          pms_owners!inner(id, full_name, email)
        `)
        .eq("property_id", propertyId)
        .gt("share_percent", 0)
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString().split('T')[0]}`);

      if (ownersError) {
        console.error("Error fetching owners:", ownersError);
        toast.error("Error al cargar propietarios");
        return;
      }

      if (!ownersData || ownersData.length === 0) {
        toast.error("No hay propietarios activos para esta propiedad");
        return;
      }

      console.log("Propietarios encontrados:", ownersData.length);

      // Obtener datos de todos los propietarios
      const reportDataPromises = ownersData.map(async (ownerItem: any) => {
        const { data, error } = await supabase.functions.invoke("send-owner-monthly-report", {
          body: {
            contract_id: contractId,
            period: currentPeriod,
            owner_id: ownerItem.pms_owners.id,
            send_email: false,
            manual: true,
          },
        });

        if (error || !data?.success) {
          console.error(`Error for owner ${ownerItem.pms_owners.full_name}:`, error);
          return null;
        }

        return data.data;
      });

      const allReportsData = await Promise.all(reportDataPromises);
      const validReports = allReportsData.filter(r => r !== null);

      if (validReports.length === 0) {
        toast.error("No se pudieron obtener datos para generar el PDF");
        return;
      }

      console.log("Datos obtenidos, generando PDF...");

      // Función local para formatear montos en el PDF
      const formatAmount = (amount: number, currency: string = 'ARS') => {
        const rounded = Math.round(amount);
        const formatted = rounded.toLocaleString('es-AR', { 
          minimumFractionDigits: 0,
          maximumFractionDigits: 0 
        });
        const symbol = currency === 'USD' ? 'USD ' : '$';
        return `${symbol}${formatted}`;
      };

      // Generar PDF con todos los datos
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Obtener datos del primer reporte (datos de propiedad/contrato son iguales para todos)
      const firstReport = validReports[0];

      // Header
      doc.setFillColor(59, 130, 246); // primary blue
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('WM Property Management', pageWidth / 2, 15, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Informe Mensual de Movimientos', pageWidth / 2, 25, { align: 'center' });
      doc.text(firstReport.period, pageWidth / 2, 33, { align: 'center' });

      // Reset text color
      doc.setTextColor(0, 0, 0);

      // Información de la Propiedad
      let yPos = 50;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Información de la Propiedad', 14, yPos);
      
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Código: ${firstReport.property.code}`, 14, yPos);
      yPos += 5;
      doc.text(`Dirección: ${firstReport.property.address}, ${firstReport.property.city}`, 14, yPos);
      yPos += 5;
      doc.text(`Contrato: ${firstReport.contract.number}`, 14, yPos);
      yPos += 5;
      doc.text(`Inquilino: ${firstReport.contract.tenant}`, 14, yPos);
      yPos += 10;

      // Resumen Financiero por Moneda
      if (firstReport.summary.byCurrency) {
        firstReport.summary.byCurrency.forEach((currencyData: any) => {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.text(`Resumen Financiero en ${currencyData.currency}`, 14, yPos);
          yPos += 7;

          const summaryData = [
            ['Concepto', 'Monto Total'],
            ['Ingresos Totales', formatAmount(currencyData.totalIncome, currencyData.currency)],
            ['Gastos Totales', formatAmount(currencyData.totalExpenses, currencyData.currency)],
            ['Resultado Neto', formatAmount(currencyData.totalIncome - currencyData.totalExpenses, currencyData.currency)],
          ];

          autoTable(doc, {
            startY: yPos,
            head: [summaryData[0]],
            body: summaryData.slice(1),
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246], textColor: 255 },
            margin: { left: 14, right: 14 },
          });

          yPos = (doc as any).lastAutoTable.finalY + 10;
        });
      }

      // Detalle de Ingresos
      if (firstReport.details?.payments && firstReport.details.payments.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Detalle de Ingresos', 14, yPos);
        yPos += 7;

        const paymentsData = [
          ['Fecha', 'Concepto', 'Moneda', 'Monto', 'Referencia'],
          ...firstReport.details.payments.map((p: any) => [
            new Date(p.date).toLocaleDateString('es-AR'),
            p.description,
            p.currency || 'ARS',
            formatAmount(p.amount, p.currency || 'ARS'),
            p.reference || '-',
          ]),
        ];

        autoTable(doc, {
          startY: yPos,
          head: [paymentsData[0]],
          body: paymentsData.slice(1),
          theme: 'striped',
          headStyles: { fillColor: [34, 197, 94], textColor: 255 },
          margin: { left: 14, right: 14 },
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;
      }

      // Detalle de Gastos
      if (firstReport.details?.expenses && firstReport.details.expenses.length > 0) {
        if (yPos > pageHeight - 60) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Detalle de Gastos', 14, yPos);
        yPos += 7;

        const expensesData = [
          ['Fecha', 'Descripción', 'Categoría', 'Moneda', 'Monto', 'Atribuible a'],
          ...firstReport.details.expenses.map((e: any) => [
            new Date(e.date).toLocaleDateString('es-AR'),
            e.description,
            e.category || '-',
            e.currency || 'ARS',
            formatAmount(e.amount, e.currency || 'ARS'),
            e.attributable_to === 'propietario' ? 'Propietario' : 'Inquilino',
          ]),
        ];

        autoTable(doc, {
          startY: yPos,
          head: [expensesData[0]],
          body: expensesData.slice(1),
          theme: 'striped',
          headStyles: { fillColor: [239, 68, 68], textColor: 255 },
          margin: { left: 14, right: 14 },
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;
      }

      // Distribución por Propietario
      if (validReports.length > 1 || validReports[0].summary.sharePercent < 100) {
        if (yPos > pageHeight - 80) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Distribución por Propietario', 14, yPos);
        yPos += 7;

        // Agrupar reportes por moneda para distribución
        const currenciesInReports = new Set<string>();
        validReports.forEach((report: any) => {
          report.summary.byCurrency?.forEach((curr: any) => {
            currenciesInReports.add(curr.currency);
          });
        });

        Array.from(currenciesInReports).forEach(currency => {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.text(`Distribución por Propietario - ${currency}`, 14, yPos);
          yPos += 7;

          const ownersDistribution = [
            ['Propietario', 'Participación', 'Ingresos', 'Gastos', 'Neto'],
            ...validReports.map((report: any) => {
              const currencyData = report.summary.byCurrency?.find((c: any) => c.currency === currency);
              return [
                report.owner,
                `${report.summary.sharePercent}%`,
                formatAmount(currencyData?.income || 0, currency),
                formatAmount(currencyData?.expenses || 0, currency),
                formatAmount(currencyData?.net || 0, currency),
              ];
            }),
          ];

          autoTable(doc, {
            startY: yPos,
            head: [ownersDistribution[0]],
            body: ownersDistribution.slice(1),
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246], textColor: 255 },
            margin: { left: 14, right: 14 },
          });

          yPos = (doc as any).lastAutoTable.finalY + 10;
        });

      }

      // Footer con disclaimer
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFillColor(254, 243, 199);
      doc.rect(14, yPos, pageWidth - 28, 25, 'F');
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Importante:', 16, yPos + 5);
      
      doc.setFont('helvetica', 'normal');
      const disclaimerText = 'Este reporte es informativo. Para consultas sobre movimientos específicos, contacte a su administrador.';
      const splitText = doc.splitTextToSize(disclaimerText, pageWidth - 32);
      doc.text(splitText, 16, yPos + 10);

      // Generar nombre de archivo
      const fileName = `Reporte_${propertyCode}_${firstReport.periodRaw}.pdf`;
      
      // Descargar PDF
      doc.save(fileName);
      
      toast.success("PDF generado y descargado exitosamente");
      console.log("PDF generado:", fileName);

    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast.error(`Error al generar PDF: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onClick={handleDirectDownload}>
      {loading ? (
        <Button variant="outline" size="sm" disabled>
          Generando PDF...
        </Button>
      ) : (
        children
      )}
    </div>
  );
};
