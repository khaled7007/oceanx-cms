import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { galleryApi } from '../../api/gallery';
import { GalleryItem } from '../../types';
import Button from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import { CloudArrowUpIcon, TrashIcon, ClipboardDocumentIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useLang } from '../../contexts/LanguageContext';
import { usePermissions } from '../../contexts/AuthContext';
import { uploadFile } from '../../services/storage.service';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

export default function MediaLibrary() {
  const qc = useQueryClient();
  const { T, lang } = useLang();
  const { canWrite } = usePermissions();
  const locale = lang === 'ar' ? ar : enUS;
  const [page, setPage] = useState(1);
  const [sourceFilter, setSourceFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['gallery', page, sourceFilter],
    queryFn: () => galleryApi.list({ page, limit: 20, source: sourceFilter }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => galleryApi.delete(id),
    onSuccess: () => { toast.success('✓'); qc.invalidateQueries({ queryKey: ['gallery'] }); setDeleteTarget(null); },
    onError: () => toast.error('!'),
  });

  const toggleVisibleMutation = useMutation({
    mutationFn: ({ id, visible }: { id: string; visible: boolean }) => galleryApi.toggleVisible(id, visible),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gallery'] }); },
  });

  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    let success = 0;
    for (const file of Array.from(files)) {
      try {
        const path = `gallery/${Date.now()}_${file.name}`;
        const url = await uploadFile(file, path);
        await galleryApi.addToGallery(url, 'manual');
        success++;
      } catch { toast.error(`${T.common.upload_failed}: ${file.name}`); }
    }
    setUploading(false);
    if (success > 0) { toast.success(`${success} ${T.media.files}`); qc.invalidateQueries({ queryKey: ['gallery'] }); }
  }, [qc, T]);

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); handleUpload(e.dataTransfer.files); };
  const copyUrl = (url: string) => { navigator.clipboard.writeText(url); toast.success(T.common.url_copied); };

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      {canWrite && (
        <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-brand-400 transition-colors cursor-pointer"
          onClick={() => document.getElementById('bulk-upload')?.click()}>
          <input id="bulk-upload" type="file" multiple accept="image/*" className="hidden"
            onChange={(e) => handleUpload(e.target.files)} />
          <CloudArrowUpIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500 font-medium">{T.media.drop_hint}</p>
          <p className="text-xs text-gray-400 mt-1">{T.media.drop_sub}</p>
          {uploading && <p className="text-xs text-brand-500 mt-2 animate-pulse">{T.common.uploading}</p>}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">{T.media.all_sources}</option>
          <option value="manual">{T.media.manual}</option>
          <option value="reports">{T.nav.reports}</option>
          <option value="articles">{T.nav.articles}</option>
          <option value="news">{T.nav.news}</option>
          <option value="services">{T.nav.services}</option>
          <option value="competencies">{T.nav.competencies}</option>
          <option value="partners">{T.nav.partners}</option>
        </select>
        {data && <span className="text-sm text-gray-400">{data.pagination.total} {T.media.files}</span>}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : !data?.data.length ? (
        <div className="text-center py-16 text-gray-400">
          <CloudArrowUpIcon className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p>{T.media.no_files}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {data.data.map((item) => (
              <div key={item.id} className="group relative bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                  <img src={item.img} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-2">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{item.uploaded_from}</span>
                    {item.visible
                      ? <span className="px-1.5 py-0.5 bg-green-50 text-green-600 rounded text-xs">{T.media.visible}</span>
                      : <span className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded text-xs">{T.media.hidden}</span>}
                  </div>
                  <p className="text-xs text-gray-300">
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale })}
                  </p>
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => copyUrl(item.img)} className="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100" title={T.common.copy_url}>
                    <ClipboardDocumentIcon className="w-4 h-4" />
                  </button>
                  {canWrite && (
                    <button onClick={() => toggleVisibleMutation.mutate({ id: item.id, visible: !item.visible })}
                      className="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100" title={item.visible ? T.media.hide : T.media.show}>
                      {item.visible ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    </button>
                  )}
                  {canWrite && (
                    <button onClick={() => setDeleteTarget(item)} className="p-2 bg-red-500 rounded-lg text-white hover:bg-red-600">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Pagination page={data.pagination.page} pages={data.pagination.pages}
            total={data.pagination.total} limit={data.pagination.limit} onPageChange={setPage} />
        </>
      )}

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending} title={T.media.delete_title}
        message={T.media.delete_msg('') + ' ' + T.common.confirm_delete_body} />
    </div>
  );
}
