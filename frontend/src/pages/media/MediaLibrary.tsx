import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaApi } from '../../api/media';
import { Media } from '../../types';
import Button from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import { CloudArrowUpIcon, MagnifyingGlassIcon, TrashIcon, TagIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

function formatBytes(bytes?: number) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaLibrary() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Media | null>(null);
  const [tagsTarget, setTagsTarget] = useState<Media | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['media', page, search, typeFilter],
    queryFn: () => mediaApi.list({ page, limit: 20, search, type: typeFilter }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mediaApi.delete(id),
    onSuccess: () => { toast.success('File deleted'); qc.invalidateQueries({ queryKey: ['media'] }); setDeleteTarget(null); },
    onError: () => toast.error('Failed to delete'),
  });

  const tagsMutation = useMutation({
    mutationFn: ({ id, tags }: { id: string; tags: string[] }) => mediaApi.updateTags(id, tags),
    onSuccess: () => { toast.success('Tags updated'); qc.invalidateQueries({ queryKey: ['media'] }); setTagsTarget(null); },
    onError: () => toast.error('Failed to update tags'),
  });

  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    let success = 0;
    for (const file of Array.from(files)) {
      try {
        await mediaApi.upload(file);
        success++;
      } catch { toast.error(`Failed to upload ${file.name}`); }
    }
    setUploading(false);
    if (success > 0) {
      toast.success(`${success} file(s) uploaded`);
      qc.invalidateQueries({ queryKey: ['media'] });
    }
  }, [qc]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleUpload(e.dataTransfer.files);
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied');
  };

  const isImage = (mime?: string) => mime?.startsWith('image/');

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-brand-400 transition-colors cursor-pointer"
        onClick={() => document.getElementById('bulk-upload')?.click()}
      >
        <input id="bulk-upload" type="file" multiple accept="image/*,.pdf" className="hidden"
          onChange={(e) => handleUpload(e.target.files)} />
        <CloudArrowUpIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500 font-medium">Drop files here or click to upload</p>
        <p className="text-xs text-gray-400 mt-1">Images (JPG, PNG, WebP, GIF, SVG) and PDFs — max 20 MB each</p>
        {uploading && <p className="text-xs text-brand-500 mt-2 animate-pulse">Uploading…</p>}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search files…"
            className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">All types</option>
          <option value="image">Images</option>
          <option value="pdf">PDFs</option>
        </select>
        {data && <span className="text-sm text-gray-400">{data.pagination.total} files</span>}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : !data?.data.length ? (
        <div className="text-center py-16 text-gray-400">
          <CloudArrowUpIcon className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p>No files uploaded yet</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {data.data.map((file) => (
              <div key={file.id} className="group relative bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                {/* Preview */}
                <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                  {isImage(file.mime_type) ? (
                    <img src={file.url} alt={file.original_name}
                      className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 p-3">
                      <span className="text-3xl">📄</span>
                      <span className="text-xs text-gray-500 text-center truncate w-full">PDF</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-2">
                  <p className="text-xs text-gray-700 truncate font-medium">{file.original_name}</p>
                  <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
                  {file.tags && file.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {file.tags.map((t) => (
                        <span key={t} className="px-1 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">{t}</span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-300 mt-1">
                    {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                  </p>
                </div>

                {/* Hover actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => copyUrl(file.url)}
                    className="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100" title="Copy URL">
                    <ClipboardDocumentIcon className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setTagsTarget(file); setTagInput((file.tags || []).join(', ')); }}
                    className="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100" title="Edit tags">
                    <TagIcon className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(file)}
                    className="p-2 bg-red-500 rounded-lg text-white hover:bg-red-600" title="Delete">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={data.pagination.page} pages={data.pagination.pages}
            total={data.pagination.total} limit={data.pagination.limit} onPageChange={setPage} />
        </>
      )}

      {/* Delete confirm */}
      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending} title="Delete File"
        message={`Delete "${deleteTarget?.original_name}"? This file may be used in content. This cannot be undone.`} />

      {/* Tags editor */}
      {tagsTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <h3 className="font-semibold text-gray-900">Edit Tags</h3>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="ocean, research, cover (comma-separated)"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setTagsTarget(null)}>Cancel</Button>
              <Button
                loading={tagsMutation.isPending}
                onClick={() => {
                  const tags = tagInput.split(',').map((t) => t.trim()).filter(Boolean);
                  tagsMutation.mutate({ id: tagsTarget.id, tags });
                }}
              >
                Save Tags
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
