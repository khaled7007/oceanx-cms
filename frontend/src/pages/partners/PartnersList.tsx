import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partnersApi } from '../../api/partners';
import { Partner } from '../../types';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import { ConfirmModal } from '../../components/ui/Modal';
import { PlusIcon, MagnifyingGlassIcon, PencilSquareIcon, TrashIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { syncPartnersFromFolder } from '../../services/syncPartners';
import { useLang } from '../../contexts/LanguageContext';
import { usePermissions } from '../../contexts/AuthContext';
import { uploadFile } from '../../services/storage.service';
import { galleryApi } from '../../api/gallery';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

export default function PartnersList() {
  const qc = useQueryClient();
  const { T, lang } = useLang();
  const { canWrite, canSync } = usePermissions();
  const isAr = lang === 'ar';
  const locale = isAr ? ar : enUS;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null);
  const [editTarget, setEditTarget] = useState<Partner | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [img, setImg] = useState('');
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['partners', page, search],
    queryFn: () => partnersApi.list({ page, limit: 10, search }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => partnersApi.delete(id),
    onSuccess: () => { toast.success('✓'); qc.invalidateQueries({ queryKey: ['partners'] }); setDeleteTarget(null); },
    onError: () => toast.error('!'),
  });

  const saveMutation = useMutation({
    mutationFn: (dto: { id?: string; name: { en: string; ar?: string }; img: string }) =>
      dto.id
        ? partnersApi.update(dto.id, { name: dto.name, img: dto.img })
        : partnersApi.create({ name: dto.name, img: dto.img }),
    onSuccess: () => {
      toast.success('✓');
      qc.invalidateQueries({ queryKey: ['partners'] });
      resetForm();
    },
    onError: () => toast.error('!'),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditTarget(null);
    setNameEn('');
    setNameAr('');
    setImg('');
  };

  const openEdit = (partner: Partner) => {
    setEditTarget(partner);
    setNameEn(partner.name.en);
    setNameAr(partner.name.ar ?? '');
    setImg(partner.img);
    setShowForm(true);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const path = `partners/${Date.now()}_${file.name}`;
      const url = await uploadFile(file, path);
      await galleryApi.addToGallery(url, 'partners');
      setImg(url);
      toast.success(T.common.uploaded);
    } catch {
      toast.error(T.common.upload_failed);
    } finally {
      setUploading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncStatus(null);
    try {
      const result = await syncPartnersFromFolder((p) => {
        setSyncStatus(`${p.current}/${p.total} — ${p.currentName}`);
      });
      toast.success(`Synced ${result.total - result.errors.length} partners (${result.errors.length} failed)`);
      qc.invalidateQueries({ queryKey: ['partners'] });
    } catch (err: any) {
      toast.error(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
      setSyncStatus(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim()) { toast.error('English name is required'); return; }
    if (!img.trim()) { toast.error('Image is required'); return; }
    saveMutation.mutate({ id: editTarget?.id, name: { en: nameEn.trim(), ar: nameAr.trim() || undefined }, img });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={T.partners.search}
            className="ps-9 pe-3 py-2 text-sm border border-gray-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div className="flex gap-2">
          {canSync && (
            <Button variant="secondary" onClick={handleSync} disabled>
              <ArrowPathIcon className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} /> {syncing ? 'Syncing...' : 'Sync Partners'}
            </Button>
          )}
          {canWrite && <Button onClick={() => { resetForm(); setShowForm(true); }}><PlusIcon className="w-4 h-4" /> {T.partners.new}</Button>}
        </div>
      </div>

      {syncStatus && (
        <div className="text-sm text-brand-600 bg-brand-50 rounded-lg px-4 py-2">{syncStatus}</div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">{editTarget ? T.partners.update : T.partners.create}</h3>
              <button type="button" onClick={resetForm}><XMarkIcon className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{T.partners.name_en} *</label>
              <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} required
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{T.partners.name_ar}</label>
              <input value={nameAr} onChange={(e) => setNameAr(e.target.value)} dir="rtl"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{T.partners.image} *</label>
              {img ? (
                <div className="relative inline-block">
                  <img src={img} alt="" className="w-24 h-24 object-contain rounded-lg border" />
                  <button type="button" onClick={() => setImg('')}
                    className="absolute -top-2 -right-2 p-0.5 bg-red-500 text-white rounded-full">
                    <XMarkIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                    className="text-sm" />
                  {uploading && <p className="text-xs text-brand-500 animate-pulse">{T.common.uploading}</p>}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{T.common.or_paste_url}</span>
                    <input value={img} onChange={(e) => setImg(e.target.value)} placeholder="https://..."
                      className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="secondary" onClick={resetForm}>{T.common.cancel}</Button>
              <Button type="submit" loading={saveMutation.isPending} disabled={uploading}>{editTarget ? T.partners.update : T.partners.create}</Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? <div className="p-8 text-center"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full mx-auto" /></div>
          : !data?.data.length ? <div className="p-12 text-center text-gray-400"><p>{T.partners.no_results}</p></div>
          : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-start font-medium text-gray-500">{T.partners.image}</th>
                    <th className="px-4 py-3 text-start font-medium text-gray-500">{T.partners.name_en}</th>
                    <th className="px-4 py-3 text-start font-medium text-gray-500">{T.partners.name_ar}</th>
                    <th className="px-4 py-3 text-start font-medium text-gray-500">{T.common.created}</th>
                    <th className="px-4 py-3 text-end font-medium text-gray-500">{T.common.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.data.map((partner) => (
                    <tr key={partner.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        {partner.img ? <img src={partner.img} alt="" className="w-12 h-12 object-contain rounded-lg" /> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{partner.name.en}</td>
                      <td className="px-4 py-3 text-gray-600" dir="rtl">{partner.name.ar || '—'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {formatDistanceToNow(new Date(partner.created_at), { addSuffix: true, locale })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {canWrite && (
                            <Button variant="ghost" size="sm" onClick={() => openEdit(partner)}>
                              <PencilSquareIcon className="w-4 h-4" />
                            </Button>
                          )}
                          {canWrite && (
                            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(partner)}>
                              <TrashIcon className="w-4 h-4 text-red-400" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 pb-4">
                <Pagination page={data.pagination.page} pages={data.pagination.pages}
                  total={data.pagination.total} limit={data.pagination.limit} onPageChange={setPage} />
              </div>
            </>
          )}
      </div>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending} title={T.partners.delete_title}
        message={T.partners.delete_msg(deleteTarget?.name.en || '')} />
    </div>
  );
}
