import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { articlesApi } from '../../api/articles';
import { Article, ContentStatus } from '../../types';
import Button from '../../components/ui/Button';
import Badge, { StatusBadge } from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import { ConfirmModal } from '../../components/ui/Modal';
import { PlusIcon, MagnifyingGlassIcon, PencilSquareIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useLang } from '../../contexts/LanguageContext';
import toast from 'react-hot-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { syncArticlesFromFolder } from '../../services/syncArticles';

export default function ArticlesList() {
  const qc = useQueryClient();
  const { T, lang } = useLang();
  const isAr = lang === 'ar';
  const locale = isAr ? ar : enUS;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | ContentStatus>('');
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['articles', page, search, status],
    queryFn: () => articlesApi.list({ page, limit: 10, search, status }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => articlesApi.delete(id),
    onSuccess: () => { toast.success('✓'); qc.invalidateQueries({ queryKey: ['articles'] }); setDeleteTarget(null); },
    onError: () => toast.error('!'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => articlesApi.toggleStatus(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['articles'] }); },
  });

  const handleSync = async () => {
    setSyncing(true);
    setSyncStatus('Starting…');
    try {
      const result = await syncArticlesFromFolder((p) => {
        setSyncStatus(`${p.current}/${p.total} — ${p.currentName}`);
      });
      toast.success(`Synced ${result.total - result.errors.length}/${result.total} articles`);
      if (result.errors.length) {
        console.warn('Sync errors:', result.errors);
        toast.error(`${result.errors.length} errors — check console`);
      }
      qc.invalidateQueries({ queryKey: ['articles'] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
      setSyncStatus(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={T.articles.search}
              className="ps-9 pe-3 py-2 text-sm border border-gray-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value as '' | ContentStatus); setPage(1); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="">{T.common.all_statuses}</option>
            <option value="published">{T.common.published}</option>
            <option value="draft">{T.common.draft}</option>
          </select>
        </div>
        <div className="flex gap-2 items-center">
          {syncStatus && <span className="text-xs text-gray-500 animate-pulse">{syncStatus}</span>}
          <Button variant="secondary" onClick={handleSync} disabled>
            <ArrowPathIcon className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} /> Sync Articles
          </Button>
          <Link to="/articles/new"><Button><PlusIcon className="w-4 h-4" /> {T.articles.new}</Button></Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? <div className="p-8 text-center"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full mx-auto" /></div>
          : !data?.data.length ? <div className="p-12 text-center text-gray-400"><p>{T.articles.no_results}</p></div>
          : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-start font-medium text-gray-500">{T.common.title}</th>
                    <th className="px-4 py-3 text-start font-medium text-gray-500">{T.articles.categories}</th>
                    <th className="px-4 py-3 text-start font-medium text-gray-500">{T.common.date}</th>
                    <th className="px-4 py-3 text-start font-medium text-gray-500">{T.common.status}</th>
                    <th className="px-4 py-3 text-start font-medium text-gray-500">{T.articles.featured}</th>
                    <th className="px-4 py-3 text-start font-medium text-gray-500">{T.common.updated}</th>
                    <th className="px-4 py-3 text-end font-medium text-gray-500">{T.common.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.data.map((article) => (
                    <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 truncate max-w-xs" dir={isAr ? 'rtl' : undefined}>{isAr ? (article.title.ar || article.title.en) : article.title.en}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {article.categories.slice(0, 3).map((cat, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{isAr ? (cat.ar || cat.en) : cat.en}</span>
                          ))}
                          {article.categories.length > 3 && (
                            <span className="px-1.5 py-0.5 text-gray-400 text-xs">+{article.categories.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {article.date ? format(new Date(article.date), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="px-4 py-3"><button onClick={() => toggleMutation.mutate(article.id)}><StatusBadge status={article.status} /></button></td>
                      <td className="px-4 py-3">{article.featured && <Badge variant="info">★</Badge>}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {formatDistanceToNow(new Date(article.updated_at), { addSuffix: true, locale })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Link to={`/articles/${article.id}/edit`}><Button variant="ghost" size="sm"><PencilSquareIcon className="w-4 h-4" /></Button></Link>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(article)}><TrashIcon className="w-4 h-4 text-red-400" /></Button>
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
        loading={deleteMutation.isPending} title={T.articles.delete_title}
        message={T.articles.delete_msg(deleteTarget?.title.en || '')} />
    </div>
  );
}
