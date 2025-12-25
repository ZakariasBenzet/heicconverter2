
import React, { useState, useCallback, useRef } from 'react';
import { 
  CloudArrowUpIcon, 
  VideoCameraIcon, 
  CheckCircleIcon, 
  SparklesIcon
} from '@heroicons/react/24/outline';
import { ProcessedFile, FileGroup } from './types';
import Header from './components/Header';
import FileItem from './components/FileItem';

// Access heic2any from global window
declare const heic2any: any;

const App: React.FC = () => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalFilesMap = useRef<Map<string, { image: File, video?: File }>>(new Map());

  const processFile = useCallback(async (fileObj: ProcessedFile, originalFile: File, pairedVideo?: File) => {
    // Save original files for retry
    originalFilesMap.current.set(fileObj.id, { image: originalFile, video: pairedVideo });

    setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'processing', progress: 10, error: undefined } : f));

    try {
      let resultBlob: Blob | null = null;
      let resultName = '';
      let videoUrl: string | undefined = undefined;
      let videoName: string | undefined = undefined;

      // Check if library is available
      if (typeof heic2any === 'undefined') {
        throw new Error("Conversion engine (heic2any) failed to load. Please refresh the page.");
      }

      // Handle Video if it's a Live Photo pair
      if (pairedVideo) {
        videoUrl = URL.createObjectURL(pairedVideo);
        videoName = pairedVideo.name;
      }

      // Convert HEIC to JPG
      const fileName = originalFile.name.toLowerCase();
      const isHeic = fileName.endsWith('.heic') || fileName.endsWith('.heif');
      
      if (isHeic) {
        setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, progress: 30 } : f));
        
        try {
          // Attempt conversion using the upgraded library version
          let conversionResult = await heic2any({
            blob: originalFile,
            toType: 'image/jpeg',
            quality: 0.92,
            multiple: false
          });

          if (Array.isArray(conversionResult)) {
            resultBlob = conversionResult[0];
          } else {
            resultBlob = conversionResult;
          }
          
          resultName = originalFile.name.replace(/\.(heic|heif)$/i, '.jpg');
        } catch (convErr: any) {
          console.error('HEIC Conversion detailed error:', convErr);
          
          // Better error extraction to avoid [object Object]
          let errorDetail = "";
          if (convErr instanceof Error) {
             errorDetail = convErr.message;
          } else if (typeof convErr === 'string') {
             errorDetail = convErr;
          } else {
             try {
                errorDetail = JSON.stringify(convErr);
             } catch {
                errorDetail = "Unknown conversion error";
             }
          }

          let friendlyError = "Conversion failed.";
          if (errorDetail.includes('format not supported') || errorDetail.includes('ERR_LIBHEIF')) {
            friendlyError = "Format not supported. This usually happens with certain 10-bit or ProRAW HEIC files.";
          } else {
            friendlyError = `Error: ${errorDetail.substring(0, 80)}`;
          }
          
          throw new Error(friendlyError);
        }
      } else {
        // Just copy if already JPG or other supported format
        resultBlob = originalFile;
        resultName = originalFile.name;
      }

      if (!resultBlob) throw new Error("Conversion produced no output.");

      const resultUrl = URL.createObjectURL(resultBlob);
      const thumbnailUrl = resultUrl; 

      setFiles(prev => prev.map(f => 
        f.id === fileObj.id ? { 
          ...f, 
          status: 'completed', 
          progress: 100, 
          resultUrl, 
          resultName,
          videoUrl,
          videoName,
          thumbnailUrl
        } : f
      ));
    } catch (err: any) {
      console.error('General Processing error:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setFiles(prev => prev.map(f => 
        f.id === fileObj.id ? { 
          ...f, 
          status: 'error', 
          error: errorMessage || 'Failed to process file.' 
        } : f
      ));
    }
  }, []);

  const handleRetry = (id: string) => {
    const original = originalFilesMap.current.get(id);
    const meta = files.find(f => f.id === id);
    if (original && meta) {
      processFile(meta, original.image, original.video);
    }
  };

  const handleFiles = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const fileList = Array.from(selectedFiles);
    
    // Group files by base name to identify Live Photo pairs
    const groups: Map<string, FileGroup> = new Map();

    fileList.forEach(file => {
      const dotIndex = file.name.lastIndexOf('.');
      const baseName = dotIndex !== -1 ? file.name.substring(0, dotIndex) : file.name;
      const ext = file.name.substring(dotIndex + 1).toLowerCase();

      if (!groups.has(baseName)) {
        groups.set(baseName, { baseName });
      }

      const group = groups.get(baseName)!;
      if (['heic', 'heif', 'jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
        group.imageFile = file;
      } else if (['mov', 'mp4'].includes(ext)) {
        group.videoFile = file;
      }
    });

    const itemsToProcess: { file: File, meta: ProcessedFile, video?: File }[] = [];

    groups.forEach((group) => {
      if (group.imageFile) {
        const id = Math.random().toString(36).substring(7);
        const meta: ProcessedFile = {
          id,
          originalName: group.imageFile.name,
          originalSize: group.imageFile.size + (group.videoFile?.size || 0),
          type: group.videoFile ? 'pair' : 'image',
          status: 'pending',
          progress: 0,
        };
        itemsToProcess.push({ file: group.imageFile, meta, video: group.videoFile });
      } else if (group.videoFile) {
        const id = Math.random().toString(36).substring(7);
        const meta: ProcessedFile = {
          id,
          originalName: group.videoFile.name,
          originalSize: group.videoFile.size,
          type: 'video',
          status: 'completed',
          progress: 100,
          videoUrl: URL.createObjectURL(group.videoFile),
          videoName: group.videoFile.name,
          resultUrl: '', 
        };
        setFiles(prev => [...prev, meta]);
      }
    });

    const metas = itemsToProcess.map(f => f.meta);
    setFiles(prev => [...prev, ...metas]);

    itemsToProcess.forEach(({ file, meta, video }) => {
      processFile(meta, file, video);
    });
  }, [processFile]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    originalFilesMap.current.delete(id);
  };

  const clearAll = () => {
    setFiles([]);
    originalFilesMap.current.clear();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative cursor-pointer transition-all duration-300 ease-in-out
            border-2 border-dashed rounded-2xl p-12 text-center
            ${isDragging ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-gray-300 bg-white hover:border-gray-400'}
          `}
        >
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
            accept=".heic,.heif,.jpg,.jpeg,.png,.webp,.mov,.mp4"
          />
          
          <div className="flex flex-col items-center">
            <div className="bg-blue-100 p-4 rounded-full mb-4">
              <CloudArrowUpIcon className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Drop your HEIC or Live Photos here
            </h2>
            <p className="text-gray-500 max-w-sm">
              Select multiple files or folders. We'll automatically pair HEIC images with their MOV videos.
            </p>
            <button className="mt-6 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
              Select Files
            </button>
          </div>
        </div>

        {files.length > 0 && (
          <div className="mt-12 space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                Processed Files <span className="text-sm font-normal text-gray-500">({files.length})</span>
              </h3>
              <button 
                onClick={clearAll}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Clear All
              </button>
            </div>
            
            <div className="grid gap-4">
              {files.map((file) => (
                <FileItem 
                  key={file.id} 
                  file={file} 
                  onRemove={() => removeFile(file.id)} 
                  onRetry={() => handleRetry(file.id)}
                />
              ))}
            </div>
          </div>
        )}

        {files.length === 0 && (
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <SparklesIcon className="w-8 h-8 text-amber-500 mb-3" />
              <h4 className="font-medium text-gray-900 mb-1">High Quality</h4>
              <p className="text-sm text-gray-500">Uses upgraded libheif v1.1.0 for the best possible codec support and color accuracy.</p>
            </div>
            <div className="flex flex-col items-center">
              <VideoCameraIcon className="w-8 h-8 text-blue-500 mb-3" />
              <h4 className="font-medium text-gray-900 mb-1">Live Photos</h4>
              <p className="text-sm text-gray-500">Automatically detects and extracts the video part of your memories.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full border-2 border-green-500 flex items-center justify-center mb-3">
                <CheckCircleIcon className="w-6 h-6 text-green-500" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">100% Private</h4>
              <p className="text-sm text-gray-500">Everything is processed locally in your browser. No data ever leaves your device.</p>
            </div>
          </div>
        )}
      </main>

      <footer className="py-8 text-center text-gray-400 text-sm">
        <p>© {new Date().getFullYear()} LiveHEIC Converter • Privacy First</p>
      </footer>
    </div>
  );
};

export default App;
