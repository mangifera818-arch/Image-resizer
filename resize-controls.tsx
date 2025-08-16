
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Lock, Unlock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';

interface ResizeControlsProps {
  imageFile: File;
  imagePreview: string;
  originalDimensions: { width: number; height: number; };
  onClearImage: () => void;
}

const formSchema = z.object({
  mode: z.enum(['resize', 'compress']).default('resize'),
  resizeMode: z.enum(['pixels', 'percentage']).default('pixels'),
  width: z.number().min(1).optional(),
  height: z.number().min(1).optional(),
  percentage: z.number().min(1).max(500).default(100),
  maintainAspectRatio: z.boolean().default(true),
  format: z.enum(['jpeg', 'png', 'webp']).default('jpeg'),
  targetSize: z.number().min(1).optional(),
  targetUnit: z.enum(['KB', 'MB']).default('KB'),
});

type FormData = z.infer<typeof formSchema>;

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function ResizeControls({ imageFile, imagePreview, originalDimensions }: ResizeControlsProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const getFormatFromType = (type: string) => {
    if (type === 'image/png') return 'png';
    if (type === 'image/webp') return 'webp';
    return 'jpeg';
  }

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mode: 'resize',
      resizeMode: 'pixels',
      width: originalDimensions.width,
      height: originalDimensions.height,
      percentage: 100,
      maintainAspectRatio: true,
      format: getFormatFromType(imageFile.type),
      targetSize: Math.round(imageFile.size / 1024),
      targetUnit: 'KB',
    },
  });

  const { watch, setValue, control, handleSubmit } = form;
  const { width, height, percentage, maintainAspectRatio, resizeMode, mode, format } = watch();
  const aspectRatio = useMemo(() => originalDimensions.width / originalDimensions.height, [originalDimensions]);

  useEffect(() => {
    if (originalDimensions) {
      if(!isNaN(originalDimensions.width)) setValue('width', originalDimensions.width);
      if(!isNaN(originalDimensions.height)) setValue('height', originalDimensions.height);
    }
  }, [originalDimensions, setValue]);

  useEffect(() => {
    if (mode !== 'resize' || !maintainAspectRatio) return;
    const currentWidth = form.getValues('width');
    const currentHeight = form.getValues('height');

    if (resizeMode === 'pixels') {
        const changedField = form.formState.dirtyFields.width ? 'width' : form.formState.dirtyFields.height ? 'height' : null;
        if (changedField === 'width' && width && !isNaN(width)) {
            const newHeight = Math.round(width / aspectRatio);
            if (newHeight !== currentHeight && !isNaN(newHeight)) setValue('height', newHeight, { shouldValidate: true });
        } else if (changedField === 'height' && height && !isNaN(height)) {
            const newWidth = Math.round(height * aspectRatio);
            if (newWidth !== currentWidth && !isNaN(newWidth)) setValue('width', newWidth, { shouldValidate: true });
        }
    }
  }, [width, height, aspectRatio, maintainAspectRatio, setValue, resizeMode, mode, form]);

  useEffect(() => {
    if (mode !== 'resize') return;
    if (resizeMode === 'percentage' && percentage && !isNaN(percentage)) {
      const newWidth = Math.round(originalDimensions.width * (percentage / 100));
      const newHeight = Math.round(originalDimensions.height * (percentage / 100));
      if(!isNaN(newWidth)) setValue('width', newWidth);
      if(!isNaN(newHeight)) setValue('height', newHeight);
    } else if (width && !isNaN(width)) {
        const newPercentage = Math.round((width / originalDimensions.width) * 100);
        if (!isNaN(newPercentage)) setValue('percentage', newPercentage);
    }
  }, [percentage, resizeMode, originalDimensions, setValue, width, mode]);


  const downloadDataUrl = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const getTargetSizeInBytes = (targetSize: number, targetUnit: 'KB' | 'MB') => {
    if (targetUnit === 'KB') {
      return targetSize * 1024;
    }
    return targetSize * 1024 * 1024;
  }
  
  const getFileBlobFromDataUrl = async (dataUrl: string): Promise<Blob> => {
      const fetchResponse = await fetch(dataUrl);
      return await fetchResponse.blob();
  }

  const onSubmit = async (data: FormData) => {
    setIsProcessing(true);

    const image = new Image();
    image.src = imagePreview;

    image.onload = async () => {
        const canvas = document.createElement('canvas');
        const newWidth = data.mode === 'resize' && data.width && !isNaN(data.width) ? data.width : originalDimensions.width;
        const newHeight = data.mode === 'resize' && data.height && !isNaN(data.height) ? data.height : originalDimensions.height;
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not process image.' });
            setIsProcessing(false);
            return;
        }

        ctx.drawImage(image, 0, 0, newWidth, newHeight);
        
        const mimeType = `image/${data.format}`;
        const fileExtension = data.format === 'jpeg' ? 'jpg' : data.format;
        const originalFilename = imageFile.name.substring(0, imageFile.name.lastIndexOf('.'));
        const suffix = data.mode === 'resize' ? 'resized' : 'compressed';
        const finalFilename = `${originalFilename}-${suffix}.${fileExtension}`;

        if (data.mode === 'resize' || data.format === 'png') {
            const quality = data.format === 'png' ? 1.0 : 0.9; // Default quality for resize or lossless for PNG
            const dataUrl = canvas.toDataURL(mimeType, quality);
            downloadDataUrl(dataUrl, finalFilename);
            toast({
                title: `Image ${suffix}!`,
                description: "Your image has been successfully downloaded.",
            });
        } else { // Compress mode with target size
            if (!data.targetSize) {
                toast({ variant: 'destructive', title: 'Error', description: 'Please specify a target size.' });
                setIsProcessing(false);
                return;
            }

            const targetBytes = getTargetSizeInBytes(data.targetSize, data.targetUnit);

            let minQuality = 0;
            let maxQuality = 1;
            let bestDataUrl = '';
            
            // Iterative compression using binary search - reduced iterations for speed
            for (let i = 0; i < 7; i++) { // 7 iterations for precision/speed balance
                const quality = (minQuality + maxQuality) / 2;
                const dataUrl = canvas.toDataURL(mimeType, quality);
                const blob = await getFileBlobFromDataUrl(dataUrl);

                if (blob.size > targetBytes) {
                    maxQuality = quality;
                } else {
                    minQuality = quality;
                    bestDataUrl = dataUrl;
                }
            }

            if (bestDataUrl) {
                downloadDataUrl(bestDataUrl, finalFilename);
                const finalBlob = await getFileBlobFromDataUrl(bestDataUrl);
                const originalSize = imageFile.size;
                const newSize = finalBlob.size;
                const sizeReduction = originalSize - newSize;
                const sizeReductionPercent = ((sizeReduction / originalSize) * 100).toFixed(2);

                toast({
                    title: "Image compressed successfully!",
                    description: `Saved ${formatBytes(sizeReduction)} (${sizeReductionPercent}%). New size: ${formatBytes(newSize)}`,
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Compression Failed",
                    description: `Could not compress to the target size. Try a larger size. The smallest possible is ${formatBytes( (await getFileBlobFromDataUrl(canvas.toDataURL(mimeType, 0))).size )}.`
                });
            }
        }
        setIsProcessing(false);
    };

    image.onerror = () => {
        setIsProcessing(false);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load image for processing.' });
    }
  };


  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Image Controls</CardTitle>
        <CardDescription>Resize or compress your image.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="resize" onValueChange={(value) => setValue('mode', value as 'resize' | 'compress')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="resize">Resize</TabsTrigger>
              <TabsTrigger value="compress">Compress</TabsTrigger>
            </TabsList>
            <TabsContent value="resize">
              <Tabs defaultValue="pixels" onValueChange={(value) => setValue('resizeMode', value as 'pixels' | 'percentage')}>
                <TabsList className="grid w-full grid-cols-2 mt-4">
                  <TabsTrigger value="pixels">Pixels</TabsTrigger>
                  <TabsTrigger value="percentage">Percentage</TabsTrigger>
                </TabsList>
                <TabsContent value="pixels" className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <Controller name="width" control={control} render={({ field }) => (
                        <div className="space-y-2">
                          <Label htmlFor="width">Width</Label>
                          <Input id="width" type="number" value={field.value || ""} onChange={e => field.onChange(parseInt(e.target.value, 10))}/>
                        </div>
                    )} />
                     <Controller name="height" control={control} render={({ field }) => (
                        <div className="space-y-2">
                          <Label htmlFor="height">Height</Label>
                          <Input id="height" type="number" value={field.value || ""} onChange={e => field.onChange(parseInt(e.target.value, 10))}/>
                        </div>
                    )} />
                  </div>
                </TabsContent>
                <TabsContent value="percentage" className="pt-4 space-y-2">
                    <Label htmlFor="percentage">Scale (%)</Label>
                     <Controller name="percentage" control={control} render={({ field }) => (
                        <Input id="percentage" type="number" value={field.value || ""} onChange={e => field.onChange(parseInt(e.target.value, 10))}/>
                    )} />
                </TabsContent>
              </Tabs>
              <div className="flex items-center space-x-2 pt-4">
                <Controller name="maintainAspectRatio" control={control} render={({ field }) => (
                    <>
                        <Switch id="aspect-ratio" checked={field.value} onCheckedChange={field.onChange} />
                        <Label htmlFor="aspect-ratio" className="flex items-center gap-2 cursor-pointer">
                            {field.value ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                            Lock aspect ratio
                        </Label>
                    </>
                )} />
              </div>
            </TabsContent>
            <TabsContent value="compress">
              <div className="pt-4 space-y-4">
                <Label>Target File Size</Label>
                <div className="flex gap-2">
                    <Controller name="targetSize" control={control} render={({ field }) => (
                        <Input id="targetSize" type="number" placeholder="e.g. 500" value={field.value || ""} onChange={e => field.onChange(parseInt(e.target.value, 10))}/>
                    )} />
                    <Controller name="targetUnit" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger className="w-[100px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="KB">KB</SelectItem>
                                <SelectItem value="MB">MB</SelectItem>
                            </SelectContent>
                        </Select>
                    )} />
                </div>
                {format === 'png' && (
                    <p className="text-xs text-muted-foreground">PNG compression is lossless. For size reduction, please choose JPEG or WebP format.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="format">Output Format</Label>
              <Controller name="format" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jpeg">JPEG</SelectItem>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="webp">WebP</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
          </div>
          
          <Separator />
          
          <Button type="submit" className="w-full" size="lg" disabled={isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            {mode === 'resize' ? 'Resize &amp; Download' : 'Compress &amp; Download'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

    