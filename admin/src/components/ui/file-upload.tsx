'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, Music } from 'lucide-react';
import { uploadApi } from '@/lib/api';

interface FileUploadProps {
  value: string;
  onChange: (url: string) => void;
  accept?: 'image' | 'audio' | 'both';
  label?: string;
}

const ACCEPT_MAP = {
  image: 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml',
  audio: 'audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/mp4',
  both: 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml,audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/mp4',
};

export function FileUpload({ value, onChange, accept = 'image', label }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isImage = value && (
    /\.(jpe?g|png|webp|gif|svg)$/i.test(value) ||
    (value.startsWith('http') && accept === 'image')
  );
  const isAudio = value && (
    /\.(mp3|wav|ogg|aac|m4a)$/i.test(value) ||
    (value.startsWith('http') && accept === 'audio')
  );

  const handleUpload = useCallback(async (file: File) => {
    setError('');
    setUploading(true);
    try {
      // Check file size (>50MB will be rejected by backend)
      if (file.size > 50 * 1024 * 1024) {
        setError('File too large (max 50 MB)');
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const res = await uploadApi.upload(formData);
      const url = res.data?.url || res.data?.data?.url;
      if (url) {
        onChange(url);
      } else {
        setError('Upload failed — no URL returned. Check backend configuration.');
      }
    } catch (err: unknown) {
      let msg = 'Upload failed';
      if (err instanceof Error) {
        msg = err.message;
        // Add context for common errors
        if (msg.includes('timeout') || msg.includes('ECONNABORTED')) {
          msg = 'Upload timed out. Backend may be unreachable or R2 is misconfigured.';
        } else if (msg.includes('403') || msg.includes('401')) {
          msg = 'Authentication failed. Check R2 credentials in backend .env';
        } else if (msg.includes('ERR_NETWORK')) {
          msg = 'Network error. Is the backend running at ' + (process.env.NEXT_PUBLIC_API_URL || 'localhost:3000') + '?';
        }
      }
      setError(msg);
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const handleRemove = () => {
    onChange('');
    setError('');
  };

  const Icon = accept === 'audio' ? Music : ImageIcon;

  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      )}

      {value ? (
        <div className="relative inline-block">
          {isImage && (
            <img
              src={value}
              alt="Uploaded"
              className="h-24 w-24 rounded-lg border border-gray-200 object-contain bg-gray-50"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          {isAudio && (
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <Music className="h-5 w-5 text-gray-500" />
              <audio controls src={value} className="h-8" />
            </div>
          )}
          {!isImage && !isAudio && (
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
              <Icon className="h-4 w-4" />
              <span className="max-w-[200px] truncate">{value.split('/').pop()}</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 transition-colors ${
            dragOver
              ? 'border-orange-400 bg-orange-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
          } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          ) : (
            <>
              <Upload className="h-6 w-6 text-gray-400" />
              <p className="mt-1.5 text-xs text-gray-500">
                Click or drag to upload {accept === 'audio' ? 'audio' : accept === 'both' ? 'file' : 'image'}
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_MAP[accept]}
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <div className="mt-2 rounded border border-red-200 bg-red-50 p-2">
          <p className="text-xs text-red-700">{error}</p>
          <p className="mt-1 text-xs text-red-600">
            💡 Troubleshooting: Check backend logs (npm run dev in /backend) and verify R2 credentials in .env
          </p>
        </div>
      )}
    </div>
  );
}
