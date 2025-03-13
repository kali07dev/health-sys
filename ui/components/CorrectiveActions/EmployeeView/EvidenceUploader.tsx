'use client';

import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { 
  Loader2, 
  XCircle, 
  Upload, 
  File, 
  X, 
  FileText, 
  ImageIcon 
} from 'lucide-react';
import { incidentAPI } from '@/utils/api';
import Image from 'next/image';

interface EvidenceUploaderProps {
  actionId: string;
  onCancel: () => void;
  onSubmitSuccess: () => void;
}

type FileWithPreview = {
  file: File;
  id: string;
  preview?: string;
};

export default function EvidenceUploader({ 
  actionId, 
  onCancel, 
  onSubmitSuccess 
}: EvidenceUploaderProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    const newFiles = Array.from(e.target.files).map(file => ({
      file,
      id: Math.random().toString(36).substring(2),
      preview: file.type.startsWith('image/') 
        ? URL.createObjectURL(file) 
        : undefined
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
    
    // Reset the input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const filtered = prev.filter(file => file.id !== id);
      
      // Revoke object URL for removed image preview to free memory
      const fileToRemove = prev.find(file => file.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      
      return filtered;
    });
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    } else if (file.type.includes('pdf')) {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else {
      return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (files.length === 0) {
      toast.error('Please add at least one file');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('actionId', actionId);
      formData.append('description', description);
      
      files.forEach(({ file }) => {
        formData.append('files', file);
      });
      
      // This would be the actual API call
      await incidentAPI.uploadActionEvidence(actionId, formData);
      
      toast.success('Evidence uploaded successfully');
      onSubmitSuccess();
      onCancel();
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload evidence');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Upload Evidence</h3>
        <button 
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-500"
        >
          <XCircle className="h-5 w-5" />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this evidence demonstrate?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
          />
        </div>
        
        <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            id="file-upload"
            multiple
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx,.xlsx,.xls,.csv,.txt"
          />
          
          <div className="space-y-2">
            <Upload className="mx-auto h-10 w-10 text-gray-400" />
            <div className="text-sm text-gray-600">
              <label htmlFor="file-upload" className="cursor-pointer font-medium text-red-600 hover:text-red-500">
                Click to upload
              </label>{' '}
              or drag and drop
            </div>
            <p className="text-xs text-gray-500">
              PNG, JPG, PDF, DOC, XLSX up to 10MB
            </p>
          </div>
        </div>
        
        {/* File preview list */}
        {files.length > 0 && (
          <div className="mt-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Selected files ({files.length})
            </h4>
            <ul className="space-y-2">
              {files.map(({ file, id, preview }) => (
                <li key={id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-2">
                    {preview ? (
                      <Image src={preview} alt="Preview" className="h-10 w-10 object-cover rounded" />
                    ) : (
                      getFileIcon(file)
                    )}
                    <div className="text-sm">
                      <p className="text-gray-900 truncate max-w-xs">{file.name}</p>
                      <p className="text-gray-500">{(file.size / 1024).toFixed(0)} KB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(id)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 flex items-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload Evidence'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}