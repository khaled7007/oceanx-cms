import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  DocumentTextIcon,
  NewspaperIcon,
  DocumentDuplicateIcon,
  PhotoIcon,
  WrenchScrewdriverIcon,
  MegaphoneIcon,
  UserGroupIcon,
  BuildingOffice2Icon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { useLang } from '../../contexts/LanguageContext';

export default function Sidebar() {
  const { T } = useLang();

  const navItems = [
    { to: '/dashboard', label: T.nav.dashboard,  icon: HomeIcon },
    { to: '/reports',   label: T.nav.reports,    icon: DocumentTextIcon },
    { to: '/articles',  label: T.nav.articles,   icon: NewspaperIcon },
    { to: '/pages',     label: T.nav.pages,      icon: DocumentDuplicateIcon },
    { to: '/media',     label: T.nav.media,      icon: PhotoIcon },
    { to: '/services',  label: T.nav.services,   icon: WrenchScrewdriverIcon },
    { to: '/news',      label: T.nav.news,        icon: MegaphoneIcon },
    { to: '/competencies', label: T.nav.competencies, icon: UserGroupIcon },
    { to: '/partners',  label: T.nav.partners,   icon: BuildingOffice2Icon },
    { to: '/categories', label: T.nav.categories, icon: TagIcon },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0">
            OX
          </div>
          <div>
            <p className="font-semibold text-sm">OceanX Insight</p>
            <p className="text-xs text-gray-400">{T.nav.portal}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-gray-700">
        <p className="text-xs text-gray-500">v1.0.0 — insight.oceanx.sa</p>
      </div>
    </aside>
  );
}
