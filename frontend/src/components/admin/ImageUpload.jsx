import { useState, useRef } from 'react';
import { Upload, AlertCircle, Loader2 } from 'lucide-react';
import { useToastStore } from '../../store/toastStore';

import imageCompression from 'browser-image-compression';

const compressImage = async (file) => {
  if (!file.type.startsWith('image/') || file.type.includes('gif')) {
    return file;
  }
  try {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };
    return await imageCompression(file, options);
  } catch (error) {
    console.error('Compression error:', error);
    return file;
  }
};

export default function ImageUpload({ onUpload, label = "Upload Images", multiple = true, accept = "image/*" }) {
  const { addToast } = useToastStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef(null);

  const isVideoMode = accept.startsWith('video');

  const handleFiles = async (files) => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const allFiles = Array.from(files);
    const validFiles = isVideoMode
      ? allFiles.filter(f => f.type.startsWith('video/'))
      : allFiles.filter(f => f.type.startsWith('image/'));

    if (validFiles.length === 0) {
      addToast(`Please select valid ${isVideoMode ? 'video' : 'image'} files`, 'error');
      return;
    }

    setIsUploading(true);
    try {
      let processedFiles = validFiles;

      if (isVideoMode) {
        // Video upload: one at a time to /upload/video
        let uploaded = 0;
        for (const file of processedFiles) {
          setUploadProgress(`Uploading video ${++uploaded} of ${processedFiles.length}...`);
          const formData = new FormData();
          formData.append('video', file);
          const response = await fetch(`${apiBase}/upload/video`, {
            method: 'POST',
            body: formData,
          });
          const data = await response.json();
          if (response.ok) {
            onUpload({ url: data.url, public_id: data.public_id });
          } else {
            throw new Error(data.message || 'Video upload failed');
          }
        }
        addToast(`${processedFiles.length} video(s) uploaded successfully`, 'success');
        // Single image upload
        setUploadProgress('Compressing image...');
        const compressedFile = await compressImage(processedFiles[0]);
        setUploadProgress('Uploading to Cloudinary...');
        const formData = new FormData();
        formData.append('image', compressedFile);
        const response = await fetch(`${apiBase}/upload`, {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        if (response.ok) {
          onUpload({ url: data.url, public_id: data.public_id });
          addToast('Image uploaded successfully', 'success');
        } else {
          throw new Error(data.message || 'Upload failed');
        }
      } else {
        // Multiple images: upload 1 by 1 sequentially to avoid payload limits and chunk failures
        let allUrls = [];
        let uploadedCount = 0;
        for (const file of processedFiles) {
          try {
            setUploadProgress(`Compressing image ${uploadedCount + 1}...`);
            const compressedFile = await compressImage(file);
            setUploadProgress(`Uploading image ${uploadedCount + 1} of ${processedFiles.length}...`);
            const formData = new FormData();
            formData.append('image', compressedFile);
            const response = await fetch(`${apiBase}/upload`, {
              method: 'POST',
              body: formData,
            });
            const data = await response.json();
            if (response.ok) {
              allUrls.push({ url: data.url, public_id: data.public_id });
            } else {
              addToast(`Failed to upload ${file.name}`, 'error');
            }
          } catch (error) {
            addToast(`Failed to upload ${file.name}`, 'error');
          }
          uploadedCount++;
        }
        if (allUrls.length > 0) {
          onUpload(multiple ? allUrls : allUrls[0]);
          addToast(multiple ? `${allUrls.length} images uploaded successfully` : 'Image uploaded successfully', 'success');
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      addToast(error.message || 'Failed to upload to Cloudinary', 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); };

  return (
    <div className="space-y-4">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed transition-all duration-300 cursor-pointer p-8 text-center
          ${isDragging ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/10 scale-[1.01]' : 'border-[#333] hover:border-[#555] bg-[#0a0a0a]'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleFiles(e.target.files)}
          multiple={multiple}
          accept={accept}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          <div className={`p-4 rounded-full ${isDragging ? 'bg-[var(--color-gold)] text-black' : 'bg-[#1a1a1a] text-[#A1A1A1]'}`}>
            {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
          </div>
          <div>
            <p className="text-white font-bold uppercase tracking-widest text-xs mb-1">
              {isUploading ? (uploadProgress || `Uploading to Cloudinary...`) : label}
            </p>
            <p className="text-[#777] text-xs">Drag and drop or click to select</p>
          </div>
        </div>

        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-gold)]/5 pointer-events-none">
            <p className="text-[var(--color-gold)] font-bold uppercase tracking-tighter">Drop to Upload</p>
          </div>
        )}
      </div>

      <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded text-[#A1A1A1] text-[10px] uppercase tracking-widest leading-relaxed">
        <AlertCircle className="w-3 h-3 text-green-400 shrink-0 mt-0.5" />
        <p>Files are uploaded to Cloudinary. This saves space and keeps your site fast!</p>
      </div>
    </div>
  );
}
