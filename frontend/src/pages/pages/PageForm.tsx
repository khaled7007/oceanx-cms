import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pagesApi } from '../../api/pages';
import { Page, ContentSection } from '../../types';
import Button from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const emptyPage: Partial<Page> = {
  slug: '', title_en: '', title_ar: '', sections: [],
  meta_title: '', meta_description: '', meta_keywords: '', status: 'draft',
};

const SECTION_TYPES = ['hero', 'text', 'image', 'cta', 'contact_form', 'team', 'stats'];

export default function PageForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<Partial<Page>>(emptyPage);

  const { data: existing, isLoading } = useQuery({
    queryKey: ['page', id],
    queryFn: () => pagesApi.get(id!).then((r) => r.data),
    enabled: isEdit,
  });

  useEffect(() => { if (existing) setForm(existing); }, [existing]);
  const set = (field: keyof Page, value: unknown) => setForm((f) => ({ ...f, [field]: value }));

  const addSection = () => {
    const sections = [...(form.sections || []), { type: 'text', title_en: '', body_en: '' }];
    set('sections', sections);
  };

  const updateSection = (idx: number, field: string, value: string) => {
    const sections = (form.sections || []).map((s, i) => i === idx ? { ...s, [field]: value } : s);
    set('sections', sections);
  };

  const removeSection = (idx: number) => {
    set('sections', (form.sections || []).filter((_, i) => i !== idx));
  };

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Page>) =>
      isEdit ? pagesApi.update(id!, data) : pagesApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Page updated' : 'Page created');
      qc.invalidateQueries({ queryKey: ['pages'] });
      navigate('/pages');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Save failed';
      toast.error(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.slug?.trim() || !form.title_en?.trim()) {
      toast.error('Slug and English title are required');
      return;
    }
    const slug = form.slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    saveMutation.mutate({ ...form, slug });
  };

  if (isLoading) return <div className="flex justify-center p-8"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" /></div>;

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
      <Link to="/pages" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeftIcon className="w-4 h-4" /> Back to Pages
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900">Page Info</h3>
            <Input label="Title (English) *" value={form.title_en || ''} onChange={(e) => set('title_en', e.target.value)} required />
            <Input label="Title (Arabic)" value={form.title_ar || ''} onChange={(e) => set('title_ar', e.target.value)} dir="rtl" />
            <Input
              label="Slug *"
              value={form.slug || ''}
              onChange={(e) => set('slug', e.target.value)}
              placeholder="about-us"
              hint="URL path: /about-us — lowercase, hyphens only"
            />
          </div>

          {/* Sections */}
          <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Content Sections</h3>
              <Button type="button" variant="secondary" size="sm" onClick={addSection}>
                <PlusIcon className="w-4 h-4" /> Add Section
              </Button>
            </div>
            {(form.sections || []).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No sections yet. Add one above.</p>
            )}
            {(form.sections || []).map((section: ContentSection, idx: number) => (
              <div key={idx} className="border border-gray-100 rounded-lg p-4 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <select
                    value={section.type}
                    onChange={(e) => updateSection(idx, 'type', e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none"
                  >
                    {SECTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button type="button" onClick={() => removeSection(idx)} className="text-red-400 hover:text-red-600">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
                <Input placeholder="Section title (EN)" value={String(section.title_en || '')} onChange={(e) => updateSection(idx, 'title_en', e.target.value)} />
                <Input placeholder="عنوان القسم (AR)" value={String(section.title_ar || '')} onChange={(e) => updateSection(idx, 'title_ar', e.target.value)} dir="rtl" />
                <Textarea placeholder="Body (EN)" value={String(section.body_en || '')} onChange={(e) => updateSection(idx, 'body_en', e.target.value)} />
                <Textarea placeholder="المحتوى (AR)" value={String(section.body_ar || '')} onChange={(e) => updateSection(idx, 'body_ar', e.target.value)} dir="rtl" />
              </div>
            ))}
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
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm">SEO</h3>
            <Input label="Meta Title" value={form.meta_title || ''} onChange={(e) => set('meta_title', e.target.value)} placeholder="Page title for search engines" />
            <Textarea label="Meta Description" value={form.meta_description || ''} onChange={(e) => set('meta_description', e.target.value)} placeholder="Brief description for search engines" rows={3} />
            <Input label="Meta Keywords" value={form.meta_keywords || ''} onChange={(e) => set('meta_keywords', e.target.value)} placeholder="ocean, research, saudi" />
          </div>

          <div className="flex gap-2">
            <Button type="submit" loading={saveMutation.isPending} className="flex-1">
              {isEdit ? 'Update Page' : 'Create Page'}
            </Button>
            <Link to="/pages"><Button type="button" variant="secondary">Cancel</Button></Link>
          </div>
        </div>
      </div>
    </form>
  );
}
