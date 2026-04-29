import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { competenciesApi } from '../../api/competencies';
import { mediaApi } from '../../api/media';
import { Competency, CompetencyCategory } from '../../types';
import Button from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import FileUpload from '../../components/ui/FileUpload';
import { useLang } from '../../contexts/LanguageContext';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, ArrowRightIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

const emptyCompetency: Partial<Competency> = {
  name: { en: '' }, position: { en: '' }, photo: '',
  category: CompetencyCategory.BoardOfDirectors,
  department: { en: '' }, overview: { en: '' },
  experience: { en: [], ar: [] }, years_of_experience: 0, sort_order: 0, linkedin_url: '', enabled: true,
};

export default function CompetencyForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { T, lang } = useLang();
  const BackIcon = lang === 'ar' ? ArrowRightIcon : ArrowLeftIcon;
  const [form, setForm] = useState<Partial<Competency>>(emptyCompetency);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [expEnInput, setExpEnInput] = useState('');
  const [expArInput, setExpArInput] = useState('');

  const { data: existing, isLoading } = useQuery({
    queryKey: ['competency', id],
    queryFn: () => competenciesApi.get(id!).then((r) => r.data),
    enabled: isEdit,
  });

  useEffect(() => { if (existing) setForm(existing); }, [existing]);
  const set = (field: keyof Competency, value: unknown) => setForm((f) => ({ ...f, [field]: value }));

  const addExpEn = () => {
    const v = expEnInput.trim();
    if (v) { set('experience', { ...form.experience!, en: [...(form.experience?.en || []), v], ar: form.experience?.ar || [] }); setExpEnInput(''); }
  };
  const removeExpEn = (i: number) => set('experience', { ...form.experience!, en: (form.experience?.en || []).filter((_, idx) => idx !== i) });

  const addExpAr = () => {
    const v = expArInput.trim();
    if (v) { set('experience', { ...form.experience!, ar: [...(form.experience?.ar || []), v], en: form.experience?.en || [] }); setExpArInput(''); }
  };
  const removeExpAr = (i: number) => set('experience', { ...form.experience!, ar: (form.experience?.ar || []).filter((_, idx) => idx !== i) });

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Competency>) => isEdit ? competenciesApi.update(id!, data) : competenciesApi.create(data),
    onSuccess: () => { toast.success(isEdit ? T.competencies.update : T.competencies.create); qc.invalidateQueries({ queryKey: ['competencies'] }); navigate('/competencies'); },
    onError: (err: unknown) => { toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || '!'); },
  });

  const handleUpload = async (file: File) => {
    setUploadingPhoto(true);
    try { const res = await mediaApi.upload(file, 'competencies'); set('photo', res.data.url); toast.success(T.common.uploaded); }
    catch { toast.error(T.common.upload_failed); }
    finally { setUploadingPhoto(false); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.en?.trim()) { toast.error(T.competencies.name_required); return; }
    if (!form.position?.en?.trim()) { toast.error(T.competencies.position_required); return; }
    // Include any unsaved experience inputs
    const finalExpEn = expEnInput.trim() ? [...(form.experience?.en || []), expEnInput.trim()] : (form.experience?.en || []);
    const finalExpAr = expArInput.trim() ? [...(form.experience?.ar || []), expArInput.trim()] : (form.experience?.ar || []);
    saveMutation.mutate({ ...form, experience: { en: finalExpEn, ar: finalExpAr } });
  };

  if (isLoading) return <div className="flex justify-center p-8"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" /></div>;

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      <Link to="/competencies" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <BackIcon className="w-4 h-4" /> {T.competencies.back}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="min-w-0 space-y-5">
          {/* Basic Info */}
          <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900">{T.competencies.details}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label={`${T.competencies.name_en} *`} value={form.name?.en || ''} onChange={(e) => set('name', { ...form.name, en: e.target.value })} required />
              <Input label={T.competencies.name_ar} value={form.name?.ar || ''} onChange={(e) => set('name', { ...form.name, ar: e.target.value })} dir="rtl" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label={`${T.competencies.position_en} *`} value={form.position?.en || ''} onChange={(e) => set('position', { ...form.position, en: e.target.value })} required />
              <Input label={T.competencies.position_ar} value={form.position?.ar || ''} onChange={(e) => set('position', { ...form.position, ar: e.target.value })} dir="rtl" />
            </div>
            <Select label={T.competencies.category} value={form.category || CompetencyCategory.BoardOfDirectors}
              onChange={(e) => set('category', e.target.value)}
              options={[
                { value: CompetencyCategory.BoardOfDirectors, label: T.competencies.board_of_directors },
                { value: CompetencyCategory.ConsultingTeam, label: T.competencies.consulting_team },
              ]} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label={T.competencies.department_en} value={form.department?.en || ''} onChange={(e) => set('department', { ...form.department, en: e.target.value })} />
              <Input label={T.competencies.department_ar} value={form.department?.ar || ''} onChange={(e) => set('department', { ...form.department, ar: e.target.value })} dir="rtl" />
            </div>
            <Input label={T.competencies.linkedin} value={form.linkedin_url || ''} onChange={(e) => set('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/..." />
            <Input label={T.competencies.years_exp} type="number" value={String(form.years_of_experience ?? 0)} onChange={(e) => set('years_of_experience', parseInt(e.target.value) || 0)} />
            <Input label={T.competencies.sort_order} type="number" value={String(form.sort_order ?? 0)} onChange={(e) => set('sort_order', parseInt(e.target.value) || 0)} />
          </div>

          {/* Overview */}
          <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900">{T.competencies.overview}</h3>
            <Textarea label={T.competencies.overview_en} value={form.overview?.en || ''} onChange={(e) => set('overview', { ...form.overview, en: e.target.value })} rows={4} />
            <Textarea label={T.competencies.overview_ar} value={form.overview?.ar || ''} onChange={(e) => set('overview', { ...form.overview, ar: e.target.value })} rows={4} dir="rtl" />
          </div>

          {/* Experience EN */}
          <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900">{T.competencies.experience_en}</h3>
            <div className="flex flex-wrap gap-2">
              {(form.experience?.en || []).map((item, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-50 text-brand-700 rounded-lg text-sm">
                  {item}
                  <button type="button" onClick={() => removeExpEn(i)} className="text-brand-400 hover:text-red-500">
                    <XMarkIcon className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1">
                <input value={expEnInput} onChange={(e) => setExpEnInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addExpEn(); } }}
                  placeholder={(form.experience?.en || []).length === 0 ? T.competencies.add_experience_en : ''}
                  className="px-2.5 py-1 text-sm border border-gray-200 rounded-lg w-48 focus:outline-none focus:ring-2 focus:ring-brand-500" />
                <button type="button" onClick={addExpEn} disabled={!expEnInput.trim()}
                  className="p-1 rounded-lg text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed">
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Experience AR */}
          <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900">{T.competencies.experience_ar}</h3>
            <div className="flex flex-wrap gap-2" dir="rtl">
              {(form.experience?.ar || []).map((item, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-50 text-brand-700 rounded-lg text-sm">
                  {item}
                  <button type="button" onClick={() => removeExpAr(i)} className="text-brand-400 hover:text-red-500">
                    <XMarkIcon className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1">
                <input value={expArInput} onChange={(e) => setExpArInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addExpAr(); } }}
                  placeholder={(form.experience?.ar || []).length === 0 ? T.competencies.add_experience_ar : ''}
                  className="px-2.5 py-1 text-sm border border-gray-200 rounded-lg w-48 focus:outline-none focus:ring-2 focus:ring-brand-500" dir="rtl" />
                <button type="button" onClick={addExpAr} disabled={!expArInput.trim()}
                  className="p-1 rounded-lg text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed">
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm">{T.competencies.photo_label}</h3>
            <FileUpload label={T.competencies.photo_label} accept="image/*"
              onFile={(f) => handleUpload(f)}
              preview={form.photo} onClear={() => set('photo', '')} hint="JPG, PNG, WebP" />
            {uploadingPhoto && <p className="text-xs text-brand-500 animate-pulse">{T.common.uploading}</p>}
            <Input label={T.competencies.photo_url} value={form.photo || ''} onChange={(e) => set('photo', e.target.value)} placeholder={T.common.or_paste_url} />
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-gray-700">{T.competencies.enabled}</span>
              <button
                type="button"
                dir="ltr"
                onClick={() => set('enabled', !form.enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.enabled !== false ? 'bg-brand-500' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.enabled !== false ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </label>
          </div>

          <div className="flex gap-2">
            <Button type="submit" loading={saveMutation.isPending} disabled={uploadingPhoto} className="flex-1">
              {isEdit ? T.competencies.update : T.competencies.create}
            </Button>
            <Link to="/competencies"><Button type="button" variant="secondary">{T.common.cancel}</Button></Link>
          </div>
        </div>
      </div>
    </form>
  );
}
