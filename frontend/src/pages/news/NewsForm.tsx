import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { newsApi } from '../../api/news';
import { mediaApi } from '../../api/media';
import { NewsItem } from '../../types';
import Button from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import RichTextEditor from '../../components/ui/RichTextEditor';
import FileUpload from '../../components/ui/FileUpload';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const emptyNews: Partial<NewsItem> = {
  headline_en: '', headline_ar: '', body_en: '', body_ar: '',
  source: '', publish_date: '', cover_image: '', status: 'draft',
};

export default function NewsForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<Partial<NewsItem>>(emptyNews);
  const [uploading, setUploading] = useState(false);

  const { data: existing, isLoading } = useQuery({
    queryKey: ['news-item', id],
    queryFn: () => newsApi.get(id!).then((r) => r.data),
    enabled: isEdit,
  });

  useEffect(() => { if (existing) setForm(existing); }, [existing]);
  const set = (field: keyof NewsItem, value: unknown) => setForm((f) => ({ ...f, [field]: value }));

  const saveMutation = useMutation({
    mutationFn: (data: Partial<NewsItem>) =>
      isEdit ? newsApi.update(id!, data) : newsApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'News updated' : 'News created');
      qc.invalidateQueries({ queryKey: ['news'] });
      navigate('/news');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Save failed';
      toast.error(msg);
    },
  });

  const handleUploadCover = async (file: File) => {
    setUploading(true);
    try {
      const res = await mediaApi.upload(file, ['cover', 'news']);
      set('cover_image', res.data.url);
      toast.success('Cover uploaded');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.headline_en?.trim()) { toast.error('English headline is required'); return; }
    saveMutation.mutate(form);
  };

  if (isLoading) return <div className="flex justify-center p-8"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" /></div>;

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
      <Link to="/news" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeftIcon className="w-4 h-4" /> Back to News
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900">Content</h3>
            <Input label="Headline (English) *" value={form.headline_en || ''} onChange={(e) => set('headline_en', e.target.value)} required />
            <Input label="Headline (Arabic)" value={form.headline_ar || ''} onChange={(e) => set('headline_ar', e.target.value)} dir="rtl" />
            <RichTextEditor label="Body (English)" value={form.body_en || ''} onChange={(html) => set('body_en', html)} placeholder="News body…" />
            <RichTextEditor label="Body (Arabic)" value={form.body_ar || ''} onChange={(html) => set('body_ar', html)} placeholder="محتوى الخبر…" dir="rtl" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm">Settings</h3>
            <Select
              label="Status"
              value={form.status || 'draft'}
              onChange={(e) => set('status', e.target.value)}
              options={[{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }]}
            />
            <Input label="Source" value={form.source || ''} onChange={(e) => set('source', e.target.value)} placeholder="Reuters, OceanX Press…" />
            <Input label="Publish Date" type="date" value={form.publish_date || ''} onChange={(e) => set('publish_date', e.target.value)} />
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm">Cover Image</h3>
            <FileUpload accept="image/*" onFile={handleUploadCover}
              preview={form.cover_image} onClear={() => set('cover_image', '')} hint="JPG, PNG, WebP" />
            {uploading && <p className="text-xs text-brand-500 animate-pulse">Uploading…</p>}
            <Input value={form.cover_image || ''} onChange={(e) => set('cover_image', e.target.value)} placeholder="Or paste image URL" />
          </div>

          <div className="flex gap-2">
            <Button type="submit" loading={saveMutation.isPending} disabled={uploading} className="flex-1">
              {isEdit ? 'Update News' : 'Create News'}
            </Button>
            <Link to="/news"><Button type="button" variant="secondary">Cancel</Button></Link>
          </div>
        </div>
      </div>
    </form>
  );
}
