import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, X, File as FileIcon, Film } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export interface UploadedFile extends File {
  previewUrl?: string;
}

export interface MediaUploadProps {
  label?: string;
  value?: UploadedFile[];
  onChange?: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxFileSizeMB?: number;
  disabled?: boolean;
}

const MediaUpload: React.FC<MediaUploadProps> = ({
  label = "Upload Media",
  value = [],
  onChange,
  maxFiles = 1,
  maxFileSizeMB = 150,
  disabled = false,
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      value.forEach(file => {
        if (file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
    };
  }, [value]);

  const handleFiles = (newFiles: File[]) => {
    if (disabled) return;

    let validFiles: UploadedFile[] = [];

    newFiles.forEach((file) => {
      // Check file type
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        showToast(`File ${file.name} is not an image or video.`, 'error');
        return;
      }

      // Check file size
      if (file.size > maxFileSizeMB * 1024 * 1024) {
        showToast(`File ${file.name} exceeds ${maxFileSizeMB}MB limit.`, 'error');
        return;
      }

      // Create object URL for preview
      const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
      const uploadedFile: UploadedFile = file;
      if (previewUrl) uploadedFile.previewUrl = previewUrl;

      validFiles.push(uploadedFile);
    });

    let updatedFiles = [...value, ...validFiles];
    if (maxFiles === 1) {
      // If single file allowed, replace it
      updatedFiles = validFiles.length > 0 ? [validFiles[validFiles.length - 1]] : value;
    } else if (updatedFiles.length > maxFiles) {
      showToast(`Maximum ${maxFiles} files allowed.`, 'error');
      updatedFiles = updatedFiles.slice(0, maxFiles);
    }

    if (onChange) onChange(updatedFiles);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
    // reset input so the same file can be selected again if removed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (indexToRemove: number) => {
    const fileToRemove = value[indexToRemove];
    if (fileToRemove.previewUrl) {
      URL.revokeObjectURL(fileToRemove.previewUrl);
    }
    const updatedFiles = value.filter((_, idx) => idx !== indexToRemove);
    if (onChange) onChange(updatedFiles);
  };

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>}

      {(!value || value.length < maxFiles) && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`
            relative cursor-pointer w-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-colors
            ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-700 hover:border-primary/50 dark:hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800'}
            ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
          `}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileSelect}
            multiple={maxFiles > 1}
            accept="image/*,video/*"
            className="hidden"
            disabled={disabled}
          />
          <UploadCloud className={`w-10 h-10 mb-3 ${isDragging ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`} />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Click to upload or drag and drop</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Images and Videos only (max {maxFileSizeMB}MB)</p>
        </div>
      )}

      {value && value.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {value.map((file, idx) => (
            <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50 aspect-video flex items-center justify-center">
              {file.type.startsWith('image/') && file.previewUrl ? (
                <img src={file.previewUrl} alt={file.name} className="w-full h-full object-cover" />
              ) : file.type.startsWith('video/') ? (
                <div className="flex flex-col items-center justify-center p-2 text-center">
                  <Film className="w-8 h-8 text-blue-500 mb-2" />
                  <span className="text-xs font-medium text-gray-700 truncate w-full px-2" title={file.name}>{file.name}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-2 text-center">
                  <FileIcon className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-xs font-medium text-gray-700 truncate w-full px-2" title={file.name}>{file.name}</span>
                </div>
              )}

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaUpload;
