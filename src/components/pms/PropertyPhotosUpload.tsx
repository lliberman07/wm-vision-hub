import { useState } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadPropertyPhoto, deletePropertyPhoto } from '@/utils/propertyPhotoUtils';
import { useToast } from '@/hooks/use-toast';

interface PropertyPhotosUploadProps {
  photos: string[];
  onPhotosChange: (urls: string[]) => void;
  propertyId?: string;
  disabled?: boolean;
}

export const PropertyPhotosUpload = ({ 
  photos, 
  onPhotosChange, 
  propertyId, 
  disabled 
}: PropertyPhotosUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const maxPhotos = 3;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxPhotos - photos.length;
    if (remainingSlots <= 0) {
      toast({
        title: "Límite alcanzado",
        description: "Máximo 3 fotos por propiedad",
        variant: "destructive"
      });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setUploading(true);

    try {
      const uploadPromises = filesToUpload.map(file => 
        uploadPropertyPhoto(file, propertyId || 'temp')
      );
      
      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter((url): url is string => url !== null);
      
      if (validUrls.length > 0) {
        onPhotosChange([...photos, ...validUrls]);
        toast({
          title: "Fotos subidas",
          description: `${validUrls.length} foto(s) subida(s) correctamente`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al subir las fotos",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeletePhoto = async (urlToDelete: string) => {
    const success = await deletePropertyPhoto(urlToDelete);
    if (success) {
      onPhotosChange(photos.filter(url => url !== urlToDelete));
      toast({
        title: "Foto eliminada",
        description: "La foto se eliminó correctamente"
      });
    } else {
      toast({
        title: "Error",
        description: "No se pudo eliminar la foto",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={disabled || uploading || photos.length >= maxPhotos}
          onClick={() => document.getElementById('photo-upload')?.click()}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Seleccionar archivos
            </>
          )}
        </Button>
        <span className="text-sm text-muted-foreground">
          {photos.length}/{maxPhotos} fotos
        </span>
      </div>

      <input
        id="photo-upload"
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled || uploading || photos.length >= maxPhotos}
      />

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {photos.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Foto ${index + 1}`}
                className="w-full aspect-square object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDeletePhoto(url)}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
