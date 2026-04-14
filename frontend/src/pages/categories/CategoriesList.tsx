import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../../api/categories';
import { Category } from '../../types';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import { ConfirmModal } from '../../components/ui/Modal';
import { PlusIcon, MagnifyingGlassIcon, PencilSquareIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useLang } from '../../contexts/LanguageContext';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

export default function CategoriesList() {
  const qc = useQueryClient();
  const { T, lang } = useLang();
  const isAr = lang === 'ar';
  const locale = isAr ? ar : enUS;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['categories', page, search],
    queryFn: () => categoriesApi.list({ page, limit: 10, search }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => { toast.success('✓'); qc.invalidateQueries({ queryKey: ['categories'] }); setDeleteTarget(null); },
    onError: () => toast.error('!'),
  });

  const saveMutation = useMutation({
    mutationFn: (dto: { id?: string; name: { en: string; ar?: string } }) =>
      dto.id ? categoriesApi.update(dto.id, { name: dto.name }) : categoriesApi.create({ name: dto.name }),
    onSuccess: () => {
      toast.success('✓');
      qc.invalidateQueries({ queryKey: ['categories'] });
      resetForm();
    },
    onError: () => toast.error('!'),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditTarget(null);
    setNameEn('');
    setNameAr('');
  };

  const openEdit = (cat: Category) => {
    setEditTarget(cat);
    setNameEn(cat.name.en);
    setNameAr(cat.name.ar ?? '');
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim()) { toast.error('English name is required'); return; }
    saveMutation.mutate({ id: editTarget?.id, name: { en: nameEn.trim(), ar: nameAr.trim() || undefined } });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={T.categories.search}
            className="ps-9 pe-3 py-2 text-sm border border-gray-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><PlusIcon className="w-4 h-4" /> {T.categories.new}</Button>
      </div>

      {/* Inline form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">{editTarget ? T.categories.update : T.categories.create}</h3>
              <button type="button" onClick={resetForm}><XMarkIcon className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{T.categories.name_en} *</label>
              <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} required
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{T.categories.name_ar}</label>
              <input value={nameAr} onChange={(e) => setNameAr(e.target.value)} dir="rtl"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="secondary" onClick={resetForm}>{T.common.cancel}</Button>
              <Button type="submit" loading={saveMutation.isPending}>{editTarget ? T.categories.update : T.categories.create}</Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? <div className="p-8 text-center"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full mx-auto" /></div>
          : !data?.data.length ? <div className="p-12 text-center text-gray-400"><p>{T.categories.no_results}</p></div>
          : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-start font-medium text-gray-500">{T.categories.name_en}</th>
                    <th className="px-4 py-3 text-start font-medium text-gray-500">{T.categories.name_ar}</th>
                    <th className="px-4 py-3 text-start font-medium text-gray-500">{T.common.created}</th>
                    <th className="px-4 py-3 text-end font-medium text-gray-500">{T.common.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.data.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{cat.name.en}</td>
                      <td className="px-4 py-3 text-gray-600" dir="rtl">{cat.name.ar || '—'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {formatDistanceToNow(new Date(cat.created_at), { addSuffix: true, locale })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(cat)}>
                            <PencilSquareIcon className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(cat)}>
                            <TrashIcon className="w-4 h-4 text-red-400" />
                          </Button>
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
        loading={deleteMutation.isPending} title={T.categories.delete_title}
        message={T.categories.delete_msg(deleteTarget?.name.en || '')} />
    </div>
  );
}
