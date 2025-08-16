"use client";

import { useState, useCallback, ChangeEvent, DragEvent } from 'react';
import { UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
}

const supportedFormats = ['image/png', 'image/jpeg', 'image/webp'];

export function ImageUploader({ onImageUpload }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleFile = useCallback((file: File) => {
    if (file && supportedFormats.includes(file.type)) {
      onImageUpload(file);
    } else {
      toast({
        variant: "destructive",
        title: "Unsupported File Type",
        description: "Please upload a PNG, JPG, or WebP image.",
      });
    }
  }, [onImageUpload, toast]);

  const handleDragEnter = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 flex items-center justify-center" style={{minHeight: 'calc(100vh - 8rem)'}}>
      <div className="w-full max-w-2xl">
        <input
          id="file-upload"
          type="file"
          className="hidden"
          accept={supportedFormats.join(',')}
          onChange={handleFileChange}
        />
        <label
          htmlFor="file-upload"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center w-full h-80 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-accent/50 transition-colors",
            isDragging ? "border-primary" : "border-border"
          )}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
            <UploadCloud className="w-12 h-12 mb-4 text-muted-foreground" />
            <p className="mb-2 text-lg font-semibold">
              <span className="text-primary">Click to upload</span> or drag and drop
            </p>
            <p className="text-sm text-muted-foreground">PNG, JPG, or WebP</p>
          </div>
        </label>
        <div className="text-center mt-6">
            <Button size="lg" onClick={() => document.getElementById('file-upload')?.click()}>
                Select Image
            </Button>
        </div>
      </div>
    </div>
  );
}
