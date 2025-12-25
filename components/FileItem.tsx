
import React from 'react';
import { 
  XMarkIcon, 
  ArrowDownTrayIcon, 
  ExclamationCircleIcon,
  VideoCameraIcon,
  PhotoIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { ProcessedFile } from '../types';

interface FileItemProps {
  file: ProcessedFile;
  onRemove: () => void;
  onRetry: () => void;
}

const FileItem: React.FC<FileItemProps> = ({ file, onRemove, onRetry }) => {
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all hover:shadow-sm">
      {/* Icon / Thumbnail */}
      <div className="relative w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-50">
        {file.thumbnailUrl ? (
          <img src={file.thumbnailUrl} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          file.type === 'video' ? <VideoCameraIcon className="w-8 h-8 text-gray-400" /> : <PhotoIcon className="w-8 h-8 text-gray-400" />
        )}
        
        {file.type === 'pair' && (
          <div className="absolute top-0 right-0 p-1 bg-blue-500 rounded-bl-lg">
            <VideoCameraIcon className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-gray-900 truncate">
            {file.originalName}
          </h4>
          {file.type === 'pair' && (
            <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase">
              Live Photo
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          {formatSize(file.originalSize)} • {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
        </p>

        {/* Progress Bar */}
        {file.status === 'processing' && (
          <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${file.progress}%` }}
            />
          </div>
        )}

        {/* Error message */}
        {file.status === 'error' && (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-xs text-red-500 flex items-center gap-1">
              <ExclamationCircleIcon className="w-3 h-3" />
              {file.error}
            </p>
            <button 
              onClick={onRetry}
              className="text-[10px] font-bold text-blue-600 uppercase hover:underline"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 w-full sm:w-auto mt-3 sm:mt-0">
        {file.status === 'completed' && (
          <>
            {file.resultUrl && (
              <a 
                href={file.resultUrl} 
                download={file.resultName}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-lg border border-green-100 hover:bg-green-100 transition-colors"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                JPG
              </a>
            )}
            {file.videoUrl && (
              <a 
                href={file.videoUrl} 
                download={file.videoName}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                MP4
              </a>
            )}
          </>
        )}
        
        {file.status === 'processing' && (
          <div className="flex items-center gap-2 text-blue-600 text-sm font-medium px-3 py-1.5 animate-pulse">
            <ArrowPathIcon className="w-4 h-4 animate-spin" />
            Working...
          </div>
        )}

        <button 
          onClick={onRemove}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default FileItem;
