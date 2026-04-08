import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pagesApi } from '../../api/pages';
import { Page, ContentSection } from '../../types';
import Button from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { useLang } from '../../contexts/LanguageContext';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, ArrowRightIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const emptyPage: Partial<Page> = {
  slug: '', title: { en: '' }, sections: [],
  meta_title: '', meta_description: '', meta_keywords: '', status: 'draft',
};
const SECTION_TYPES = ['hero', 'text', 'image', 'cta', 'contact_form', 'team', 'stats'];

export default function PageForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { T, lang } = useLang();
  const BackIcon = lang === 'ar' ? ArrowRightIcon : ArrowLeftIcon;
  const [form, setForm] = useState<Partial<Page>>(emptyPage);

  const { data: existing, isLoading } = useQuery({
    queryKey: ['page', id],
    queryFn: () => pagesApi.get(id!).then((r) => r.data),
    enabled: isEdit,
  });

  useEffect(() => { if (existing) setForm(existing); }, [existing]);
  const set = (field: keyof Page, value: unknown) => setForm((f) => ({ ...f, [field]: value }));

  const addSection = () => set('sections', [...(form.sections || []), { type: 'text', title: { en: '' }, body: { en: '' } }]);
  const updateSection = (idx: number, field: string, langOrValue: string, value?: string) =>
    set('sections', (form.sections || []).map((s, i) => {
      if (i !== idx) return s;
      if (value !== undefined) {
        const bilField = s[field] as Record<string, unknown> | undefined;
        return { ...s, [field]: { ...bilField, [langOrValue]: value } };
      }
      return { ...s, [field]: langOrValue };
    }));
  const removeSection = (idx: number) => set('sections', (form.sections || []).filter((_, i) => i !== idx));

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Page>) => isEdit ? pagesApi.update(id!, data) : pagesApi.create(data),
    onSuccess: () => { toast.success(isEdit ? T.pages.update : T.pages.create); qc.invalidateQueries({ queryKey: ['pages'] }); navigate('/pages'); },
    onError: (err: unknown) => { toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || '!'); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.slug?.trim() || !form.title?.en?.trim()) { toast.error('Slug and title are required'); return; }
    const slug = form.slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    saveMutation.mutate({ ...form, slug });
  };

  if (isLoading) return <div className="flex justify-center p-8"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" /></div>;

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      <Link to="/pages" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <BackIcon className="w-4 h-4" /> {T.pages.back}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="min-w-0 space-y-5">
          <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900">{T.pages.page_info}</h3>
            <Input label={`${T.common.title_en} *`} value={form.title?.en || ''} onChange={(e) => set('title', { ...form.title, en: e.target.value })} required />
            <Input label={T.common.title_ar} value={form.title?.ar || ''} onChange={(e) => set('title', { ...form.title, ar: e.target.value })} dir="rtl" />
            <Input label={`${T.pages.slug} *`} value={form.slug || ''} onChange={(e) => set('slug', e.target.value)} hint={T.pages.slug_hint} />
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{T.pages.sections}</h3>
              <Button type="button" variant="secondary" size="sm" onClick={addSection}>
                <PlusIcon className="w-4 h-4" /> {T.pages.add_section}
              </Button>
            </div>
            {(form.sections || []).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">{T.pages.no_sections}</p>
            )}
            {(form.sections || []).map((section: ContentSection, idx: number) => (
              <div key={idx} className="border border-gray-100 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <select value={section.type} onChange={(e) => updateSection(idx, 'type', e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none">
                    {SECTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button type="button" onClick={() => removeSection(idx)} className="text-red-400 hover:text-red-600">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
                <Input placeholder={T.pages.section_title_en} value={String(section.title?.en || '')} onChange={(e) => updateSection(idx, 'title', 'en', e.target.value)} />
                <Input placeholder={T.pages.section_title_ar} value={String(section.title?.ar || '')} onChange={(e) => updateSection(idx, 'title', 'ar', e.target.value)} dir="rtl" />
                <Textarea placeholder={T.pages.section_body_en} value={String(section.body?.en || '')} onChange={(e) => updateSection(idx, 'body', 'en', e.target.value)} />
                <Textarea placeholder={T.pages.section_body_ar} value={String(section.body?.ar || '')} onChange={(e) => updateSection(idx, 'body', 'ar', e.target.value)} dir="rtl" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm">{T.common.settings}</h3>
            <Select label={T.common.status} value={form.status || 'draft'} onChange={(e) => set('status', e.target.value)}
              options={[{ value: 'draft', label: T.common.draft }, { value: 'published', label: T.common.published }]} />
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm">{T.common.seo}</h3>
            <Input label={T.pages.meta_title} value={form.meta_title || ''} onChange={(e) => set('meta_title', e.target.value)} placeholder={T.pages.meta_title_hint} />
            <Textarea label={T.pages.meta_desc} value={form.meta_description || ''} onChange={(e) => set('meta_description', e.target.value)} placeholder={T.pages.meta_desc_hint} rows={3} />
            <Input label={T.pages.meta_keywords} value={form.meta_keywords || ''} onChange={(e) => set('meta_keywords', e.target.value)} placeholder={T.pages.meta_keywords_hint} />
          </div>

          <div className="flex gap-2">
            <Button type="submit" loading={saveMutation.isPending} className="flex-1">
              {isEdit ? T.pages.update : T.pages.create}
            </Button>
            <Link to="/pages"><Button type="button" variant="secondary">{T.common.cancel}</Button></Link>
          </div>
        </div>
      </div>
    </form>
  );
}
