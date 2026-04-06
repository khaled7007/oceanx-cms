import { useRef, useState, DragEvent } from 'react';
import { CloudArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface FileUploadProps {
  label?: string;
  accept?: string;
  onFile: (file: File) => void;
  preview?: string;
  onClear?: () => void;
  hint?: string;
}

export default function FileUpload({ label, accept, onFile, preview, onClear, hint }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  const isImage = preview && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(preview);

  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

      {preview ? (
        <div className="relative inline-block">
          {isImage ? (
            <img src={preview} alt="Preview" className="h-32 w-auto object-cover rounded-lg border border-gray-200" />
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-gray-50">
              <span>📄</span>
              <span className="truncate max-w-xs">{preview.split('/').pop()}</span>
            </div>
          )}
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
            >
              <XMarkIcon className="w-3 h-3" />
            </button>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 h-28 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            dragging ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50'
          }`}
        >
          <CloudArrowUpIcon className="w-8 h-8 text-gray-400" />
          <p className="text-sm text-gray-500">Click or drop file here</p>
          {hint && <p className="text-xs text-gray-400">{hint}</p>}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
    </div>
  );
}
