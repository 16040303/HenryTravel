import React, { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, Loader2, PlayCircle, Star, Trash2, XCircle } from 'lucide-react';
import { VillaMedia } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  addAdminVillaMedia,
  deleteAdminVillaMedia,
  reorderAdminVillaMedia,
  updateAdminVillaMedia,
  uploadAdminMedia,
} from '../../lib/api';
import type { UploadedMedia } from '../../lib/api';

type MediaUploaderProps = {
  villaId?: string;
  value: VillaMedia[];
  onChange: (media: VillaMedia[]) => void;
  onPendingFilesChange?: (files: UploadedMedia[]) => void;
  disabled?: boolean;
};

const MAX_FILES_PER_REQUEST = 10;
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const VIDEO_MAX_BYTES = 100 * 1024 * 1024;
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']);

export default function MediaUploader({ villaId, value, onChange, onPendingFilesChange, disabled = false }: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { t } = useLanguage();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');

  const sortedMedia = React.useMemo(
    () => [...value].sort((a, b) => a.sortOrder - b.sortOrder),
    [value]
  );

  const handleFilesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFileList = event.currentTarget.files;
    const files: File[] = selectedFileList ? Array.prototype.slice.call(selectedFileList) as File[] : [];
    event.target.value = '';
    setError('');

    if (files.length === 0) return;
    if (files.length > MAX_FILES_PER_REQUEST) {
      setError(t('admin.media.errorMaxFiles'));
      return;
    }
    if (files.some((file) => !allowedTypes.has(file.type))) {
      setError(t('admin.media.errorType'));
      return;
    }
    if (files.some((file) => file.type.startsWith('image/') && file.size > IMAGE_MAX_BYTES)) {
      setError(t('admin.media.errorImageSize'));
      return;
    }
    if (files.some((file) => file.type.startsWith('video/') && file.size > VIDEO_MAX_BYTES)) {
      setError(t('admin.media.errorVideoSize'));
      return;
    }
    if (value.filter((item) => item.type === 'video').length + files.filter((file) => file.type.startsWith('video/')).length > 3) {
      setError(t('admin.media.errorVideoLimit'));
      return;
    }

    try {
      setIsBusy(true);
      const uploaded = await uploadAdminMedia(files);
      if (villaId) {
        const attached = await addAdminVillaMedia(villaId, uploaded.files);
        onChange([...value, ...attached.media].sort((a, b) => a.sortOrder - b.sortOrder));
        return;
      }

      const startOrder = value.length;
      const previewMedia: VillaMedia[] = uploaded.files.map((file, index) => ({
        id: file.publicId,
        type: file.type,
        url: file.secureUrl || file.url,
        thumbnailUrl: file.thumbnailUrl,
        width: file.width,
        height: file.height,
        duration: file.duration,
        sortOrder: startOrder + index,
        isCover: value.length === 0 && index === 0,
      }));
      onChange([...value, ...previewMedia].sort((a, b) => a.sortOrder - b.sortOrder));
      onPendingFilesChange?.(uploaded.files);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : t('admin.media.errorUpload'));
    } finally {
      setIsBusy(false);
    }
  };

  const handleSetCover = async (mediaId: string) => {
    try {
      setIsBusy(true);
      if (!villaId) {
        onChange(value.map((item) => ({ ...item, isCover: item.id === mediaId })));
        return;
      }
      await updateAdminVillaMedia(villaId, mediaId, { isCover: true });
      onChange(value.map((item) => ({ ...item, isCover: item.id === mediaId })));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : t('admin.media.errorCover'));
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async (mediaId: string) => {
    try {
      setIsBusy(true);
      if (!villaId) {
        const nextMedia = value.filter((item) => item.id !== mediaId).map((item, index) => ({ ...item, sortOrder: index, isCover: index === 0 ? item.isCover || !value.some((media) => media.id !== mediaId && media.isCover) : item.isCover }));
        onChange(nextMedia);
        return;
      }
      await deleteAdminVillaMedia(villaId, mediaId);
      onChange(value.filter((item) => item.id !== mediaId).map((item, index) => ({ ...item, sortOrder: index })));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t('admin.media.errorDelete'));
    } finally {
      setIsBusy(false);
    }
  };

  const handleMove = async (mediaId: string, direction: -1 | 1) => {
    const index = sortedMedia.findIndex((item) => item.id === mediaId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= sortedMedia.length) return;

    const nextMedia = [...sortedMedia];
    [nextMedia[index], nextMedia[nextIndex]] = [nextMedia[nextIndex], nextMedia[index]];
    const reordered = nextMedia.map((item, order) => ({ ...item, sortOrder: order }));

    try {
      setIsBusy(true);
      if (!villaId) {
        onChange(reordered);
        return;
      }
      await reorderAdminVillaMedia(villaId, reordered.map((item) => ({ id: item.id, sortOrder: item.sortOrder })));
      onChange(reordered);
    } catch (moveError) {
      setError(moveError instanceof Error ? moveError.message : t('admin.media.errorReorder'));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={handleFilesSelected}
        disabled={disabled || isBusy}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase text-neutral-500">{t('admin.media.title')}</p>
          <p className="text-[10px] font-semibold text-neutral-400">{t('admin.media.help')}</p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || isBusy}
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-black text-sky-700 hover:bg-sky-100 disabled:opacity-50"
        >
          {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {t('admin.media.uploadButton')}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-[11px] font-bold text-rose-700">
          <XCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {sortedMedia.map((media, index) => (
          <div key={media.id} className="group overflow-hidden rounded-2xl border border-white bg-white shadow-sm">
            <div className="relative aspect-[4/3] bg-neutral-100">
              {media.type === 'video' ? (
                <>
                  <video src={media.url} poster={media.thumbnailUrl || undefined} preload="none" className="h-full w-full object-cover" />
                  <PlayCircle className="absolute left-2 top-2 h-6 w-6 text-white drop-shadow" />
                </>
              ) : (
                <img src={media.thumbnailUrl || media.url} alt="Villa media" className="h-full w-full object-cover" />
              )}
              {media.isCover && <span className="absolute bottom-2 left-2 rounded-full bg-amber-400 px-2 py-1 text-[9px] font-black text-amber-950">Cover</span>}
            </div>
            <div className="flex items-center justify-between gap-1 p-2">
              <button type="button" onClick={() => handleMove(media.id, -1)} disabled={disabled || isBusy || index === 0} className="flex min-h-10 min-w-10 items-center justify-center rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={() => handleMove(media.id, 1)} disabled={disabled || isBusy || index === sortedMedia.length - 1} className="flex min-h-10 min-w-10 items-center justify-center rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={() => handleSetCover(media.id)} disabled={disabled || isBusy || media.isCover} className="flex min-h-10 min-w-10 items-center justify-center rounded-lg p-1.5 text-amber-600 hover:bg-amber-50 disabled:opacity-30"><Star className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={() => handleDelete(media.id)} disabled={disabled || isBusy} className="flex min-h-10 min-w-10 items-center justify-center rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 disabled:opacity-30"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
