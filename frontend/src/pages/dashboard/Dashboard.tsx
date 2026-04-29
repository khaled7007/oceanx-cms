import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi } from '../../api/dashboard';
import { contactInfoApi } from '../../api/analytics';
import { ContactInfo } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { StatusBadge } from '../../components/ui/Badge';
import { Link } from 'react-router-dom';
import { useLang } from '../../contexts/LanguageContext';
import { usePermissions } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import toast from 'react-hot-toast';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  to: string;
}

function StatCard({ label, value, sub, color, to }: StatCardProps) {
  return (
    <Link to={to} className={`block bg-white rounded-xl p-5 shadow-sm border-s-4 ${color} hover:shadow-md transition-shadow`}>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </Link>
  );
}

export default function Dashboard() {
  const { T, lang } = useLang();
  const locale = lang === 'ar' ? ar : enUS;
  const qc = useQueryClient();
  const { canWrite } = usePermissions();

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats().then((r) => r.data),
  });

  // ── Contact Information ──────────────────────────────────
  const contactDefaults: ContactInfo = { email: '', phone: '', working_hours: { en: '', ar: '' } };
  const [contactForm, setContactForm] = useState<ContactInfo>(contactDefaults);

  const { data: contactData } = useQuery({
    queryKey: ['contact-info'],
    queryFn: () => contactInfoApi.get().then((r) => r.data),
  });

  useEffect(() => { if (contactData) setContactForm(contactData); }, [contactData]);

  const contactMutation = useMutation({
    mutationFn: (dto: ContactInfo) => contactInfoApi.save(dto),
    onSuccess: () => { toast.success(T.dashboard.contact_saved); qc.invalidateQueries({ queryKey: ['contact-info'] }); },
    onError: () => toast.error('!'),
  });

  const setContact = (field: keyof ContactInfo, value: unknown) =>
    setContactForm((f) => ({ ...f, [field]: value }));

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-5 h-28 animate-pulse border-s-4 border-gray-100" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-red-500 text-sm">Failed to load dashboard statistics.</p>;
  }

  const { counts, recent_activity } = data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3">{T.dashboard.content_overview}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label={T.nav.reports} value={counts.reports.total}
            sub={T.dashboard.published_sub(counts.reports.published, counts.reports.draft)}
            color="border-blue-500" to="/reports" />
          <StatCard label={T.nav.articles} value={counts.articles.total}
            sub={T.dashboard.featured_sub(counts.articles.published, counts.articles.featured)}
            color="border-purple-500" to="/articles" />
          <StatCard label={T.nav.pages} value={counts.pages.total}
            sub={`${counts.pages.published} ${T.common.published}`}
            color="border-green-500" to="/pages" />
          <StatCard label={T.nav.news} value={counts.news.total}
            sub={`${counts.news.published} ${T.common.published}`}
            color="border-yellow-500" to="/news" />
          <StatCard label={T.nav.services} value={counts.services.total}
            sub={T.dashboard.active_sub(counts.services.active)}
            color="border-teal-500" to="/services" />
          <StatCard label={T.nav.media} value={counts.media.total}
            sub={counts.media.total_size ? T.dashboard.size_sub(counts.media.total_size) : undefined}
            color="border-orange-500" to="/media" />
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3">{T.dashboard.recent_activity}</h2>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {recent_activity.length === 0 ? (
            <p className="text-sm text-gray-400 p-6 text-center">{T.dashboard.no_activity}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-start font-medium text-gray-500">{T.dashboard.type}</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-500">{T.common.title}</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-500">{T.common.status}</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-500">{T.common.created}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recent_activity.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900 max-w-xs truncate">{item.title}</td>
                    <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                    <td className="px-4 py-3 text-gray-400">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale })}
                    </td>
                  </tr>
                ))}
               </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3">{T.dashboard.contact_info}</h2>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <form
            onSubmit={(e) => { e.preventDefault(); contactMutation.mutate(contactForm); }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={T.dashboard.contact_email}
                type="email"
                value={contactForm.email}
                onChange={(e) => setContact('email', e.target.value)}
                disabled={!canWrite}
              />
              <Input
                label={T.dashboard.contact_phone}
                value={contactForm.phone}
                onChange={(e) => setContact('phone', e.target.value)}
                disabled={!canWrite}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={T.dashboard.contact_working_hours_en}
                value={contactForm.working_hours.en}
                onChange={(e) => setContact('working_hours', { ...contactForm.working_hours, en: e.target.value })}
                disabled={!canWrite}
              />
              <Input
                label={T.dashboard.contact_working_hours_ar}
                value={contactForm.working_hours.ar}
                onChange={(e) => setContact('working_hours', { ...contactForm.working_hours, ar: e.target.value })}
                dir="rtl"
                disabled={!canWrite}
              />
            </div>
            {canWrite && (
              <div className="flex justify-end">
                <Button type="submit" loading={contactMutation.isPending}>
                  {T.dashboard.contact_save}
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
