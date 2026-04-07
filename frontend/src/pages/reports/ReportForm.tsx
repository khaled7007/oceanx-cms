import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from '../../api/reports';
import { CreateReportDto, ReportStatus } from '../../types';
import Button from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import FileUpload from '../../components/ui/FileUpload';
import { useLang } from '../../contexts/LanguageContext';
import { uploadFile, deleteFile } from '../../services/storage.service';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, ArrowRightIcon, DocumentArrowUpIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

const STATUS_OPTIONS = Object.values(ReportStatus);

const defaultForm: CreateReportDto = {
  title: { en: '' },
  author: { en: '' },
  tags: [],
  status: ReportStatus.Draft,
  file_url: '',
};

export default function ReportForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { T, lang } = useLang();
  const BackIcon = lang === 'ar' ? ArrowRightIcon : ArrowLeftIcon;

  const [form, setForm] = useState<CreateReportDto>(defaultForm);
  const [tagInput, setTagInput] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const { data: existing, isLoading } = useQuery({
    queryKey: ['report', id],
    queryFn: () => reportsApi.get(id!).then((r) => r.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title,
        author: existing.author,
        tags: existing.tags,
        status: existing.status,
        file_url: existing.file_url ?? '',
      });
      setTagInput('');
    }
  }, [existing]);

  const set = <K extends keyof CreateReportDto>(field: K, value: CreateReportDto[K]) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleFileUpload = async (file: File) => {
    setUploadProgress(0);
    try {
      const path = `reports/${Date.now()}_${file.name}`;
      const url = await uploadFile(file, path, setUploadProgress);
      set('file_url', url);
      toast.success(T.common.uploaded);
    } catch {
      toast.error(T.common.upload_failed);
    } finally {
      setUploadProgress(null);
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

  const addTag = () => {
    const value = tagInput.trim();
    if (value && !form.tags.includes(value)) {
      set('tags', [...form.tags, value]);
    }
    setTagInput('');
  };

  const removeTag = (index: number) => {
    set('tags', form.tags.filter((_, i) => i !== index));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.en.trim()) { toast.error('English title is required'); return; }
    // Include any unsaved tag input
    const finalTags = tagInput.trim() && !form.tags.includes(tagInput.trim())
      ? [...form.tags, tagInput.trim()]
      : form.tags;
    saveMutation.mutate({ ...form, tags: finalTags });
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
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={T.common.author + ' (EN)'}
            value={form.author.en}
            onChange={(e) => set('author', { ...form.author, en: e.target.value })}
          />
          <Input
            label={T.common.author + ' (AR)'}
            value={form.author.ar ?? ''}
            onChange={(e) => set('author', { ...form.author, ar: e.target.value })}
            dir="rtl"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">{T.reports.tags_hint}</label>
          <div className="flex flex-wrap gap-2">
            {form.tags.map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-50 text-brand-700 rounded-lg text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(i)}
                  className="text-brand-400 hover:text-red-500"
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
            <div className="flex items-center gap-1">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={form.tags.length === 0 ? 'Add a tag...' : ''}
                className="px-2.5 py-1 text-sm border border-gray-200 rounded-lg w-32 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={addTag}
                disabled={!tagInput.trim()}
                className="p-1 rounded-lg text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <Select
          label={T.common.status}
          value={form.status}
          onChange={(e) => set('status', e.target.value as ReportStatus)}
          options={statusOptions}
        />
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
        <Button type="submit" loading={saveMutation.isPending} disabled={uploadProgress !== null} className="flex-1">
          {isEdit ? T.reports.update : T.reports.create}
        </Button>
        <Link to="/reports">
          <Button type="button" variant="secondary">{T.common.cancel}</Button>
        </Link>
      </div>
    </form>
  );
}

