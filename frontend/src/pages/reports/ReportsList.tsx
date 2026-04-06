import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from '../../api/reports';
import { Report } from '../../types';
import Button from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import { ConfirmModal } from '../../components/ui/Modal';
import { PlusIcon, MagnifyingGlassIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useLang } from '../../contexts/LanguageContext';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

export default function ReportsList() {
  const qc = useQueryClient();
  const { T, lang } = useLang();
  const locale = lang === 'ar' ? ar : enUS;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Report | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['reports', page, search, status],
    queryFn: () => reportsApi.list({ page, limit: 10, search, status }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reportsApi.delete(id),
    onSuccess: () => { toast.success('✓'); qc.invalidateQueries({ queryKey: ['reports'] }); setDeleteTarget(null); },
    onError: () => toast.error('!'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => reportsApi.toggleStatus(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reports'] }); },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={T.reports.search}
              className="ps-9 pe-3 py-2 text-sm border border-gray-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="">{T.common.all_statuses}</option>
            <option value="published">{T.common.published}</option>
            <option value="draft">{T.common.draft}</option>
          </select>
        </div>
        <Link to="/reports/new">
          <Button><PlusIcon className="w-4 h-4" /> {T.reports.new}</Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full mx-auto" /></div>
        ) : !data?.data.length ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-base">{T.reports.no_results}</p>
            <p className="text-sm mt-1">{T.reports.no_results_sub}</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-start font-medium text-gray-500">{T.common.title}</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-500">{T.common.author}</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-500">{T.reports.tags}</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-500">{T.common.status}</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-500">{T.common.updated}</th>
                  <th className="px-4 py-3 text-end font-medium text-gray-500">{T.common.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.data.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 truncate max-w-xs">{report.title_en}</p>
                      {report.title_ar && <p className="text-xs text-gray-400 truncate" dir="rtl">{report.title_ar}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{report.author || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(report.tags || []).slice(0, 3).map((tag) => (
                          <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleMutation.mutate(report.id)} title="Toggle">
                        <StatusBadge status={report.status} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {formatDistanceToNow(new Date(report.updated_at), { addSuffix: true, locale })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Link to={`/reports/${report.id}/edit`}>
                          <Button variant="ghost" size="sm"><PencilSquareIcon className="w-4 h-4" /></Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(report)}>
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
        loading={deleteMutation.isPending}
        title={T.reports.delete_title}
        message={T.reports.delete_msg(deleteTarget?.title_en || '') + ' ' + T.common.confirm_delete_body}
      />
    </div>
  );
}
