import { supabase } from '@/integrations/supabase/client';

export type DocumentCategory = 
  | 'contract_copy'
  | 'guarantee_copy'
  | 'tenant_documents'
  | 'guarantor_documents'
  | 'insurance_policy'
  | 'other';

export interface ContractDocument {
  id: string;
  file_url: string;
  file_name: string;
  category: DocumentCategory;
  mime_type: string;
  file_size: number;
  uploaded_at: string;
}

export const DOCUMENT_CATEGORIES = {
  contract_copy: { label: 'Copia del Contrato', maxFiles: 1, icon: 'FileText' },
  guarantee_copy: { label: 'Copia de Garantía', maxFiles: 3, icon: 'Shield' },
  tenant_documents: { label: 'Documentos del Inquilino', maxFiles: 5, icon: 'User' },
  guarantor_documents: { label: 'Documentos de Garantes', maxFiles: 5, icon: 'Users' },
  insurance_policy: { label: 'Póliza de Seguro', maxFiles: 2, icon: 'FileCheck' },
  other: { label: 'Otros Documentos', maxFiles: 10, icon: 'FolderOpen' },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export const uploadContractDocument = async (
  file: File,
  contractId: string,
  category: DocumentCategory,
  tenantId: string
): Promise<string | null> => {
  try {
    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`El archivo no debe superar ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Validar tipo
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Tipo de archivo no permitido. Use PDF, JPG, PNG, WEBP o DOC/DOCX');
    }

    const timestamp = Date.now();
    const sanitizedName = file.name
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');
    
    const fileName = `${contractId}/${category}_${timestamp}_${sanitizedName}`;

    const { data, error } = await supabase.storage
      .from('contract-documents')
      .upload(fileName, file);

    if (error) throw error;

    // Guardar metadata en pms_documents
    const { data: { publicUrl } } = supabase.storage
      .from('contract-documents')
      .getPublicUrl(fileName);

    const { data: docData, error: docError } = await supabase
      .from('pms_documents')
      .insert({
        tenant_id: tenantId,
        entity_type: 'contract',
        entity_id: contractId,
        document_type: category,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single();

    if (docError) throw docError;

    return publicUrl;
  } catch (error) {
    console.error('Error uploading contract document:', error);
    throw error;
  }
};

export const deleteContractDocument = async (
  documentId: string,
  fileUrl: string
): Promise<boolean> => {
  try {
    // Extraer path del URL
    const path = fileUrl.split('/contract-documents/').pop();
    if (!path) return false;

    // Eliminar de storage
    const { error: storageError } = await supabase.storage
      .from('contract-documents')
      .remove([path]);

    if (storageError) throw storageError;

    // Eliminar registro de pms_documents
    const { error: dbError } = await supabase
      .from('pms_documents')
      .delete()
      .eq('id', documentId);

    if (dbError) throw dbError;

    return true;
  } catch (error) {
    console.error('Error deleting contract document:', error);
    return false;
  }
};

export const getContractDocuments = async (
  contractId: string,
  category?: DocumentCategory
): Promise<ContractDocument[]> => {
  try {
    let query = supabase
      .from('pms_documents')
      .select('*')
      .eq('entity_type', 'contract')
      .eq('entity_id', contractId)
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('document_type', category);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(doc => ({
      id: doc.id,
      file_url: doc.file_url,
      file_name: doc.file_name,
      category: doc.document_type as DocumentCategory,
      mime_type: doc.mime_type || 'application/octet-stream',
      file_size: doc.file_size || 0,
      uploaded_at: doc.created_at,
    }));
  } catch (error) {
    console.error('Error fetching contract documents:', error);
    return [];
  }
};

export const getCategoryDocumentCount = async (
  contractId: string,
  category: DocumentCategory
): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('pms_documents')
      .select('*', { count: 'exact', head: true })
      .eq('entity_type', 'contract')
      .eq('entity_id', contractId)
      .eq('document_type', category);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error counting documents:', error);
    return 0;
  }
};

export const isImageFile = (mimeType: string): boolean => {
  return mimeType.startsWith('image/');
};

export const isPdfFile = (mimeType: string): boolean => {
  return mimeType === 'application/pdf';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
