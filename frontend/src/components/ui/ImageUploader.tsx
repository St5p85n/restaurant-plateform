import { useRef, useState } from 'react';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const MAX_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];

interface ImageUploaderProps {
  bucket: string;
  folder?: string;
  currentUrl?: string;
  onUploadComplete: (url: string) => void;
  label?: string;
  aspectClass?: string; // ex: "aspect-square" | "aspect-video"
}

async function compressImage(file: File): Promise<{ blob: Blob; compressed: boolean; sizeKB: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Redimensionner à 1080p max
      const maxDim = 1080;
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      let quality = 0.8;
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({ blob: file, compressed: false, sizeKB: Math.round(file.size / 1024) });
              return;
            }
            if (blob.size <= MAX_SIZE_BYTES || quality <= 0.3) {
              resolve({ blob, compressed: true, sizeKB: Math.round(blob.size / 1024) });
            } else {
              quality = Math.max(quality - 0.1, 0.3);
              tryCompress();
            }
          },
          'image/webp',
          quality
        );
      };
      tryCompress();
    };
    img.src = objectUrl;
  });
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9.]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

export default function ImageUploader({
  bucket,
  folder = 'uploads',
  currentUrl,
  onUploadComplete,
  label = 'Image',
  aspectClass = 'aspect-video',
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);

  const handleFile = async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Format non supporté. Utilisez JPEG, PNG, GIF, WEBP ou AVIF.');
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      let uploadBlob: Blob = file;
      let wasCompressed = false;
      let finalSizeKB = Math.round(file.size / 1024);

      // Compression si > 1 MB
      if (file.size > MAX_SIZE_BYTES) {
        setProgress(30);
        const result = await compressImage(file);
        uploadBlob = result.blob;
        wasCompressed = result.compressed;
        finalSizeKB = result.sizeKB;
      }

      setProgress(50);

      const ext = wasCompressed ? 'webp' : file.name.split('.').pop() ?? 'jpg';
      const baseName = sanitizeFilename(file.name.replace(/\.[^/.]+$/, ''));
      const uniqueName = `${folder}/${baseName}_${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from(bucket)
        .upload(uniqueName, uploadBlob, {
          contentType: wasCompressed ? 'image/webp' : file.type,
          upsert: true,
        });

      setProgress(90);

      if (error) throw error;

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(uniqueName);
      const publicUrl = urlData.publicUrl;

      setPreview(publicUrl);
      onUploadComplete(publicUrl);
      setProgress(100);

      if (wasCompressed) {
        toast.success(`Image compressée et uploadée (${finalSizeKB} Ko)`);
      } else {
        toast.success('Image uploadée avec succès');
      }
    } catch (err: any) {
      toast.error(`Erreur d'upload : ${err.message}`);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onUploadComplete('');
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        className="hidden"
        onChange={handleChange}
      />

      {/* Zone de prévisualisation / drop */}
      <div
        className={`relative w-full ${aspectClass} rounded-md border border-dashed border-border bg-muted/20 overflow-hidden group cursor-pointer`}
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {preview ? (
          <>
            <img src={preview} alt={label} className="w-full h-full object-cover" />
            {/* Overlay au survol */}
            <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                disabled={uploading}
              >
                <Upload className="w-3 h-3 mr-1" /> Changer
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="border border-border"
                onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                disabled={uploading}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Upload className="w-6 h-6" />
                <p className="text-xs text-center px-4">
                  Cliquez ou glissez une image<br />
                  <span className="text-[11px] opacity-70">JPEG, PNG, WEBP — max 1 Mo (compression auto)</span>
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Barre de progression */}
      {progress > 0 && progress < 100 && (
        <Progress value={progress} className="h-1" />
      )}
    </div>
  );
}
