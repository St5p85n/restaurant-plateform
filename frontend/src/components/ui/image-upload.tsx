import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onImageUploaded: (url: string) => void;
  onImageRemoved: () => void;
  restaurantId: string;
}

const MAX_UPLOAD_BYTES = 1 * 1024 * 1024; // 1 Mo
const MAX_INPUT_BYTES = 10 * 1024 * 1024; // 10 Mo max acceptable en entrée
const ACCEPTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

async function compressToWebp(file: File): Promise<{ blob: Blob; sizeKB: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      const maxDim = 1080;
      if (width > maxDim || height > maxDim) {
        if (width >= height) { height = Math.round((height * maxDim) / width); width = maxDim; }
        else { width = Math.round((width * maxDim) / height); height = maxDim; }
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      let quality = 0.8;
      const tryCompress = () => {
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error('Compression échouée')); return; }
          if (blob.size <= MAX_UPLOAD_BYTES || quality <= 0.3) {
            resolve({ blob, sizeKB: Math.round(blob.size / 1024) });
          } else {
            quality = Math.max(quality - 0.1, 0.3);
            tryCompress();
          }
        }, 'image/webp', quality);
      };
      tryCompress();
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Lecture image échouée')); };
    img.src = objectUrl;
  });
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, '_').replace(/_{2,}/g, '_').toLowerCase();
}

export function ImageUpload({
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
  restaurantId,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      toast.error('Format non supporté. Utilisez JPEG, PNG, WEBP ou AVIF.');
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      toast.error('Fichier trop volumineux (max 10 Mo).');
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      // Prévisualisation immédiate
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);

      let uploadBlob: Blob = file;
      let wasCompressed = false;
      let finalSizeKB = Math.round(file.size / 1024);

      // Compression si > 1 Mo
      if (file.size > MAX_UPLOAD_BYTES) {
        setProgress(30);
        const result = await compressToWebp(file);
        uploadBlob = result.blob;
        wasCompressed = true;
        finalSizeKB = result.sizeKB;
      }

      setProgress(55);

      const baseName = sanitize(file.name.replace(/\.[^/.]+$/, ''));
      const ext = wasCompressed ? 'webp' : (file.name.split('.').pop() ?? 'jpg');
      const filePath = `${restaurantId}/${baseName}_${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from('menu-images')
        .upload(filePath, uploadBlob, {
          contentType: wasCompressed ? 'image/webp' : file.type,
          upsert: true,
        });

      if (error) throw error;

      setProgress(90);

      const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(filePath);
      onImageUploaded(urlData.publicUrl);
      setProgress(100);

      if (wasCompressed) {
        toast.success(`Image compressée et uploadée (${finalSizeKB} Ko)`);
      } else {
        toast.success('Image uploadée avec succès');
      }
    } catch (err: any) {
      toast.error(`Erreur lors de l'upload : ${err.message}`);
      setPreview(currentImageUrl || null);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    e.target.value = '';
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onImageRemoved();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FORMATS.join(',')}
        onChange={handleChange}
        className="hidden"
        disabled={uploading}
      />

      {preview ? (
        <div className="relative rounded-md overflow-hidden border border-border group">
          <img src={preview} alt="Prévisualisation" className="w-full h-48 object-cover" />
          <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button" size="sm" variant="secondary"
              onClick={() => fileInputRef.current?.click()} disabled={uploading}
            >
              <Upload className="w-3 h-3 mr-1" /> Changer
            </Button>
            <Button
              type="button" size="sm" variant="ghost"
              className="border border-border"
              onClick={handleRemove} disabled={uploading}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
            dragActive ? 'border-foreground bg-muted/30' : 'border-border hover:border-foreground/40'
          }`}
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-3">
            {uploading ? (
              <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
            ) : (
              <ImageIcon className="w-7 h-7 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">
                {uploading ? 'Upload en cours...' : 'Glissez une image ou cliquez'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                JPEG, PNG, WEBP — compression auto si &gt; 1 Mo
              </p>
            </div>
          </div>
        </div>
      )}

      {progress > 0 && progress < 100 && (
        <Progress value={progress} className="h-1" />
      )}
    </div>
  );
}
