import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/reports': 'Reports',
  '/reports/new': 'New Report',
  '/articles': 'Articles',
  '/articles/new': 'New Article',
  '/pages': 'Pages',
  '/pages/new': 'New Page',
  '/media': 'Media Library',
  '/services': 'Services',
  '/services/new': 'New Service',
  '/news': 'News',
  '/news/new': 'New News Item',
};

function getTitle(pathname: string): string {
  if (titles[pathname]) return titles[pathname];
  if (pathname.endsWith('/edit')) {
    const base = pathname.split('/').slice(0, 2).join('/');
    const baseTitle = titles[base] || 'Content';
    return `Edit ${baseTitle.replace(/s$/, '')}`;
  }
  return 'OceanX CMS';
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
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
