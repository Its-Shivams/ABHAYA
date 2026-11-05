// ============================================================
// d:\ABHAYA\web\src\components\Navbar.tsx
// Role-Aware Navigation Bar: Hides Routes & Community for Trusted Contacts
// ============================================================

import React from 'react';
import { Shield, Navigation, Users, AlertTriangle, PhoneCall, Radio, Globe, Mic, LogOut, ShieldAlert, HeartHandshake, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenVoice: () => void;
  onOpenSOS: () => void;
  hasActiveSosAlert?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenVoice,
  onOpenSOS,
  hasActiveSosAlert = false,
}) => {
  const { user, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();

  const isTrustedContact = user?.role === 'trusted_contact';
  const isAdmin = user?.role === 'admin';
  const isPrimaryUser = user?.role === 'primary_user' || (!isTrustedContact && !isAdmin);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div 
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => setActiveTab(isTrustedContact ? 'trusted' : 'home')}
          >
            <div className="w-10 h-10 rounded-xl bg-[#673AB7] flex items-center justify-center text-white shadow-md shadow-[#673AB7]/20">
              <Shield className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-[#292936]">
                  {t('appName')}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isTrustedContact ? 'bg-pink-100 text-pink-700' : 'bg-[#E8A0BF]/30 text-[#673AB7]'
                }`}>
                  {isTrustedContact ? 'Guardian' : 'Safety v1.0'}
                </span>
              </div>
              <p className="text-[11px] font-medium text-gray-500 hidden sm:block">
                {t('appTagline')}
              </p>
            </div>
          </div>

          {/* Navigation Links (Strictly Filtered by User Role) */}
          <nav className="hidden md:flex items-center gap-1">
            
            {/* 1. PRIMARY USER NAV ITEMS */}
            {isPrimaryUser && (
              <>
                <button
                  onClick={() => setActiveTab('home')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'home'
                      ? 'bg-[#673AB7]/10 text-[#673AB7]'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span>{t('navHome')}</span>
                </button>

                <button
                  onClick={() => setActiveTab('routes')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'routes'
                      ? 'bg-[#673AB7]/10 text-[#673AB7]'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Navigation className="w-4 h-4" />
                  <span>{t('navSafeRoutes')}</span>
                </button>

                <button
                  onClick={() => setActiveTab('journey')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'journey'
                      ? 'bg-[#673AB7]/10 text-[#673AB7]'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Radio className="w-4 h-4 text-emerald-600" />
                  <span>{t('navJourney')}</span>
                </button>

                <button
                  onClick={() => setActiveTab('community')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'community'
                      ? 'bg-[#673AB7]/10 text-[#673AB7]'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>{t('navCommunity')}</span>
                </button>
              </>
            )}

            {/* 2. TRUSTED CONTACT NAV ITEMS (No Routes, No Community) */}
            {isTrustedContact && (
              <>
                <button
                  onClick={() => setActiveTab('trusted')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'trusted'
                      ? 'bg-[#673AB7] text-white shadow-sm'
                      : 'text-gray-700 hover:bg-purple-50'
                  }`}
                >
                  <HeartHandshake className="w-4 h-4" />
                  <span>Guardian Tracking Portal</span>
                </button>

                <button
                  onClick={() => setActiveTab('trusted')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                    hasActiveSosAlert ? 'bg-red-600 text-white animate-pulse' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>SOS Alerts {hasActiveSosAlert ? '(Active!)' : ''}</span>
                </button>
              </>
            )}

            {/* Common: Nearby Help */}
            <button
              onClick={() => setActiveTab('nearby')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'nearby'
                  ? 'bg-[#673AB7]/10 text-[#673AB7]'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <PhoneCall className="w-4 h-4 text-blue-600" />
              <span>{t('navNearby')}</span>
            </button>

            {/* Admin only */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'admin'
                    ? 'bg-purple-100 text-[#673AB7]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>{t('navModeration')}</span>
              </button>
            )}
          </nav>

          {/* Right Actions: Voice, Language, SOS, User */}
          <div className="flex items-center gap-2">
            
            {/* Voice Command Button (for Primary user) */}
            {isPrimaryUser && (
              <button
                onClick={onOpenVoice}
                title={t('voiceAssistant')}
                className="p-2 rounded-xl text-gray-700 hover:bg-purple-50 hover:text-[#673AB7] transition-all border border-gray-200 flex items-center gap-1.5"
              >
                <Mic className="w-4 h-4 text-[#673AB7]" />
                <span className="text-xs font-semibold hidden lg:inline">Voice</span>
              </button>
            )}

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold border border-gray-200 hover:border-[#673AB7] hover:bg-purple-50 text-gray-700 flex items-center gap-1.5 transition-all"
            >
              <Globe className="w-3.5 h-3.5 text-[#673AB7]" />
              <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
            </button>

            {/* Emergency SOS Quick Button (Shown on Primary User side) */}
            {isPrimaryUser && (
              <button
                onClick={onOpenSOS}
                className="bg-[#D93636] hover:bg-red-700 text-white font-black text-xs px-3.5 py-2 rounded-xl shadow-md shadow-red-500/20 flex items-center gap-1.5 transition-transform active:scale-95 animate-pulse"
              >
                <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
                <span>SOS</span>
              </button>
            )}

            {/* User Dropdown / Sign out */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                <button
                  onClick={() => setActiveTab('profile')}
                  className="flex items-center gap-2 text-left p-1 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <img
                    src={user.profile?.profile_picture_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100'}
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover border border-purple-200"
                  />
                  <div className="hidden xl:block">
                    <p className="text-xs font-bold text-[#292936] leading-tight">
                      {user.profile?.full_name || 'User'}
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase font-semibold">
                      {isTrustedContact ? 'Guardian' : isAdmin ? 'Admin' : 'Primary User'}
                    </p>
                  </div>
                </button>

                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}

          </div>

        </div>
      </div>
    </header>
  );
};
