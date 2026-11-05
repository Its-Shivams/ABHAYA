// ============================================================
// d:\ABHAYA\web\src\App.tsx
// Master Application Component for ABHAYA Women Safety Platform
// Role-Aware Routing, Real-Time Emergency Sync & Guardian Protection
// ============================================================

import React, { useState, useEffect } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import { useLanguage, LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { SafeRoutesPage } from './pages/SafeRoutesPage';
import { JourneyPage } from './pages/JourneyPage';
import { CommunityPage } from './pages/CommunityPage';
import { NearbyHelpPage } from './pages/NearbyHelpPage';
import { TrustedDashboardPage } from './pages/TrustedDashboardPage';
import { AdminModerationPage } from './pages/AdminModerationPage';
import { ProfilePage } from './pages/ProfilePage';
import { SOSModal } from './components/SOSModal';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { RouteOption } from './types';
import { subscribeToEmergencyAlerts } from './services/liveSync';
import { Home, Navigation, Radio, Users, PhoneCall, ShieldAlert, User as UserIcon, HeartHandshake, AlertTriangle } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();

  const isTrustedContact = user?.role === 'trusted_contact';

  const [activeTab, setActiveTab] = useState<string>(() => {
    return isTrustedContact ? 'trusted' : 'home';
  });

  const [isSOSOpen, setIsSOSOpen] = useState<boolean>(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState<boolean>(false);
  const [selectedRouteForJourney, setSelectedRouteForJourney] = useState<RouteOption | null>(null);
  const [hasActiveSosAlert, setHasActiveSosAlert] = useState<boolean>(false);

  // Set default tab on role change
  useEffect(() => {
    if (user?.role === 'trusted_contact') {
      setActiveTab('trusted');
    } else {
      setActiveTab('home');
    }
  }, [user?.role]);

  // Global listener for SOS triggers
  useEffect(() => {
    const unsubscribe = subscribeToEmergencyAlerts((alert) => {
      if (alert && alert.status === 'active') {
        setHasActiveSosAlert(true);
        if (isTrustedContact) {
          setActiveTab('trusted');
        }
      } else {
        setHasActiveSosAlert(false);
      }
    });

    return () => unsubscribe();
  }, [isTrustedContact]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F7FA] flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 border-4 border-[#673AB7] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-[#673AB7]">Loading ABHAYA Safety Platform...</p>
      </div>
    );
  }

  // Not authenticated -> Show Auth Page
  if (!user) {
    return <AuthPage />;
  }

  const handleStartJourneyWithRoute = (route: RouteOption) => {
    setSelectedRouteForJourney(route);
    setActiveTab('journey');
  };

  return (
    <div className="min-h-screen bg-[#F7F7FA] text-[#292936] flex flex-col justify-between pb-16 md:pb-0">
      
      {/* Top Header / Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenVoice={() => setIsVoiceOpen(true)}
        onOpenSOS={() => setIsSOSOpen(true)}
        hasActiveSosAlert={hasActiveSosAlert}
      />

      {/* Main Body Page Switcher */}
      <main className="flex-1">
        
        {/* Trusted Contact Home is the Guardian Tracking Portal */}
        {isTrustedContact ? (
          <>
            {activeTab === 'trusted' && <TrustedDashboardPage />}
            {activeTab === 'nearby' && <NearbyHelpPage />}
            {activeTab === 'profile' && <ProfilePage />}
          </>
        ) : (
          /* Primary User / Admin Home */
          <>
            {activeTab === 'home' && (
              <DashboardPage
                onNavigateTab={setActiveTab}
                onOpenSOS={() => setIsSOSOpen(true)}
                onOpenVoice={() => setIsVoiceOpen(true)}
              />
            )}

            {activeTab === 'routes' && (
              <SafeRoutesPage onStartJourneyWithRoute={handleStartJourneyWithRoute} />
            )}

            {activeTab === 'journey' && (
              <JourneyPage
                initialRoute={selectedRouteForJourney}
                onOpenSOS={() => setIsSOSOpen(true)}
              />
            )}

            {activeTab === 'community' && <CommunityPage />}

            {activeTab === 'nearby' && <NearbyHelpPage />}

            {activeTab === 'admin' && <AdminModerationPage />}

            {activeTab === 'profile' && <ProfilePage />}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-12 text-center text-xs text-gray-500 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#673AB7]">ABHAYA (अभया)</span>
            <span>•</span>
            <span>Women Safety & Smart Navigation Platform</span>
          </div>
          <p className="text-gray-400">
            Emergency Hotlines: 112 (Police) • 1091 (Women Helpline) • Active Multi-Factor Protection
          </p>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar (Filtered by Role) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-3 py-2 flex items-center justify-around md:hidden">
        {isTrustedContact ? (
          /* Trusted Contact Mobile Bar (No Routes, No Community) */
          <>
            <button
              onClick={() => setActiveTab('trusted')}
              className={`flex flex-col items-center gap-1 ${activeTab === 'trusted' ? 'text-[#673AB7]' : 'text-gray-400'}`}
            >
              <HeartHandshake className="w-5 h-5" />
              <span className="text-[10px] font-bold">Tracking</span>
            </button>

            <button
              onClick={() => setActiveTab('trusted')}
              className={`flex flex-col items-center gap-1 ${hasActiveSosAlert ? 'text-red-600 animate-pulse' : 'text-gray-400'}`}
            >
              <AlertTriangle className="w-5 h-5" />
              <span className="text-[10px] font-bold">Alerts</span>
            </button>

            <button
              onClick={() => setActiveTab('nearby')}
              className={`flex flex-col items-center gap-1 ${activeTab === 'nearby' ? 'text-[#673AB7]' : 'text-gray-400'}`}
            >
              <PhoneCall className="w-5 h-5" />
              <span className="text-[10px] font-bold">Help</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-[#673AB7]' : 'text-gray-400'}`}
            >
              <UserIcon className="w-5 h-5" />
              <span className="text-[10px] font-bold">Profile</span>
            </button>
          </>
        ) : (
          /* Primary User Mobile Bar */
          <>
            <button
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-[#673AB7]' : 'text-gray-400'}`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px] font-bold">Home</span>
            </button>

            <button
              onClick={() => setActiveTab('routes')}
              className={`flex flex-col items-center gap-1 ${activeTab === 'routes' ? 'text-[#673AB7]' : 'text-gray-400'}`}
            >
              <Navigation className="w-5 h-5" />
              <span className="text-[10px] font-bold">Routes</span>
            </button>

            <button
              onClick={() => setIsSOSOpen(true)}
              className="w-12 h-12 -mt-5 rounded-full bg-[#D93636] text-white flex items-center justify-center font-black text-xs shadow-lg shadow-red-500/40 border-2 border-white animate-pulse"
            >
              SOS
            </button>

            <button
              onClick={() => setActiveTab('community')}
              className={`flex flex-col items-center gap-1 ${activeTab === 'community' ? 'text-[#673AB7]' : 'text-gray-400'}`}
            >
              <Users className="w-5 h-5" />
              <span className="text-[10px] font-bold">Community</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-[#673AB7]' : 'text-gray-400'}`}
            >
              <UserIcon className="w-5 h-5" />
              <span className="text-[10px] font-bold">Profile</span>
            </button>
          </>
        )}
      </div>

      {/* Modals */}
      <SOSModal isOpen={isSOSOpen} onClose={() => setIsSOSOpen(false)} />
      
      <VoiceAssistantModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onNavigateTab={setActiveTab}
        onTriggerSOS={() => setIsSOSOpen(true)}
      />

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
