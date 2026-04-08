import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { articlesApi } from '../../api/articles';
import { mediaApi } from '../../api/media';
import { Article } from '../../types';
import Button from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import RichTextEditor from '../../components/ui/RichTextEditor';
import FileUpload from '../../components/ui/FileUpload';
import { useLang } from '../../contexts/LanguageContext';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const emptyArticle: Partial<Article> = {
  title: { en: '' }, body: { en: '' },
  category: '', cover_image: '', status: 'draft', featured: false,
};
const CATEGORIES = ['Research', 'Science', 'Climate', 'Conservation', 'Technology', 'Policy', 'Other'];

export default function ArticleForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { T, lang } = useLang();
  const BackIcon = lang === 'ar' ? ArrowRightIcon : ArrowLeftIcon;
  const [form, setForm] = useState<Partial<Article>>(emptyArticle);
  const [uploading, setUploading] = useState(false);

  const { data: existing, isLoading } = useQuery({
    queryKey: ['article', id],
    queryFn: () => articlesApi.get(id!).then((r) => r.data),
    enabled: isEdit,
  });

  useEffect(() => { if (existing) setForm(existing); }, [existing]);
  const set = (field: keyof Article, value: unknown) => setForm((f) => ({ ...f, [field]: value }));

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Article>) => isEdit ? articlesApi.update(id!, data) : articlesApi.create(data),
    onSuccess: () => { toast.success(isEdit ? T.articles.update : T.articles.create); qc.invalidateQueries({ queryKey: ['articles'] }); navigate('/articles'); },
    onError: (err: unknown) => { toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || '!'); },
  });

  const handleUploadCover = async (file: File) => {
    setUploading(true);
    try { const res = await mediaApi.upload(file, ['cover']); set('cover_image', res.data.url); toast.success(T.common.uploaded); }
    catch { toast.error(T.common.upload_failed); }
    finally { setUploading(false); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.en?.trim()) { toast.error('English title is required'); return; }
    saveMutation.mutate(form);
  };

  if (isLoading) return <div className="flex justify-center p-8"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" /></div>;

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      <Link to="/articles" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <BackIcon className="w-4 h-4" /> {T.articles.back}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="min-w-0 space-y-5">
          <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900">{T.common.content}</h3>
            <Input label={`${T.common.title_en} *`} value={form.title?.en || ''} onChange={(e) => set('title', { ...form.title, en: e.target.value })} required />
            <Input label={T.common.title_ar} value={form.title?.ar || ''} onChange={(e) => set('title', { ...form.title, ar: e.target.value })} dir="rtl" />
            <RichTextEditor label={T.common.body_en} value={form.body?.en || ''} onChange={(html) => set('body', { ...form.body, en: html })} />
            <RichTextEditor label={T.common.body_ar} value={form.body?.ar || ''} onChange={(html) => set('body', { ...form.body, ar: html })} dir="rtl" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm">{T.common.settings}</h3>
            <Select label={T.common.status} value={form.status || 'draft'} onChange={(e) => set('status', e.target.value)}
              options={[{ value: 'draft', label: T.common.draft }, { value: 'published', label: T.common.published }]} />
            <Select label={T.articles.category} value={form.category || ''} onChange={(e) => set('category', e.target.value)}
              options={[{ value: '', label: T.articles.select_category }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]} />
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.featured || false} onChange={(e) => set('featured', e.target.checked)}
                className="w-4 h-4 text-brand-500 rounded focus:ring-brand-500" />
              <span className="text-sm font-medium text-gray-700">{T.articles.featured}</span>
            </label>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm">{T.reports.cover}</h3>
            <FileUpload accept="image/*" onFile={handleUploadCover} preview={form.cover_image}
              onClear={() => set('cover_image', '')} hint="JPG, PNG, WebP" />
            {uploading && <p className="text-xs text-brand-500 animate-pulse">{T.common.uploading}</p>}
            <Input value={form.cover_image || ''} onChange={(e) => set('cover_image', e.target.value)} placeholder={T.common.or_paste_url} />
          </div>

          <div className="flex gap-2">
            <Button type="submit" loading={saveMutation.isPending} disabled={uploading} className="flex-1">
              {isEdit ? T.articles.update : T.articles.create}
            </Button>
            <Link to="/articles"><Button type="button" variant="secondary">{T.common.cancel}</Button></Link>
          </div>
        </div>
      </div>
    </form>
  );
}
