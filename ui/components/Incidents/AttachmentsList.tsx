// components/Incidents/AttachmentsList.tsx
import React from 'react';
import { IncidentAttachment } from '@/interfaces/incidents';
import { FileIcon, Download } from 'lucide-react';
import Image from 'next/image';

interface AttachmentsListProps {
  attachments: IncidentAttachment[];
}

export const AttachmentsList: React.FC<AttachmentsListProps> = ({ attachments }) => {

  const BE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isImage = (fileType: string): boolean => {
    return fileType.startsWith('image/');
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Attachments</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="relative group bg-white p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
          >
            {isImage(attachment.fileType) ? (
              <div className="aspect-w-16 aspect-h-9 mb-3">
                <Image
                  src={`${BE_URL}/${attachment.StoragePath}`}
                  alt={attachment.fileName}
                  className="object-cover rounded-md"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 bg-gray-50 rounded-md mb-3">
                <FileIcon className="h-12 w-12 text-gray-400" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900 truncate">
                {attachment.fileName}
              </span>
              <span className="text-xs text-gray-500">
                {formatFileSize(attachment.fileSize)}
              </span>
              <span className="text-xs text-gray-500">
                Uploaded by {attachment.uploader}
              </span>
            </div>
            <a
              href={`${BE_URL}/${attachment.StoragePath}`}
              download
              className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-600"
            >
              <Download className="h-5 w-5" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};