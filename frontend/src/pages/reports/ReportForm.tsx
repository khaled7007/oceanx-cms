import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from '../../api/reports';
import { mediaApi } from '../../api/media';
import { Report } from '../../types';
import Button from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import RichTextEditor from '../../components/ui/RichTextEditor';
import FileUpload from '../../components/ui/FileUpload';
import { useLang } from '../../contexts/LanguageContext';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const emptyReport: Partial<Report> = {
  title_en: '', title_ar: '', body_en: '', body_ar: '', author: '',
  publish_date: '', tags: [], pdf_url: '', cover_image: '', status: 'draft',
};

export default function ReportForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { T, lang } = useLang();
  const BackIcon = lang === 'ar' ? ArrowRightIcon : ArrowLeftIcon;

  const [form, setForm] = useState<Partial<Report>>(emptyReport);
  const [tagsInput, setTagsInput] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const { data: existing, isLoading } = useQuery({
    queryKey: ['report', id],
    queryFn: () => reportsApi.get(id!).then((r) => r.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) { setForm(existing); setTagsInput((existing.tags || []).join(', ')); }
  }, [existing]);

  const set = (field: keyof Report, value: unknown) => setForm((f) => ({ ...f, [field]: value }));

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Report>) =>
      isEdit ? reportsApi.update(id!, data) : reportsApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? T.reports.update : T.reports.create);
      qc.invalidateQueries({ queryKey: ['reports'] });
      navigate('/reports');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || '!';
      toast.error(msg);
    },
  });

  const handleUploadCover = async (file: File) => {
    setUploadingCover(true);
    try { const res = await mediaApi.upload(file, ['cover']); set('cover_image', res.data.url); toast.success(T.common.uploaded); }
    catch { toast.error(T.common.upload_failed); }
    finally { setUploadingCover(false); }
  };

  const handleUploadPdf = async (file: File) => {
    setUploadingPdf(true);
    try { const res = await mediaApi.upload(file, ['pdf', 'report']); set('pdf_url', res.data.url); toast.success(T.common.uploaded); }
    catch { toast.error(T.common.upload_failed); }
    finally { setUploadingPdf(false); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title_en?.trim()) { toast.error('English title is required'); return; }
    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    saveMutation.mutate({ ...form, tags });
  };

  if (isLoading) return <div className="flex justify-center p-8"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" /></div>;

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
      <Link to="/reports" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <BackIcon className="w-4 h-4" /> {T.reports.back}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900">{T.common.content}</h3>
            <Input label={`${T.common.title_en} *`} value={form.title_en || ''} onChange={(e) => set('title_en', e.target.value)} required />
            <Input label={T.common.title_ar} value={form.title_ar || ''} onChange={(e) => set('title_ar', e.target.value)} dir="rtl" />
            <RichTextEditor label={T.common.body_en} value={form.body_en || ''} onChange={(html) => set('body_en', html)} />
            <RichTextEditor label={T.common.body_ar} value={form.body_ar || ''} onChange={(html) => set('body_ar', html)} dir="rtl" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm">{T.common.settings}</h3>
            <Select label={T.common.status} value={form.status || 'draft'} onChange={(e) => set('status', e.target.value)}
              options={[{ value: 'draft', label: T.common.draft }, { value: 'published', label: T.common.published }]} />
            <Input label={T.common.author} value={form.author || ''} onChange={(e) => set('author', e.target.value)} />
            <Input label={T.reports.publish_date} type="date" value={form.publish_date || ''} onChange={(e) => set('publish_date', e.target.value)} />
            <Input label={T.reports.tags_hint} value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="ocean, health, annual" />
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm">{T.common.media}</h3>
            <FileUpload label={T.reports.cover} accept="image/*" onFile={handleUploadCover}
              preview={form.cover_image} onClear={() => set('cover_image', '')} hint="JPG, PNG, WebP — max 20 MB" />
            {uploadingCover && <p className="text-xs text-brand-500 animate-pulse">{T.common.uploading}</p>}
            <Input label={T.reports.cover_url} value={form.cover_image || ''} onChange={(e) => set('cover_image', e.target.value)} placeholder={T.common.or_paste_url} />

            <FileUpload label={T.reports.pdf} accept=".pdf,application/pdf" onFile={handleUploadPdf}
              preview={form.pdf_url} onClear={() => set('pdf_url', '')} hint="PDF — max 20 MB" />
            {uploadingPdf && <p className="text-xs text-brand-500 animate-pulse">{T.common.uploading}</p>}
            <Input label={T.reports.pdf_url} value={form.pdf_url || ''} onChange={(e) => set('pdf_url', e.target.value)} placeholder={T.common.or_paste_url} />
          </div>

          <div className="flex gap-2">
            <Button type="submit" loading={saveMutation.isPending} disabled={uploadingCover || uploadingPdf} className="flex-1">
              {isEdit ? T.reports.update : T.reports.create}
            </Button>
            <Link to="/reports"><Button type="button" variant="secondary">{T.common.cancel}</Button></Link>
          </div>
        </div>
      </div>
    </form>
  );
}
