import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesApi } from '../../api/services';
import { Service } from '../../types';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import { ConfirmModal } from '../../components/ui/Modal';
import { PlusIcon, MagnifyingGlassIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useLang } from '../../contexts/LanguageContext';
import toast from 'react-hot-toast';

export default function ServicesList() {
  const qc = useQueryClient();
  const { T } = useLang();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['services', page, search],
    queryFn: () => servicesApi.list({ page, limit: 10, search }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => servicesApi.delete(id),
    onSuccess: () => { toast.success('✓'); qc.invalidateQueries({ queryKey: ['services'] }); setDeleteTarget(null); },
    onError: () => toast.error('!'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => servicesApi.toggleActive(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services'] }); },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={T.services.search}
            className="ps-9 pe-3 py-2 text-sm border border-gray-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <Link to="/services/new"><Button><PlusIcon className="w-4 h-4" /> {T.services.new}</Button></Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? <div className="p-8 text-center"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full mx-auto" /></div>
          : !data?.data.length ? <div className="p-12 text-center text-gray-400"><p>{T.services.no_results}</p></div>
          : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-start font-medium text-gray-500">{T.services.order}</th>
                    <th className="px-4 py-3 text-start font-medium text-gray-500">{T.common.title}</th>
                    <th className="px-4 py-3 text-start font-medium text-gray-500">{T.services.icon}</th>
                    <th className="px-4 py-3 text-start font-medium text-gray-500">{T.common.status}</th>
                    <th className="px-4 py-3 text-end font-medium text-gray-500">{T.common.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.data.map((service) => (
                    <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{service.order_index}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{service.title_en}</p>
                        {service.title_ar && <p className="text-xs text-gray-400" dir="rtl">{service.title_ar}</p>}
                      </td>
                      <td className="px-4 py-3">
                        {service.icon_url ? <img src={service.icon_url} alt="" className="w-8 h-8 object-contain" /> : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleMutation.mutate(service.id)}>
                          <Badge variant={service.active ? 'success' : 'default'}>
                            {service.active ? T.services.active : T.services.inactive}
                          </Badge>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Link to={`/services/${service.id}/edit`}><Button variant="ghost" size="sm"><PencilSquareIcon className="w-4 h-4" /></Button></Link>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(service)}><TrashIcon className="w-4 h-4 text-red-400" /></Button>
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
        loading={deleteMutation.isPending} title={T.services.delete_title}
        message={T.services.delete_msg(deleteTarget?.title_en || '')} />
    </div>
  );
}
