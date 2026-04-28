import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import ReportsList from './pages/reports/ReportsList';
import ReportForm from './pages/reports/ReportForm';
import ArticlesList from './pages/articles/ArticlesList';
import ArticleForm from './pages/articles/ArticleForm';
import PagesList from './pages/pages/PagesList';
import PageForm from './pages/pages/PageForm';
import MediaLibrary from './pages/media/MediaLibrary';
import ServicesList from './pages/services/ServicesList';
import ServiceForm from './pages/services/ServiceForm';
import NewsList from './pages/news/NewsList';
import NewsForm from './pages/news/NewsForm';
import CompetenciesList from './pages/competencies/CompetenciesList';
import CompetencyForm from './pages/competencies/CompetencyForm';
import PartnersList from './pages/partners/PartnersList';
import CategoriesList from './pages/categories/CategoriesList';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import UsersPage from './pages/users/UsersPage';
import AppliesPage from './pages/applies/AppliesPage';

/** Redirect to /applies if user is hr (hr can only access /applies) */
function HrBlockedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role === 'hr') return <Navigate to="/applies" replace />;
  return <>{children}</>;
}

/** Redirect to /dashboard if user does not have write access */
function WriteRoute({ children }: { children: React.ReactNode }) {
  const { permissions } = useAuth();
  if (!permissions.canWrite) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

/** Redirect to /dashboard if user is not admin */
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { permissions } = useAuth();
  if (!permissions.isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

/** Redirect to /dashboard if user cannot manage applies (admin or hr only) */
function AppliesRoute({ children }: { children: React.ReactNode }) {
  const { permissions } = useAuth();
  if (!permissions.canManageApplies) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function ProtectedRoutes() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full"/></div>;
  if (!user) return <Navigate to="/login" replace />;
  const defaultPath = user.role === 'hr' ? '/applies' : '/dashboard';
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to={defaultPath} replace />} />
        <Route path="/dashboard" element={<HrBlockedRoute><Dashboard /></HrBlockedRoute>} />
        <Route path="/reports" element={<HrBlockedRoute><ReportsList /></HrBlockedRoute>} />
        <Route path="/reports/new" element={<HrBlockedRoute><WriteRoute><ReportForm /></WriteRoute></HrBlockedRoute>} />
        <Route path="/reports/:id/edit" element={<HrBlockedRoute><WriteRoute><ReportForm /></WriteRoute></HrBlockedRoute>} />
        <Route path="/articles" element={<HrBlockedRoute><ArticlesList /></HrBlockedRoute>} />
        <Route path="/articles/new" element={<HrBlockedRoute><WriteRoute><ArticleForm /></WriteRoute></HrBlockedRoute>} />
        <Route path="/articles/:id/edit" element={<HrBlockedRoute><WriteRoute><ArticleForm /></WriteRoute></HrBlockedRoute>} />
        <Route path="/pages" element={<HrBlockedRoute><PagesList /></HrBlockedRoute>} />
        <Route path="/pages/new" element={<HrBlockedRoute><WriteRoute><PageForm /></WriteRoute></HrBlockedRoute>} />
        <Route path="/pages/:id/edit" element={<HrBlockedRoute><WriteRoute><PageForm /></WriteRoute></HrBlockedRoute>} />
        <Route path="/media" element={<HrBlockedRoute><MediaLibrary /></HrBlockedRoute>} />
        <Route path="/services" element={<HrBlockedRoute><ServicesList /></HrBlockedRoute>} />
        <Route path="/services/new" element={<HrBlockedRoute><WriteRoute><ServiceForm /></WriteRoute></HrBlockedRoute>} />
        <Route path="/services/:id/edit" element={<HrBlockedRoute><WriteRoute><ServiceForm /></WriteRoute></HrBlockedRoute>} />
        <Route path="/news" element={<HrBlockedRoute><NewsList /></HrBlockedRoute>} />
        <Route path="/news/new" element={<HrBlockedRoute><WriteRoute><NewsForm /></WriteRoute></HrBlockedRoute>} />
        <Route path="/news/:id/edit" element={<HrBlockedRoute><WriteRoute><NewsForm /></WriteRoute></HrBlockedRoute>} />
        <Route path="/competencies" element={<HrBlockedRoute><CompetenciesList /></HrBlockedRoute>} />
        <Route path="/competencies/new" element={<HrBlockedRoute><WriteRoute><CompetencyForm /></WriteRoute></HrBlockedRoute>} />
        <Route path="/competencies/:id/edit" element={<HrBlockedRoute><WriteRoute><CompetencyForm /></WriteRoute></HrBlockedRoute>} />
        <Route path="/partners" element={<HrBlockedRoute><PartnersList /></HrBlockedRoute>} />
        <Route path="/categories" element={<HrBlockedRoute><CategoriesList /></HrBlockedRoute>} />
        <Route path="/analytics" element={<HrBlockedRoute><AnalyticsPage /></HrBlockedRoute>} />
        <Route path="/users" element={<AdminRoute><UsersPage /></AdminRoute>} />
        <Route path="/applies" element={<AppliesRoute><AppliesPage /></AppliesRoute>} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <LanguageProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </LanguageProvider>
  );
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center">
          <span className="text-white font-bold text-xl">OX</span>
        </div>
        <div className="animate-spin w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full" />
      </div>
    </div>
  );
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
