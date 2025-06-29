'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Progress } from './progress';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  File, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface MediaFile {
  id: string;
  file: File;
  preview?: string;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  url?: string;
  error?: string;
}

interface MediaUploadProps {
  onUpload?: (files: { url: string; filename: string }[]) => void;
  onError?: (error: string) => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number; // in bytes
  className?: string;
}

export default function MediaUpload({
  onUpload,
  onError,
  accept = {
    'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    'audio/*': ['.mp3', '.wav', '.ogg'],
    'application/pdf': ['.pdf'],
  },
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  className = '',
}: MediaUploadProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);

  const uploadFile = async (file: File): Promise<{ url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  };

  const handleUpload = async (mediaFile: MediaFile) => {
    try {
      setFiles(prev => prev.map(f => 
        f.id === mediaFile.id 
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      ));

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => 
          f.id === mediaFile.id && f.progress < 90
            ? { ...f, progress: f.progress + 10 }
            : f
        ));
      }, 200);

      const result = await uploadFile(mediaFile.file);

      clearInterval(progressInterval);

      setFiles(prev => prev.map(f => 
        f.id === mediaFile.id 
          ? { ...f, status: 'success', progress: 100, url: result.url }
          : f
      ));

      toast.success(`${mediaFile.file.name} uploaded successfully`);

      if (onUpload) {
        onUpload([result]);
      }
    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === mediaFile.id 
          ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
          : f
      ));

      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      toast.error(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    rejectedFiles.forEach(({ file, errors }) => {
      errors.forEach((error: any) => {
        if (error.code === 'file-too-large') {
          toast.error(`${file.name} is too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
        } else if (error.code === 'file-invalid-type') {
          toast.error(`${file.name} is not a supported file type`);
        } else {
          toast.error(`Error with ${file.name}: ${error.message}`);
        }
      });
    });

    // Process accepted files
    const newFiles: MediaFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      status: 'uploading',
      progress: 0,
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Start uploading each file
    newFiles.forEach(handleUpload);
  }, [maxSize, onUpload, onError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize,
    multiple: maxFiles > 1,
  });

  const removeFile = (id: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return ImageIcon;
    }
    return File;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Dropzone */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-blue-600 font-medium">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-gray-600 font-medium mb-2">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  Maximum {maxFiles} files, up to {formatFileSize(maxSize)} each
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((mediaFile) => {
            const FileIcon = getFileIcon(mediaFile.file);
            
            return (
              <Card key={mediaFile.id}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    {/* File preview/icon */}
                    <div className="flex-shrink-0">
                      {mediaFile.preview ? (
                        <img
                          src={mediaFile.preview}
                          alt={mediaFile.file.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                          <FileIcon className="w-6 h-6 text-gray-500" />
                        </div>
                      )}
                    </div>

                    {/* File info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {mediaFile.file.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(mediaFile.file.size)}
                      </p>

                      {/* Progress bar */}
                      {mediaFile.status === 'uploading' && (
                        <div className="mt-2">
                          <Progress value={mediaFile.progress} className="h-2" />
                        </div>
                      )}

                      {/* Error message */}
                      {mediaFile.status === 'error' && mediaFile.error && (
                        <p className="text-sm text-red-600 mt-1">{mediaFile.error}</p>
                      )}

                      {/* Success URL */}
                      {mediaFile.status === 'success' && mediaFile.url && (
                        <p className="text-sm text-green-600 mt-1 truncate">
                          Uploaded: {mediaFile.url}
                        </p>
                      )}
                    </div>

                    {/* Status icon */}
                    <div className="flex-shrink-0">
                      {mediaFile.status === 'uploading' && (
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      )}
                      {mediaFile.status === 'success' && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {mediaFile.status === 'error' && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>

                    {/* Remove button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(mediaFile.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
