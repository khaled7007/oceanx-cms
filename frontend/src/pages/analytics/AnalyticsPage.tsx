import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '../../api/analytics';
import { Analytics } from '../../types';
import Button from '../../components/ui/Button';
import { useLang } from '../../contexts/LanguageContext';
import { usePermissions } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  BriefcaseIcon,
  UserGroupIcon,
  BuildingOffice2Icon,
  GlobeAltIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

const defaults: Analytics = {
  projects_delivered: 0,
  clients: 0,
  partners: 0,
  sectors_served: 0,
  years_of_experience: 0,
};

export default function AnalyticsPage() {
  const qc = useQueryClient();
  const { T } = useLang();
  const { canWrite } = usePermissions();
  const [form, setForm] = useState<Analytics>(defaults);

  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => analyticsApi.get().then((r) => r.data),
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (dto: Analytics) => analyticsApi.save(dto),
    onSuccess: () => {
      toast.success(T.analytics.saved);
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: () => toast.error('!'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  const set = (field: keyof Analytics, value: string) =>
    setForm((f) => ({ ...f, [field]: parseInt(value) || 0 }));

  if (isLoading)
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );

  const fields: { key: keyof Analytics; label: string; icon: React.ElementType }[] = [
    { key: 'projects_delivered', label: T.analytics.projects_delivered, icon: BriefcaseIcon },
    { key: 'clients', label: T.analytics.clients, icon: UserGroupIcon },
    { key: 'partners', label: T.analytics.partners, icon: BuildingOffice2Icon },
    { key: 'sectors_served', label: T.analytics.sectors_served, icon: GlobeAltIcon },
    { key: 'years_of_experience', label: T.analytics.years_of_experience, icon: CalendarDaysIcon },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{T.analytics.title}</h1>
        <p className="text-sm text-gray-500 mt-1">{T.analytics.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fields.map(({ key, label, icon: Icon }) => (
            <div key={key} className="bg-white rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <label className="text-sm font-medium text-gray-700">{label}</label>
              </div>
              <input
                type="number"
                min={0}
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
                disabled={!canWrite}
                className="w-full text-2xl font-bold text-gray-900 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 text-center disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          {canWrite && (
            <Button type="submit" loading={saveMutation.isPending}>
              {T.analytics.save}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
