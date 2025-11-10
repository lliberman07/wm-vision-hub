import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { Upload, FileText, Trash2, Eye, FileCheck, Shield, User, Users, FolderOpen, Loader2 } from 'lucide-react';
import {
  uploadContractDocument,
  deleteContractDocument,
  getContractDocuments,
  getCategoryDocumentCount,
  DOCUMENT_CATEGORIES,
  formatFileSize,
  type DocumentCategory,
  type ContractDocument,
} from '@/utils/contractDocumentUtils';
import { DocumentPreviewModal } from './DocumentPreviewModal';

interface ContractDocumentsUploadProps {
  contractId: string | null;
  tenantId: string | null;
  disabled?: boolean;
  onDocumentsChange?: () => void;
}

const CATEGORY_ICONS = {
  FileText,
  FileCheck,
  Shield,
  User,
  Users,
  FolderOpen,
};

export function ContractDocumentsUpload({
  contractId,
  tenantId,
  disabled = false,
  onDocumentsChange,
}: ContractDocumentsUploadProps) {
  const [documents, setDocuments] = useState<Record<DocumentCategory, ContractDocument[]>>({
    contract_copy: [],
    guarantee_copy: [],
    tenant_documents: [],
    guarantor_documents: [],
    insurance_policy: [],
    other: [],
  });
  const [uploading, setUploading] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<ContractDocument | null>(null);

  useEffect(() => {
    if (contractId) {
      loadDocuments();
    }
  }, [contractId]);

  const loadDocuments = async () => {
    if (!contractId) return;

    const allDocs = await getContractDocuments(contractId);
    const categorized: Record<DocumentCategory, ContractDocument[]> = {
      contract_copy: [],
      guarantee_copy: [],
      tenant_documents: [],
      guarantor_documents: [],
      insurance_policy: [],
      other: [],
    };

    allDocs.forEach(doc => {
      if (categorized[doc.category]) {
        categorized[doc.category].push(doc);
      }
    });

    setDocuments(categorized);
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
    category: DocumentCategory
  ) => {
    if (!contractId || !tenantId) {
      toast.error('Debe guardar el contrato primero antes de subir documentos');
      return;
    }

    const files = event.target.files;
    if (!files || files.length === 0) return;

    const currentCount = documents[category].length;
    const maxFiles = DOCUMENT_CATEGORIES[category].maxFiles;
    const remainingSlots = maxFiles - currentCount;

    if (remainingSlots <= 0) {
      toast.error(`Ya alcanzó el límite de ${maxFiles} archivos para esta categoría`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    setUploading(category);

    try {
      for (const file of filesToUpload) {
        await uploadContractDocument(file, contractId, category, tenantId);
      }

      toast.success(`${filesToUpload.length} archivo(s) subido(s) exitosamente`);
      await loadDocuments();
      onDocumentsChange?.();
    } catch (error: any) {
      toast.error(error.message || 'Error al subir archivos');
    } finally {
      setUploading(null);
      event.target.value = '';
    }
  };

  const handleDeleteDocument = async (doc: ContractDocument) => {
    try {
      const success = await deleteContractDocument(doc.id, doc.file_url);
      if (success) {
        toast.success('Documento eliminado');
        await loadDocuments();
        onDocumentsChange?.();
      } else {
        toast.error('Error al eliminar documento');
      }
    } catch (error) {
      toast.error('Error al eliminar documento');
    }
  };

  const renderCategorySection = (category: DocumentCategory) => {
    const categoryInfo = DOCUMENT_CATEGORIES[category];
    const categoryDocs = documents[category];
    const IconComponent = CATEGORY_ICONS[categoryInfo.icon as keyof typeof CATEGORY_ICONS] || FileText;
    const currentCount = categoryDocs.length;
    const maxFiles = categoryInfo.maxFiles;
    const canUploadMore = currentCount < maxFiles && !disabled;

    return (
      <AccordionItem key={category} value={category}>
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3 flex-1">
            <IconComponent className="h-5 w-5 text-primary" />
            <span className="font-medium">{categoryInfo.label}</span>
            <Badge variant={currentCount > 0 ? 'default' : 'secondary'}>
              {currentCount}/{maxFiles}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3 pt-2">
            {/* Lista de documentos */}
            {categoryDocs.length > 0 && (
              <div className="space-y-2">
                {categoryDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-2 p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(doc.file_size)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewDoc(doc)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {!disabled && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDocument(doc)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Botón de subida */}
            {canUploadMore && (
              <div className="flex items-center gap-2">
                <Input
                  id={`file-${category}`}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                  multiple
                  onChange={(e) => handleFileSelect(e, category)}
                  disabled={uploading === category}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById(`file-${category}`)?.click()}
                  disabled={uploading === category}
                  className="w-full"
                >
                  {uploading === category ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Subir archivos ({maxFiles - currentCount} disponibles)
                    </>
                  )}
                </Button>
              </div>
            )}

            {categoryDocs.length === 0 && (
              <p className="text-sm text-muted-foreground italic">
                No hay documentos en esta categoría
              </p>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  };

  if (!contractId) {
    return (
      <div className="p-6 border rounded-lg bg-muted/20">
        <p className="text-sm text-muted-foreground text-center">
          Guarde el contrato primero para poder subir documentos
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Documentos del Contrato</h3>
          <p className="text-sm text-muted-foreground">
            Organice los documentos relacionados al contrato (opcional)
          </p>
        </div>
      </div>

      <Accordion type="multiple" className="w-full">
        {(Object.keys(DOCUMENT_CATEGORIES) as DocumentCategory[]).map(renderCategorySection)}
      </Accordion>

      {previewDoc && (
        <DocumentPreviewModal
          open={!!previewDoc}
          onOpenChange={(open) => !open && setPreviewDoc(null)}
          fileUrl={previewDoc.file_url}
          fileName={previewDoc.file_name}
          mimeType={previewDoc.mime_type}
        />
      )}

      <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
        <p>• Formatos permitidos: PDF, JPG, PNG, WEBP, DOC, DOCX</p>
        <p>• Tamaño máximo por archivo: 10MB</p>
        <p>• Los documentos son opcionales y pueden agregarse en cualquier momento</p>
      </div>
    </div>
  );
}
