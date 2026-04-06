import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon, UserCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { Fragment } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { user, logout } = useAuth();
  const { lang, setLang, T } = useLang();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success(T.auth.logged_out);
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Language switcher */}
        <button
          onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          title="Switch language"
        >
          <span className="text-base leading-none">{lang === 'en' ? '🇸🇦' : '🇬🇧'}</span>
          <span>{lang === 'en' ? 'عربي' : 'English'}</span>
        </button>

        {/* User menu */}
        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors">
            <UserCircleIcon className="w-8 h-8 text-gray-400" />
            <span className="font-medium">{user?.name}</span>
            <ChevronDownIcon className="w-4 h-4 text-gray-400" />
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute end-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-xs text-gray-500">{user?.email}</p>
                <p className="text-xs font-medium text-brand-600 capitalize">{user?.role}</p>
              </div>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm ${active ? 'bg-gray-50 text-red-600' : 'text-gray-700'}`}
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    {T.auth.sign_out}
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </header>
  );
}
