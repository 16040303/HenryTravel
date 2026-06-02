import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, XCircle } from 'lucide-react';
import { uploadAdminImages } from '../../lib/api';

export type ImageUploaderProps = {
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  disabled?: boolean;
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export default function ImageUploader({ value, onChange, maxFiles = 20, disabled = false }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFilesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.currentTarget.files;
    const selectedFiles: File[] = fileList ? Array.from(fileList) : [];
    event.target.value = '';
    setError('');

    if (selectedFiles.length === 0) return;
    if (value.length + selectedFiles.length > maxFiles) {
      setError(`Chỉ được lưu tối đa ${maxFiles} ảnh cho mỗi villa.`);
      return;
    }

    const invalidType = selectedFiles.find((file) => !allowedTypes.has(file.type));
    if (invalidType) {
      setError('Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.');
      return;
    }

    const oversizedFile = selectedFiles.find((file) => file.size > MAX_FILE_SIZE_BYTES);
    if (oversizedFile) {
      setError('Mỗi ảnh không được vượt quá 5MB.');
      return;
    }

    try {
      setIsUploading(true);
      const response = await uploadAdminImages(selectedFiles);
      onChange([...value, ...response.urls]);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Không thể tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = (url: string) => {
    onChange(value.filter((item) => item !== url));
  };

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFilesSelected}
        disabled={disabled || isUploading}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <span className="text-[10px] font-bold text-neutral-400 uppercase">Ảnh villa</span>
          <p className="text-[10px] text-neutral-400 mt-0.5">
            Ảnh được tải lên Cloudinary và lưu dưới dạng URL. Tối đa {maxFiles} ảnh, 5MB/ảnh.
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || isUploading || value.length >= maxFiles}
          className="bg-[#edf3ff] hover:bg-[#dcecff] text-[#0071c2] border border-[#a1c9ff] font-black text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
          <span>{isUploading ? 'Đang tải...' : 'Tải ảnh lên'}</span>
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-[11px] font-bold text-rose-700">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {value.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {value.map((url, index) => (
            <div key={`${url}-${index}`} className="relative overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-50 shadow-sm group">
              <img src={url} alt={`Villa ${index + 1}`} className="aspect-[4/3] w-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(url)}
                disabled={disabled || isUploading}
                className="absolute right-2 top-2 rounded-lg bg-black/65 p-1.5 text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Xóa ảnh khỏi villa"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 text-[9px] font-black text-white">
                Ảnh {index + 1}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || isUploading}
          className="border-2 border-dashed border-neutral-200 bg-neutral-50 rounded-2xl p-6 text-center cursor-pointer hover:bg-neutral-100/50 transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ImagePlus className="w-8 h-8 text-[#0071c2]" />
          <span className="text-[11px] font-bold text-[#0071c2]">Chọn ảnh JPG, PNG hoặc WEBP từ máy</span>
          <span className="text-[9px] text-neutral-400 font-semibold">Ảnh sẽ được upload lên Cloudinary trước khi lưu villa</span>
        </button>
      )}
    </div>
  );
}
