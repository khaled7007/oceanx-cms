import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesApi } from '../../api/services';
import { mediaApi } from '../../api/media';
import { Service } from '../../types';
import Button from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import FileUpload from '../../components/ui/FileUpload';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const emptyService: Partial<Service> = {
  title_en: '', title_ar: '', description_en: '', description_ar: '',
  icon_url: '', image_url: '', order_index: 0, active: true,
};

export default function ServiceForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
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
    mutationFn: (data: Partial<Service>) =>
      isEdit ? servicesApi.update(id!, data) : servicesApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Service updated' : 'Service created');
      qc.invalidateQueries({ queryKey: ['services'] });
      navigate('/services');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Save failed';
      toast.error(msg);
    },
  });

  const handleUpload = async (file: File, field: 'icon_url' | 'image_url', setUploading: (v: boolean) => void) => {
    setUploading(true);
    try {
      const res = await mediaApi.upload(file, ['service']);
      set(field, res.data.url);
      toast.success('File uploaded');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title_en?.trim()) { toast.error('English title is required'); return; }
    saveMutation.mutate(form);
  };

  if (isLoading) return <div className="flex justify-center p-8"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" /></div>;

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <Link to="/services" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeftIcon className="w-4 h-4" /> Back to Services
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900">Service Details</h3>
            <Input label="Title (English) *" value={form.title_en || ''} onChange={(e) => set('title_en', e.target.value)} required />
            <Input label="Title (Arabic)" value={form.title_ar || ''} onChange={(e) => set('title_ar', e.target.value)} dir="rtl" />
            <Textarea label="Description (English)" value={form.description_en || ''} onChange={(e) => set('description_en', e.target.value)} rows={4} />
            <Textarea label="Description (Arabic)" value={form.description_ar || ''} onChange={(e) => set('description_ar', e.target.value)} rows={4} dir="rtl" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm">Settings</h3>
            <Select
              label="Status"
              value={form.active ? 'active' : 'inactive'}
              onChange={(e) => set('active', e.target.value === 'active')}
              options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
            />
            <Input
              label="Order Index"
              type="number"
              value={String(form.order_index ?? 0)}
              onChange={(e) => set('order_index', parseInt(e.target.value) || 0)}
              hint="Lower = higher priority"
            />
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm">Media</h3>
            <FileUpload label="Icon" accept="image/*,.svg"
              onFile={(f) => handleUpload(f, 'icon_url', setUploadingIcon)}
              preview={form.icon_url} onClear={() => set('icon_url', '')} hint="SVG or PNG, 64x64" />
            {uploadingIcon && <p className="text-xs text-brand-500 animate-pulse">Uploading…</p>}
            <Input label="Icon URL" value={form.icon_url || ''} onChange={(e) => set('icon_url', e.target.value)} placeholder="Or paste URL" />

            <FileUpload label="Feature Image" accept="image/*"
              onFile={(f) => handleUpload(f, 'image_url', setUploadingImage)}
              preview={form.image_url} onClear={() => set('image_url', '')} hint="JPG, PNG, WebP" />
            {uploadingImage && <p className="text-xs text-brand-500 animate-pulse">Uploading…</p>}
            <Input label="Image URL" value={form.image_url || ''} onChange={(e) => set('image_url', e.target.value)} placeholder="Or paste URL" />
          </div>

          <div className="flex gap-2">
            <Button type="submit" loading={saveMutation.isPending} disabled={uploadingIcon || uploadingImage} className="flex-1">
              {isEdit ? 'Update Service' : 'Create Service'}
            </Button>
            <Link to="/services"><Button type="button" variant="secondary">Cancel</Button></Link>
          </div>
        </div>
      </div>
    </form>
  );
}
