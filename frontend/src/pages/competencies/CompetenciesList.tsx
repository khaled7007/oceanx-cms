import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { competenciesApi } from '../../api/competencies';
import { Competency } from '../../types';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import { ConfirmModal } from '../../components/ui/Modal';
import { PlusIcon, MagnifyingGlassIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useLang } from '../../contexts/LanguageContext';
import toast from 'react-hot-toast';

export default function CompetenciesList() {
  const qc = useQueryClient();
  const { T, lang } = useLang();
  const isAr = lang === 'ar';
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Competency | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['competencies', page, search],
    queryFn: () => competenciesApi.list({ page, limit: 10, search }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => competenciesApi.delete(id),
    onSuccess: () => { toast.success('✓'); qc.invalidateQueries({ queryKey: ['competencies'] }); setDeleteTarget(null); },
    onError: () => toast.error('!'),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={T.competencies.search}
            className="ps-9 pe-3 py-2 text-sm border border-gray-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <Link to="/competencies/new"><Button><PlusIcon className="w-4 h-4" /> {T.competencies.new}</Button></Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? <div className="p-8 text-center"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full mx-auto" /></div>
          : !data?.data.length ? <div className="p-12 text-center text-gray-400"><p>{T.competencies.no_results}</p></div>
          : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-start font-medium text-gray-500">{T.competencies.photo_label}</th>
                    <th className="px-4 py-3 text-start font-medium text-gray-500">{T.competencies.name}</th>
                    <th className="px-4 py-3 text-start font-medium text-gray-500">{T.competencies.position}</th>
                    <th className="px-4 py-3 text-start font-medium text-gray-500">{T.competencies.category}</th>
                    <th className="px-4 py-3 text-start font-medium text-gray-500">{T.competencies.department}</th>
                    <th className="px-4 py-3 text-end font-medium text-gray-500">{T.common.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.data.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        {item.photo ? <img src={item.photo} alt="" className="w-10 h-10 rounded-full object-cover" /> : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900" dir={isAr ? 'rtl' : undefined}>{isAr ? (item.name.ar || item.name.en) : item.name.en}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-600" dir={isAr ? 'rtl' : undefined}>{isAr ? (item.position.ar || item.position.en) : item.position.en}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={item.category === 'Board of Directors' ? 'info' : 'success'}>
                          {item.category === 'Board of Directors' ? T.competencies.board_of_directors : T.competencies.consulting_team}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-600" dir={isAr ? 'rtl' : undefined}>{isAr ? (item.department?.ar || item.department?.en || '—') : (item.department?.en || '—')}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Link to={`/competencies/${item.id}/edit`}><Button variant="ghost" size="sm"><PencilSquareIcon className="w-4 h-4" /></Button></Link>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(item)}><TrashIcon className="w-4 h-4 text-red-400" /></Button>
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
        loading={deleteMutation.isPending} title={T.competencies.delete_title}
        message={T.competencies.delete_msg(deleteTarget?.name.en || '')} />
    </div>
  );
}
