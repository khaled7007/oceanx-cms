import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationsApi } from '../../api/applications';
import { Application, ApplicationType, ApplicationGender } from '../../types';
import { ConfirmModal } from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import toast from 'react-hot-toast';
import { differenceInYears, format } from 'date-fns';
import {
  MagnifyingGlassIcon,
  TrashIcon,
  XMarkIcon,
  EnvelopeIcon,
  PhoneIcon,
  DocumentArrowDownIcon,
  LinkIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { ApplicationQueryParams } from '../../services/applications.service';
import { useLang } from '../../contexts/LanguageContext';

const TYPE_COLORS: Record<ApplicationType, { bg: string; text: string; dot: string; banner: string }> = {
  cooperative_training: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-400',
    banner: 'from-amber-500 to-orange-500',
  },
  open_application: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-400',
    banner: 'from-blue-500 to-cyan-500',
  },
  cv_submission: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-400',
    banner: 'from-emerald-500 to-teal-500',
  },
  leadership_program: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    dot: 'bg-purple-400',
    banner: 'from-purple-500 to-indigo-500',
  },
};

const ALL_TYPES: ApplicationType[] = [
  'cooperative_training',
  'open_application',
  'cv_submission',
  'leadership_program',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcAge(dob: string) {
  if (!dob) return null;
  try {
    return differenceInYears(new Date(), new Date(dob));
  } catch {
    return null;
  }
}

function getInitials(name: Application['name']) {
  const words = (name.en || name.ar || '').split(' ').filter(Boolean);
  return words
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function avatarGradient(type: ApplicationType) {
  return `bg-gradient-to-br ${TYPE_COLORS[type].banner}`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: ApplicationType }) {
  const { T } = useLang();
  const c = TYPE_COLORS[type];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {T.applies.types[type]}
    </span>
  );
}

function GenderBadge({ gender }: { gender: ApplicationGender }) {
  const { T } = useLang();
  return gender === 'F' ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-pink-50 text-pink-600">
      ♀ {T.applies.genders.F}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-600">
      ♂ {T.applies.genders.M}
    </span>
  );
}

// ─── Slide-over detail panel ─────────────────────────────────────────────────

function DetailPanel({
  app,
  onClose,
  onDelete,
}: {
  app: Application;
  onClose: () => void;
  onDelete: (a: Application) => void;
}) {
  const { T, lang } = useLang();
  const age = calcAge(app.dob);
  const colors = TYPE_COLORS[app.type];

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-md bg-white shadow-2xl overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header banner */}
        <div className={`bg-gradient-to-r ${colors.banner} p-6 text-white`}>
          <div className="flex items-start justify-between mb-4">
            <div className={`w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold`}>
              {getInitials(app.name)}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <h2 className="text-xl font-bold">{lang === 'ar' ? (app.name.ar || app.name.en) : app.name.en}</h2>
          {app.name.ar && app.name.en && (
            <p className="text-white/80 text-sm mt-0.5" dir={lang === 'ar' ? 'ltr' : 'rtl'}>
              {lang === 'ar' ? app.name.en : app.name.ar}
            </p>
          )}
          <p className="text-white/90 text-sm mt-1 font-medium">{app.specialization}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <TypeBadge type={app.type} />
            <GenderBadge gender={app.gender} />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 space-y-5">
          {/* Contact */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {T.applies.contact}
            </h3>
            <div className="space-y-2.5">
              <a
                href={`mailto:${app.email}`}
                className="flex items-center gap-3 text-sm text-gray-700 hover:text-brand-600 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <EnvelopeIcon className="w-4 h-4 text-gray-500" />
                </div>
                {app.email}
              </a>
              <a
                href={`tel:${app.phone}`}
                className="flex items-center gap-3 text-sm text-gray-700 hover:text-brand-600 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <PhoneIcon className="w-4 h-4 text-gray-500" />
                </div>
                {app.phone}
              </a>
            </div>
          </section>

          {/* Personal */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {T.applies.personal_info}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500">{T.common.date}</span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {app.dob ? format(new Date(app.dob), 'MMM d, yyyy') : '—'}
                </p>
                {age !== null && (
                  <p className="text-xs text-gray-400 mt-0.5">{T.applies.age(age)}</p>
                )}
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <UserIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500">{T.applies.genders[app.gender]}</span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {T.applies.genders[app.gender]}
                </p>
              </div>
            </div>
          </section>

          {/* Experience */}
          {app.experience && (
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {T.applies.experience}
              </h3>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                  <BriefcaseIcon className="w-4 h-4 text-gray-500" />
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{app.experience}</p>
              </div>
            </section>
          )}

          {/* Applied */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {T.applies.applied}
            </h3>
            <p className="text-sm text-gray-500">
              {format(new Date(app.created_at), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </section>

          {/* Links */}
          {(app.cv || app.links) && (
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {T.applies.attachments}
              </h3>
              <div className="flex flex-col gap-2">
                {app.cv && (
                  <a
                    href={app.cv}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-gray-200 hover:border-brand-400 hover:bg-brand-50 transition-colors text-sm font-medium text-gray-700 hover:text-brand-700"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4" />
                    {T.applies.view_cv}
                  </a>
                )}
                {app.links && (
                  <a
                    href={app.links}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-gray-200 hover:border-brand-400 hover:bg-brand-50 transition-colors text-sm font-medium text-gray-700 hover:text-brand-700"
                  >
                    <LinkIcon className="w-4 h-4" />
                    {T.applies.portfolio}
                  </a>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => onDelete(app)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors text-sm font-medium"
          >
            <TrashIcon className="w-4 h-4" />
            {T.applies.delete_btn}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Application Card ──────────────────────────────────────────────────────

function AppCard({
  app,
  onClick,
  onDelete,
}: {
  app: Application;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const { lang } = useLang();
  const age = calcAge(app.dob);
  const colors = TYPE_COLORS[app.type];

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
    >
      {/* Color bar top */}
      <div className={`h-1.5 bg-gradient-to-r ${colors.banner}`} />

      <div className="p-5">
        {/* Avatar + type */}
        <div className="flex items-start justify-between mb-4">
          <div
            className={`w-12 h-12 rounded-xl ${avatarGradient(app.type)} flex items-center justify-center text-white font-bold text-lg shrink-0`}
          >
            {getInitials(app.name)}
          </div>
          <div className="flex items-center gap-1.5">
            <GenderBadge gender={app.gender} />
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
            >
              <TrashIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Name */}
        <div className="mb-1">
          <p className="font-semibold text-gray-900 truncate">
            {lang === 'ar' ? (app.name.ar || app.name.en) : app.name.en}
          </p>
          {app.name.ar && app.name.en && (
            <p className="text-xs text-gray-400 truncate" dir={lang === 'ar' ? 'ltr' : 'rtl'}>
              {lang === 'ar' ? app.name.en : app.name.ar}
            </p>
          )}
        </div>

        {/* Specialization */}
        <p className="text-sm text-brand-600 font-medium truncate mb-3">{app.specialization}</p>

        {/* Info row */}
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
          {age !== null && (
            <span className="flex items-center gap-1">
              <CalendarDaysIcon className="w-3.5 h-3.5" />
              {age} yrs
            </span>
          )}
          <span className="flex items-center gap-1 truncate">
            <EnvelopeIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{app.email}</span>
          </span>
        </div>

        {/* Type badge */}
        <TypeBadge type={app.type} />

        {/* Attachment indicators */}
        {(app.cv || app.links) && (
          <div className="flex gap-1.5 mt-3">
            {app.cv && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 flex items-center gap-1">
                <DocumentArrowDownIcon className="w-3 h-3" /> CV
              </span>
            )}
            {app.links && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 flex items-center gap-1">
                <LinkIcon className="w-3 h-3" /> Links
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stats bar ─────────────────────────────────────────────────────────────

function StatsBar({ apps }: { apps: Application[] }) {
  const { T } = useLang();
  const counts = ALL_TYPES.map((t) => ({
    type: t,
    count: apps.filter((a) => a.type === t).length,
  }));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {counts.map(({ type, count }) => {
        const c = TYPE_COLORS[type];
        return (
          <div key={type} className={`rounded-xl p-4 ${c.bg} flex items-center gap-3`}>
            <div className={`w-2.5 h-2.5 rounded-full ${c.dot} shrink-0`} />
            <div>
              <p className={`text-2xl font-bold ${c.text}`}>{count}</p>
              <p className={`text-xs font-medium ${c.text} opacity-80`}>{T.applies.types[type]}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AppliesPage() {
  const { T } = useLang();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ApplicationType | ''>('');
  const [genderFilter, setGenderFilter] = useState<ApplicationGender | ''>('');
  const [selected, setSelected] = useState<Application | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null);

  const params: ApplicationQueryParams = {
    page,
    limit: 12,
    search,
    type: typeFilter,
    gender: genderFilter,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['applications', params],
    queryFn: () => applicationsApi.list(params).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => applicationsApi.delete(id),
    onSuccess: () => {
      toast.success(T.applies.delete_title);
      qc.invalidateQueries({ queryKey: ['applications'] });
      setDeleteTarget(null);
      setSelected(null);
    },
    onError: () => toast.error(T.common.no_results),
  });

  const handleDeleteRequest = (app: Application) => {
    setSelected(null);
    setDeleteTarget(app);
  };

  return (
    <div className="space-y-5">
      {/* Stats (shown only when no filter / search active for full-page data) */}
      {data && !search && !typeFilter && !genderFilter && page === 1 && (
        <StatsBar apps={data.data} />
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={T.applies.search_placeholder}
            className="w-full ps-9 pe-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value as ApplicationType | ''); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">{T.applies.all_types}</option>
          {ALL_TYPES.map((t) => (
            <option key={t} value={t}>{T.applies.types[t]}</option>
          ))}
        </select>

        <select
          value={genderFilter}
          onChange={(e) => { setGenderFilter(e.target.value as ApplicationGender | ''); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">{T.applies.all_genders}</option>
          <option value="M">{T.applies.genders.M}</option>
          <option value="F">{T.applies.genders.F}</option>
        </select>

        {data && (
          <span className="text-sm text-gray-400 ml-auto">
            {data.pagination.total} application{data.pagination.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-56 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : !data?.data.length ? (
        <div className="py-20 text-center text-gray-400">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <BriefcaseIcon className="w-8 h-8 text-gray-300" />
          </div>
          <p className="font-medium">{T.applies.no_results}</p>
          <p className="text-sm mt-1">{T.applies.no_results_sub}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.data.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                onClick={() => setSelected(app)}
                onDelete={(e) => { e.stopPropagation(); handleDeleteRequest(app); }}
              />
            ))}
          </div>
          <Pagination
            page={data.pagination.page}
            pages={data.pagination.pages}
            total={data.pagination.total}
            limit={data.pagination.limit}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Detail slide-over */}
      {selected && (
        <DetailPanel
          app={selected}
          onClose={() => setSelected(null)}
          onDelete={handleDeleteRequest}
        />
      )}

      {/* Delete confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
        title={T.applies.delete_title}
        message={deleteTarget ? T.applies.delete_msg(deleteTarget.name.en) : ''}
      />
    </div>
  );
}
