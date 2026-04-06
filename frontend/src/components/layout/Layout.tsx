import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useLang } from '../../contexts/LanguageContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { T } = useLang();

  const titles: Record<string, string> = {
    '/dashboard':    T.nav.dashboard,
    '/reports':      T.nav.reports,
    '/reports/new':  `${T.common.new} ${T.nav.reports.replace(/s$/, '')}`,
    '/articles':     T.nav.articles,
    '/articles/new': `${T.common.new} ${T.nav.articles.replace(/s$/, '')}`,
    '/pages':        T.nav.pages,
    '/pages/new':    `${T.common.new} ${T.nav.pages.replace(/s$/, '')}`,
    '/media':        T.nav.media,
    '/services':     T.nav.services,
    '/services/new': `${T.common.new} ${T.nav.services.replace(/s$/, '')}`,
    '/news':         T.nav.news,
    '/news/new':     `${T.common.new} ${T.nav.news.replace(/s$/, '')}`,
  };

  function getTitle(pathname: string) {
    if (titles[pathname]) return titles[pathname];
    if (pathname.endsWith('/edit')) {
      const base = '/' + pathname.split('/')[1];
      return `${T.common.edit} — ${titles[base] || ''}`;
    }
    return 'OceanX CMS';
  }

  const title = getTitle(location.pathname);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={title} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
