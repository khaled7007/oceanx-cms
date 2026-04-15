import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from '../../api/reports';
import { categoriesApi } from '../../api/categories';
import { CreateReportDto, ReportStatus } from '../../types';
import Button from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import FileUpload from '../../components/ui/FileUpload';
import { useLang } from '../../contexts/LanguageContext';
import { uploadFile, deleteFile } from '../../services/storage.service';
import { mediaApi } from '../../api/media';
import { galleryApi } from '../../api/gallery';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, ArrowRightIcon, DocumentArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline';

const STATUS_OPTIONS = Object.values(ReportStatus);

const defaultForm: CreateReportDto = {
  title: { en: '' },
  categories: [],
  date: '',
  status: ReportStatus.Draft,
  cover_image: '',
  file_url: '',
};

export default function ReportForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { T, lang } = useLang();
  const isAr = lang === 'ar';
  const BackIcon = isAr ? ArrowRightIcon : ArrowLeftIcon;

  const [form, setForm] = useState<CreateReportDto>(defaultForm);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  const { data: existing, isLoading } = useQuery({
    queryKey: ['report', id],
    queryFn: () => reportsApi.get(id!).then((r) => r.data),
    enabled: isEdit,
  });

  const { data: allCategories } = useQuery({
    queryKey: ['categories-all'],
    queryFn: () => categoriesApi.listAll().then((r) => r.data),
  });

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title,
        categories: existing.categories,
        date: existing.date ?? '',
        status: existing.status,
        cover_image: existing.cover_image ?? '',
        file_url: existing.file_url ?? '',
      });
    }
  }, [existing]);

  const set = <K extends keyof CreateReportDto>(field: K, value: CreateReportDto[K]) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleFileUpload = async (file: File) => {
    setUploadProgress(0);
    try {
      const path = `reports/${Date.now()}_${file.name}`;
      const url = await uploadFile(file, path, setUploadProgress);
      await galleryApi.addToGallery(url, 'reports');
      set('file_url', url);
      toast.success(T.common.uploaded);
    } catch {
      toast.error(T.common.upload_failed);
    } finally {
      setUploadProgress(null);
    }
  };

  const handleCoverUpload = async (file: File) => {
    setUploadingCover(true);
    try {
      const res = await mediaApi.upload(file, 'reports');
      set('cover_image', res.data.url);
      toast.success(T.common.uploaded);
    } catch {
      toast.error(T.common.upload_failed);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleFileClear = async () => {
    if (form.file_url) {
      try {
        await deleteFile(form.file_url);
      } catch {
        toast.error(T.common.upload_failed);
      }
    }
    set('file_url', '');
  };

  const saveMutation = useMutation({
    mutationFn: (data: CreateReportDto) =>
      isEdit ? reportsApi.update(id!, data) : reportsApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? T.reports.update : T.reports.create);
      qc.invalidateQueries({ queryKey: ['reports'] });
      navigate('/reports');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Something went wrong';
      toast.error(msg);
    },
  });

  const toggleCategory = (catName: string) => {
    if (form.categories.includes(catName)) {
      set('categories', form.categories.filter((c) => c !== catName));
    } else {
      set('categories', [...form.categories, catName]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.en.trim()) { toast.error('English title is required'); return; }
    saveMutation.mutate(form);
  };

  const statusOptions = STATUS_OPTIONS.map((s) => ({
    value: s,
    label: (T.common[s as keyof typeof T.common] as string) ?? s,
  }));

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      <Link to="/reports" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <BackIcon className="w-4 h-4" /> {T.reports.back}
      </Link>

      <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="font-semibold text-gray-900">{T.common.content}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={`${T.common.title_en} *`}
            value={form.title.en}
            onChange={(e) => set('title', { ...form.title, en: e.target.value })}
            required
          />
          <Input
            label={T.common.title_ar}
            value={form.title.ar ?? ''}
            onChange={(e) => set('title', { ...form.title, ar: e.target.value })}
            dir="rtl"
          />
        </div>

        <Input
          label={T.common.date}
          type="date"
          value={form.date ?? ''}
          onChange={(e) => set('date', e.target.value)}
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">{T.reports.categories}</label>
          <div className="flex flex-wrap gap-2">
            {(allCategories ?? []).map((cat) => {
              const selected = form.categories.includes(cat.name.en);
              return (
                <button key={cat.id} type="button" onClick={() => toggleCategory(cat.name.en)}
                  className={`px-2.5 py-1 rounded-lg text-sm border transition-colors ${
                    selected
                      ? 'bg-brand-50 border-brand-300 text-brand-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {isAr ? (cat.name.ar || cat.name.en) : cat.name.en}
                  {selected && <XMarkIcon className="w-3.5 h-3.5 inline ml-1" />}
                </button>
              );
            })}
            {(!allCategories || allCategories.length === 0) && (
              <span className="text-xs text-gray-400">{T.categories.no_results}</span>
            )}
          </div>
        </div>

        <Select
          label={T.common.status}
          value={form.status}
          onChange={(e) => set('status', e.target.value as ReportStatus)}
          options={statusOptions}
        />
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm space-y-3">
        <h3 className="font-semibold text-gray-900">{T.reports.cover}</h3>
        <FileUpload accept="image/*" onFile={handleCoverUpload} preview={form.cover_image}
          onClear={() => set('cover_image', '')} hint="JPG, PNG, WebP" />
        {uploadingCover && <p className="text-xs text-brand-500 animate-pulse">{T.common.uploading}</p>}
        <Input label={T.reports.cover_url} value={form.cover_image || ''} onChange={(e) => set('cover_image', e.target.value)} placeholder={T.common.or_paste_url} />
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <DocumentArrowUpIcon className="w-5 h-5 text-gray-400" />
          {T.reports.pdf}
        </h3>

        {form.file_url ? (
          <div className="flex items-center justify-between gap-3 px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50">
            <a
              href={form.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-brand-600 hover:underline truncate"
            >
              <DocumentArrowUpIcon className="w-4 h-4 shrink-0" />
              <span className="truncate">{decodeURIComponent(form.file_url.split('/').pop()?.split('?')[0] ?? 'file')}</span>
            </a>
            <button
              type="button"
              onClick={handleFileClear}
              className="shrink-0 text-gray-400 hover:text-red-500"
              title="Remove file"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <FileUpload
            label={T.reports.pdf}
            accept=".pdf,application/pdf"
            onFile={handleFileUpload}
            hint="PDF — max 20 MB"
          />
        )}

        {uploadProgress !== null && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>{T.common.uploading}</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-brand-500 h-1.5 rounded-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="submit" loading={saveMutation.isPending} disabled={uploadProgress !== null || uploadingCover} className="flex-1">
          {isEdit ? T.reports.update : T.reports.create}
        </Button>
        <Link to="/reports">
          <Button type="button" variant="secondary">{T.common.cancel}</Button>
        </Link>
      </div>
    </form>
  );
}

