import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pagesApi } from '../../api/pages';
import { Page } from '../../types';
import Button from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import { ConfirmModal } from '../../components/ui/Modal';
import { PlusIcon, MagnifyingGlassIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useLang } from '../../contexts/LanguageContext';
import { usePermissions } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

export default function PagesList() {
  const qc = useQueryClient();
  const { T, lang } = useLang();
  const { canWrite } = usePermissions();
  const isAr = lang === 'ar';
  const locale = isAr ? ar : enUS;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Page | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['pages', page, search],
    queryFn: () => pagesApi.list({ page, limit: 10, search }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => pagesApi.delete(id),
    onSuccess: () => { toast.success('✓'); qc.invalidateQueries({ queryKey: ['pages'] }); setDeleteTarget(null); },
    onError: () => toast.error('!'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => pagesApi.toggleStatus(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pages'] }); },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={T.pages.search}
            className="ps-9 pe-3 py-2 text-sm border border-gray-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        {canWrite && <Link to="/pages/new"><Button><PlusIcon className="w-4 h-4" /> {T.pages.new}</Button></Link>}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? <div className="p-8 text-center"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full mx-auto" /></div>
          : !data?.data.length ? <div className="p-12 text-center text-gray-400"><p>{T.pages.no_results}</p></div>
          : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-start font-medium text-gray-500">{T.common.title}</th>
                    <th className="px-4 py-3 text-start font-medium text-gray-500">{T.pages.slug}</th>
                    <th className="px-4 py-3 text-start font-medium text-gray-500">{T.common.status}</th>
                    <th className="px-4 py-3 text-start font-medium text-gray-500">{T.common.updated}</th>
                    <th className="px-4 py-3 text-end font-medium text-gray-500">{T.common.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.data.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900" dir={isAr ? 'rtl' : undefined}>{isAr ? (p.title.ar || p.title.en) : p.title.en}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">/{p.slug}</td>
                      <td className="px-4 py-3">{canWrite ? <button onClick={() => toggleMutation.mutate(p.id)}><StatusBadge status={p.status} /></button> : <StatusBadge status={p.status} />}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {formatDistanceToNow(new Date(p.updated_at), { addSuffix: true, locale })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {canWrite && <Link to={`/pages/${p.id}/edit`}><Button variant="ghost" size="sm"><PencilSquareIcon className="w-4 h-4" /></Button></Link>}
                          {canWrite && <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(p)}><TrashIcon className="w-4 h-4 text-red-400" /></Button>}
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
        loading={deleteMutation.isPending} title={T.pages.delete_title}
        message={T.pages.delete_msg(deleteTarget?.title.en || '', deleteTarget?.slug || '') + ' ' + T.common.confirm_delete_body} />
    </div>
  );
}
