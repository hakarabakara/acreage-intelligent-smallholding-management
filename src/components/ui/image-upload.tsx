import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
interface ImageUploadProps {
  onUpload: (url: string) => void;
  className?: string;
  label?: string;
}
export function ImageUpload({ onUpload, className, label = "Upload Photo" }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const compressImage = (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          // Compress to JPEG with 0.6 quality
          const mimeType = 'image/jpeg';
          const base64 = canvas.toDataURL(mimeType, 0.6);
          resolve({ base64, mimeType });
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Basic validation
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    setIsUploading(true);
    try {
      const { base64, mimeType } = await compressImage(file);
      const response = await api<{ url: string }>('/api/upload', {
        method: 'POST',
        body: JSON.stringify({ image: base64, mimeType })
      });
      onUpload(response.url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
      <Button 
        type="button" 
        variant="outline" 
        size="sm" 
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="gap-2"
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {isUploading ? 'Uploading...' : label}
      </Button>
    </div>
  );
}