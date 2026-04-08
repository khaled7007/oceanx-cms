import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesApi } from '../../api/services';
import { mediaApi } from '../../api/media';
import { Service } from '../../types';
import Button from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import FileUpload from '../../components/ui/FileUpload';
import { useLang } from '../../contexts/LanguageContext';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const emptyService: Partial<Service> = {
  title: { en: '' }, description: { en: '' },
  icon_url: '', image_url: '', order_index: 0, active: true,
};

export default function ServiceForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { T, lang } = useLang();
  const BackIcon = lang === 'ar' ? ArrowRightIcon : ArrowLeftIcon;
  const [form, setForm] = useState<Partial<Service>>(emptyService);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const { data: existing, isLoading } = useQuery({
    queryKey: ['service', id],
    queryFn: () => servicesApi.get(id!).then((r) => r.data),
    enabled: isEdit,
  });

  useEffect(() => { if (existing) setForm(existing); }, [existing]);
  const set = (field: keyof Service, value: unknown) => setForm((f) => ({ ...f, [field]: value }));

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Service>) => isEdit ? servicesApi.update(id!, data) : servicesApi.create(data),
    onSuccess: () => { toast.success(isEdit ? T.services.update : T.services.create); qc.invalidateQueries({ queryKey: ['services'] }); navigate('/services'); },
    onError: (err: unknown) => { toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || '!'); },
  });

  const handleUpload = async (file: File, field: 'icon_url' | 'image_url', setUploading: (v: boolean) => void) => {
    setUploading(true);
    try { const res = await mediaApi.upload(file, ['service']); set(field, res.data.url); toast.success(T.common.uploaded); }
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
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <Link to="/services" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <BackIcon className="w-4 h-4" /> {T.services.back}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900">{T.services.details}</h3>
            <Input label={`${T.common.title_en} *`} value={form.title?.en || ''} onChange={(e) => set('title', { ...form.title, en: e.target.value })} required />
            <Input label={T.common.title_ar} value={form.title?.ar || ''} onChange={(e) => set('title', { ...form.title, ar: e.target.value })} dir="rtl" />
            <Textarea label={T.services.desc_en} value={form.description?.en || ''} onChange={(e) => set('description', { ...form.description, en: e.target.value })} rows={4} />
            <Textarea label={T.services.desc_ar} value={form.description?.ar || ''} onChange={(e) => set('description', { ...form.description, ar: e.target.value })} rows={4} dir="rtl" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm">{T.common.settings}</h3>
            <Select label={T.common.status} value={form.active ? 'active' : 'inactive'} onChange={(e) => set('active', e.target.value === 'active')}
              options={[{ value: 'active', label: T.services.active }, { value: 'inactive', label: T.services.inactive }]} />
            <Input label={T.services.order_index} type="number" value={String(form.order_index ?? 0)}
              onChange={(e) => set('order_index', parseInt(e.target.value) || 0)} hint={T.services.order_hint} />
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm">{T.common.media}</h3>
            <FileUpload label={T.services.icon} accept="image/*,.svg"
              onFile={(f) => handleUpload(f, 'icon_url', setUploadingIcon)}
              preview={form.icon_url} onClear={() => set('icon_url', '')} hint={T.services.icon_hint} />
            {uploadingIcon && <p className="text-xs text-brand-500 animate-pulse">{T.common.uploading}</p>}
            <Input label={T.services.icon_url} value={form.icon_url || ''} onChange={(e) => set('icon_url', e.target.value)} placeholder={T.common.or_paste_url} />

            <FileUpload label={T.services.feature_image} accept="image/*"
              onFile={(f) => handleUpload(f, 'image_url', setUploadingImage)}
              preview={form.image_url} onClear={() => set('image_url', '')} hint="JPG, PNG, WebP" />
            {uploadingImage && <p className="text-xs text-brand-500 animate-pulse">{T.common.uploading}</p>}
            <Input label={T.services.image_url} value={form.image_url || ''} onChange={(e) => set('image_url', e.target.value)} placeholder={T.common.or_paste_url} />
          </div>

          <div className="flex gap-2">
            <Button type="submit" loading={saveMutation.isPending} disabled={uploadingIcon || uploadingImage} className="flex-1">
              {isEdit ? T.services.update : T.services.create}
            </Button>
            <Link to="/services"><Button type="button" variant="secondary">{T.common.cancel}</Button></Link>
          </div>
        </div>
      </div>
    </form>
  );
}
