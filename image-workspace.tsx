"use client";

import { useState } from 'react';
import { ImageUploader } from './image-uploader';
import { ResizeControls } from './resize-controls';
import Image from 'next/image';
import { Button } from './ui/button';
import { X, Image as ImageIcon, Info, Loader2 } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { format } from 'date-fns';

export function ImageWorkspace() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);

  const handleImageUpload = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImagePreview(result);
      const img = document.createElement('img');
      img.onload = () => {
        setOriginalDimensions({ width: img.width, height: img.height });
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setOriginalDimensions(null);
  };

  if (!imageFile || !imagePreview) {
    return <ImageUploader onImageUpload={handleImageUpload} />;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 xl:col-span-8">
          <Card>
            <CardContent className="relative p-4">
              <Button onClick={handleClearImage} variant="ghost" size="icon" className="absolute top-3 right-3 z-10 bg-background/50 hover:bg-background rounded-full">
                <X className="h-5 w-5" />
                <span className="sr-only">Clear Image</span>
              </Button>
              <div className="relative aspect-video w-full bg-muted rounded-md overflow-hidden flex items-center justify-center border">
                <Image src={imagePreview} alt="Image Preview" layout="fill" objectFit="contain" />
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">{imageFile.name}</p>
                    <p className="text-muted-foreground">{(imageFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-muted-foreground" />
                   <div>
                    <p className="font-semibold">{originalDimensions?.width} x {originalDimensions?.height}</p>
                    <p className="text-muted-foreground">Original Dimensions</p>
                  </div>
                </div>
                 <div className="flex items-center gap-2">
                    <p className="text-muted-foreground">{imageFile.type}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-5 xl:col-span-4">
          {originalDimensions ? (
            <ResizeControls 
              imageFile={imageFile} 
              imagePreview={imagePreview} 
              originalDimensions={originalDimensions} 
              onClearImage={handleClearImage}
            />
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading controls...</span>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
