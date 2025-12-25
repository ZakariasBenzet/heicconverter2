
export interface ProcessedFile {
  id: string;
  originalName: string;
  originalSize: number;
  type: 'image' | 'video' | 'pair';
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  resultUrl?: string;
  resultName?: string;
  videoUrl?: string;
  videoName?: string;
  thumbnailUrl?: string;
}

export interface FileGroup {
  baseName: string;
  imageFile?: File;
  videoFile?: File;
}
