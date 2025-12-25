import { useState, useCallback } from 'react';
import { Upload, X, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
}

export function FileUpload({ files, onFilesChange, maxFiles = 5 }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/')
      );

      const newFiles = [...files, ...droppedFiles].slice(0, maxFiles);
      onFilesChange(newFiles);
    },
    [files, maxFiles, onFilesChange]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []).filter((file) =>
        file.type.startsWith('image/')
      );

      const newFiles = [...files, ...selectedFiles].slice(0, maxFiles);
      onFilesChange(newFiles);
    },
    [files, maxFiles, onFilesChange]
  );

  const removeFile = useCallback(
    (index: number) => {
      const newFiles = files.filter((_, i) => i !== index);
      onFilesChange(newFiles);
    },
    [files, onFilesChange]
  );

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative rounded-xl border-2 border-dashed transition-all duration-200 p-8',
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-accent/50',
          files.length >= maxFiles && 'opacity-50 pointer-events-none'
        )}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={files.length >= maxFiles}
        />
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className={cn(
              'w-14 h-14 rounded-xl flex items-center justify-center transition-colors',
              isDragOver ? 'bg-primary/10' : 'bg-muted'
            )}
          >
            <Upload
              className={cn(
                'w-7 h-7 transition-colors',
                isDragOver ? 'text-primary' : 'text-muted-foreground'
              )}
            />
          </div>
          <div>
            <p className="font-medium text-foreground">
              {isDragOver ? 'Drop files here' : 'Drag & drop screenshots'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse • Max {maxFiles} images
            </p>
          </div>
        </div>
      </div>

      {/* Preview Grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {files.map((file, index) => (
            <div
              key={index}
              className="relative group rounded-xl overflow-hidden border border-border bg-card aspect-square animate-scale-in"
            >
              <img
                src={URL.createObjectURL(file)}
                alt={`Screenshot ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeFile(index)}
              >
                <X className="w-4 h-4" />
              </Button>
              <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs text-foreground truncate">{file.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
