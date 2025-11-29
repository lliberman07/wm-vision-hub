import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { FileText, Shield, User, Users, FileCheck, FolderOpen, Eye, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getContractDocuments,
  getDocumentSignedUrl,
  DOCUMENT_CATEGORIES,
  type DocumentCategory,
  type ContractDocument,
  formatFileSize,
} from '@/utils/contractDocumentUtils';
import { DocumentPreviewModal } from './DocumentPreviewModal';

interface ContractDocumentsViewerProps {
  contractId: string;
}

const categoryIcons = {
  contract_copy: FileText,
  guarantee_copy: Shield,
  tenant_documents: User,
  guarantor_documents: Users,
  insurance_policy: FileCheck,
  other: FolderOpen,
};

export function ContractDocumentsViewer({ contractId }: ContractDocumentsViewerProps) {
  const [documents, setDocuments] = useState<ContractDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState<ContractDocument | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingSignedUrl, setLoadingSignedUrl] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
  }, [contractId]);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const docs = await getContractDocuments(contractId);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los documentos',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDocumentsByCategory = (category: DocumentCategory) => {
    return documents.filter((doc) => doc.category === category);
  };

  const handlePreview = async (doc: ContractDocument) => {
    try {
      setLoadingSignedUrl(true);
      const url = await getDocumentSignedUrl(doc.file_url);
      
      if (!url) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo generar el enlace de previsualización',
        });
        return;
      }
      
      setSignedUrl(url);
      setPreviewDoc(doc);
    } catch (error) {
      console.error('Error generating signed URL:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error al generar el enlace del documento',
      });
    } finally {
      setLoadingSignedUrl(false);
    }
  };

  const handleDownload = async (doc: ContractDocument) => {
    try {
      const url = await getDocumentSignedUrl(doc.file_url);
      if (url) {
        window.open(url, '_blank');
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo generar el enlace de descarga',
        });
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error al descargar el documento',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-3">
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground">No hay documentos cargados para este contrato</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Accordion type="multiple" className="space-y-4">
        {Object.entries(DOCUMENT_CATEGORIES).map(([categoryKey, categoryInfo]) => {
          const category = categoryKey as DocumentCategory;
          const categoryDocs = getDocumentsByCategory(category);
          const IconComponent = categoryIcons[category];

          if (categoryDocs.length === 0) return null;

          return (
            <AccordionItem key={category} value={category} className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-3 w-full">
                  <IconComponent className="h-5 w-5 text-primary" />
                  <div className="flex-1 text-left">
                    <div className="font-semibold">{categoryInfo.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {categoryDocs.length} {categoryDocs.length === 1 ? 'documento' : 'documentos'}
                    </div>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent>
                <div className="px-4 pb-4 space-y-2">
                  {categoryDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(doc.file_size)} • {new Date(doc.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(doc)}
                          disabled={loadingSignedUrl}
                        >
                          {loadingSignedUrl ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {previewDoc && signedUrl && (
        <DocumentPreviewModal
          open={!!previewDoc}
          onOpenChange={(open) => {
            if (!open) {
              setPreviewDoc(null);
              setSignedUrl(null);
            }
          }}
          fileUrl={signedUrl}
          fileName={previewDoc.file_name}
          mimeType={previewDoc.mime_type}
        />
      )}
    </>
  );
}
