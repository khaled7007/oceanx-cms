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

function ProtectedRoutes() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full"/></div>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reports" element={<ReportsList />} />
        <Route path="/reports/new" element={<ReportForm />} />
        <Route path="/reports/:id/edit" element={<ReportForm />} />
        <Route path="/articles" element={<ArticlesList />} />
        <Route path="/articles/new" element={<ArticleForm />} />
        <Route path="/articles/:id/edit" element={<ArticleForm />} />
        <Route path="/pages" element={<PagesList />} />
        <Route path="/pages/new" element={<PageForm />} />
        <Route path="/pages/:id/edit" element={<PageForm />} />
        <Route path="/media" element={<MediaLibrary />} />
        <Route path="/services" element={<ServicesList />} />
        <Route path="/services/new" element={<ServiceForm />} />
        <Route path="/services/:id/edit" element={<ServiceForm />} />
        <Route path="/news" element={<NewsList />} />
        <Route path="/news/new" element={<NewsForm />} />
        <Route path="/news/:id/edit" element={<NewsForm />} />
        <Route path="/competencies" element={<CompetenciesList />} />
        <Route path="/competencies/new" element={<CompetencyForm />} />
        <Route path="/competencies/:id/edit" element={<CompetencyForm />} />
        <Route path="/partners" element={<PartnersList />} />
        <Route path="/categories" element={<CategoriesList />} />
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
  if (isLoading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
