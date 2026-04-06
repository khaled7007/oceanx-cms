import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LanguageContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { lang, setLang, T } = useLang();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
      toast.success(T.auth.welcome);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-500 rounded-2xl mb-4">
            <span className="text-white font-bold text-xl">OX</span>
          </div>
          <h1 className="text-2xl font-bold text-white">OceanX CMS</h1>
          <p className="text-gray-400 text-sm mt-1">Admin Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          {/* Language toggle inside card */}
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-gray-200 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <span>{lang === 'en' ? '🇸🇦' : '🇬🇧'}</span>
              <span>{lang === 'en' ? 'عربي' : 'English'}</span>
            </button>
          </div>

          <h2 className="text-lg font-semibold text-gray-900 mb-6">{T.auth.sign_in_title}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{T.auth.email}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="admin@oceanx.sa"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{T.auth.password}</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="••••••••"
                dir="ltr"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? T.auth.signing_in : T.auth.sign_in}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">{T.auth.internal_note}</p>
      </div>
    </div>
  );
}
