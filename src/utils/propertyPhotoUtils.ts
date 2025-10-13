import { supabase } from '@/integrations/supabase/client';

export const uploadPropertyPhoto = async (
  file: File, 
  propertyId: string
): Promise<string | null> => {
  try {
    const timestamp = Date.now();
    const fileName = `${propertyId}_${timestamp}_${file.name}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
      .from('property-photos')
      .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('property-photos')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading photo:', error);
    return null;
  }
};

export const deletePropertyPhoto = async (photoUrl: string): Promise<boolean> => {
  try {
    const path = photoUrl.split('/property-photos/').pop();
    if (!path) return false;

    const { error } = await supabase.storage
      .from('property-photos')
      .remove([path]);

    return !error;
  } catch (error) {
    console.error('Error deleting photo:', error);
    return false;
  }
};
