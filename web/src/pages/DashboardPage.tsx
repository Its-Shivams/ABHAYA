// ============================================================
// d:\ABHAYA\web\src\pages\DashboardPage.tsx
// Primary User Home Dashboard (Personalized for Priya Sharma)
// Features Real Device GPS Location & Broadcast
// ============================================================

import React, { useState, useEffect } from 'react';
import { Navigation, Radio, AlertTriangle, FileWarning, PhoneCall, Users, ShieldCheck, ChevronRight, MapPin, Sparkles, Activity, Crosshair, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MapComponent } from '../components/MapComponent';
import { useLiveLocation } from '../hooks/useLiveLocation';
import { broadcastLiveCoordinates } from '../services/liveSync';
import { apiClient } from '../services/api';
import { ConnectedContact } from '../types';
import { ConnectContactModal } from '../components/ConnectContactModal';

interface DashboardPageProps {
  onNavigateTab: (tab: string) => void;
  onOpenSOS: () => void;
  onOpenVoice: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateTab,
  onOpenSOS,
  onOpenVoice,
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const liveLocation = useLiveLocation();

  const [contacts, setContacts] = useState<ConnectedContact[]>([]);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);

  const userName = user?.profile?.display_name || user?.profile?.full_name || user?.email || 'User';
  const abhayaId = user?.abhayaId || 'ABHAYA-USER-1001';

  const loadContacts = async () => {
    try {
      const res = await apiClient.get('/contacts');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setContacts(res.data.data);
      }
    } catch {}
  };

  useEffect(() => {
    loadContacts();
  }, [user]);

  // Broadcast current location to Rahul whenever location changes
  useEffect(() => {
    broadcastLiveCoordinates({
      lat: liveLocation.lat,
      lng: liveLocation.lng,
      accuracy: liveLocation.accuracy || 10,
      speed: liveLocation.speed || 0,
      heading: liveLocation.heading || 0,
      timestamp: new Date().toISOString(),
      batteryLevel: 84,
      isRealGPS: liveLocation.isRealGPS,
    });
  }, [liveLocation.lat, liveLocation.lng]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner / Greeting */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-[#292936]">
              {t('greeting')}, {userName}! 👋
            </h1>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Protection Active
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-500">
            <span className="font-semibold text-[#673AB7] bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              {abhayaId}
            </span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              <span className="font-medium text-gray-700">
                {liveLocation.isRealGPS ? `Device GPS: ${liveLocation.lat.toFixed(4)}° N, ${liveLocation.lng.toFixed(4)}° E` : 'Uttam Nagar East, New Delhi'}
              </span>
            </div>
            {liveLocation.isRealGPS && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                ±{liveLocation.accuracy}m Accuracy
              </span>
            )}
          </div>
        </div>

        {/* Location & SOS Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Real Device GPS Toggle Button */}
          <button
            onClick={() => liveLocation.toggleRealGPS()}
            className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold border flex items-center gap-1.5 transition-all shadow-sm ${
              liveLocation.useRealDeviceGPS
                ? 'bg-blue-600 text-white border-blue-700 shadow-blue-500/20'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
            }`}
            title="Switch between Real Browser Geolocation and Demo Delhi coordinates"
          >
            <Crosshair className={`w-4 h-4 ${liveLocation.useRealDeviceGPS ? 'animate-spin' : 'text-blue-600'}`} />
            <span>{liveLocation.useRealDeviceGPS ? 'GPS: Real Device' : 'GPS: Demo Delhi'}</span>
          </button>

          <button
            onClick={onOpenVoice}
            className="px-4 py-2.5 rounded-2xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/60 text-[#673AB7] font-bold text-xs flex items-center gap-2 transition-all"
          >
            <Sparkles className="w-4 h-4 text-[#673AB7]" />
            <span>Voice</span>
          </button>

          <button
            onClick={onOpenSOS}
            className="px-5 py-2.5 rounded-2xl bg-[#D93636] hover:bg-red-700 text-white font-extrabold text-xs shadow-md shadow-red-500/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
            <span>EMERGENCY SOS</span>
          </button>
        </div>
      </div>

      {/* Grid: Live Map & Area Safety Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Interactive Safety Map (2 Cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <span>{t('currentLocation')} & Surroundings</span>
              {liveLocation.isRealGPS && (
                <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">
                  Live Satellite GPS
                </span>
              )}
            </h2>
            <button
              onClick={() => onNavigateTab('routes')}
              className="text-xs font-bold text-[#673AB7] hover:underline flex items-center gap-1"
            >
              <span>{t('findSafeRoute')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <MapComponent
            center={[liveLocation.lat, liveLocation.lng]}
            zoom={14}
            height="360px"
            markers={[
              {
                lat: liveLocation.lat,
                lng: liveLocation.lng,
                title: `Your Location (${userName})`,
                type: 'user',
                description: liveLocation.isRealGPS ? 'Real GPS Position' : 'Safe Zone A Corridor',
              },
              {
                lat: 28.6195,
                lng: 77.0562,
                title: 'Uttam Nagar Police Station',
                type: 'police',
                description: '350m away • +91 11 2533 5555',
              },
              {
                lat: 28.6255,
                lng: 77.0845,
                title: 'Mata Chanan Devi Hospital',
                type: 'hospital',
                description: '1.8km away • Emergency 24/7',
              },
              {
                lat: 28.6294,
                lng: 77.0778,
                title: 'Janakpuri West Metro Station',
                type: 'metro',
                description: '1.2km • Pink Booth & CCTV Safe Haven',
              },
            ]}
          />
        </div>

        {/* Safety Overview Panel (1 Col) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                {t('areaSafetyStatus')}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                ZONE A
              </span>
            </div>

            {/* Score Ring / Number */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex flex-col items-center justify-center shadow-md shadow-emerald-500/20">
                <span className="text-2xl font-black">84.5</span>
                <span className="text-[9px] uppercase font-bold tracking-wider">/ 100</span>
              </div>
              <div>
                <p className="font-extrabold text-sm text-emerald-950">
                  {t('zoneA')}
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Well lit commercial stretch with high footfall & active police presence.
                </p>
              </div>
            </div>

            {/* Parameter Bars */}
            <div className="mt-5 space-y-2.5">
              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
                  <span>Streetlight Illumination</span>
                  <span className="font-bold text-gray-900">88%</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '88%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
                  <span>Public Activity & Footfall</span>
                  <span className="font-bold text-gray-900">92%</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
                  <span>Police Station Access</span>
                  <span className="font-bold text-gray-900">85%</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
                  <span>CCTV Surveillance</span>
                  <span className="font-bold text-gray-900">76%</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '76%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 mt-4">
            <p className="text-[11px] text-gray-400 text-center">
              Evaluated by ABHAYA Safety Intelligence Engine v1.0
            </p>
          </div>
        </div>

      </div>

      {/* Quick Safety Actions Grid */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">
          {t('quickActions')}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          
          <button
            onClick={() => onNavigateTab('routes')}
            className="p-4 rounded-2xl bg-white border border-gray-200 hover:border-[#673AB7] hover:shadow-md transition-all text-left flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#673AB7] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Navigation className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <p className="font-bold text-xs text-[#292936]">{t('findSafeRoute')}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Safety vs Distance</p>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('journey')}
            className="p-4 rounded-2xl bg-white border border-gray-200 hover:border-emerald-500 hover:shadow-md transition-all text-left flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Radio className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <p className="font-bold text-xs text-[#292936]">{t('shareMyJourney')}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Live with Rahul</p>
            </div>
          </button>

          <button
            onClick={onOpenSOS}
            className="p-4 rounded-2xl bg-red-50 border border-red-200 hover:border-red-500 hover:shadow-md transition-all text-left flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <p className="font-bold text-xs text-red-900">{t('emergencySOS')}</p>
              <p className="text-[10px] text-red-600/80 mt-0.5">Hold 2.5 Seconds</p>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('community')}
            className="p-4 rounded-2xl bg-white border border-gray-200 hover:border-amber-500 hover:shadow-md transition-all text-left flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FileWarning className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <p className="font-bold text-xs text-[#292936]">{t('reportUnsafe')}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Lights, CCTV, Hazards</p>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('nearby')}
            className="p-4 rounded-2xl bg-white border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <PhoneCall className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <p className="font-bold text-xs text-[#292936]">{t('nearbyHelp')}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Police & Hospitals</p>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('community')}
            className="p-4 rounded-2xl bg-white border border-gray-200 hover:border-[#673AB7] hover:shadow-md transition-all text-left flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#673AB7] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <p className="font-bold text-xs text-[#292936]">Community Feed</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Local Safety Alerts</p>
            </div>
          </button>

        </div>
      </div>

      {/* Row: Trusted Contact Status & Recent Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Trusted Contacts Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-[#292936] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{t('connectedContacts')}</span>
            </h3>
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="text-xs font-bold text-[#673AB7] hover:bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200 flex items-center gap-1 transition-all"
            >
              <UserPlus className="w-3 h-3" />
              <span>+ Add</span>
            </button>
          </div>

          {contacts.length === 0 ? (
            <div className="p-4 rounded-2xl bg-gray-50 border border-dashed border-gray-300 text-center space-y-2">
              <p className="text-xs font-bold text-gray-700">No Trusted Guardians Linked Yet</p>
              <p className="text-[11px] text-gray-400">
                Connect family or friends using their ABHAYA ID so they can receive your live SOS alerts.
              </p>
              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-[#673AB7] hover:bg-purple-800 text-white font-bold text-xs transition-colors shadow-sm inline-flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Connect Guardian</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {contacts.map((c) => (
                <div key={c.id} className="p-3 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-purple-200 text-[#673AB7] font-black flex items-center justify-center flex-shrink-0 text-xs">
                      {(c.name || 'G')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-[#292936]">{c.name} {c.nickname ? `(${c.nickname})` : ''}</p>
                      <p className="text-[11px] text-gray-500 font-mono">{c.phone || c.email} • {c.abhayaId}</p>
                    </div>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm animate-pulse flex-shrink-0"></span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Community Activity */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-[#292936] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#673AB7]" />
              <span>{t('recentActivity')}</span>
            </h3>
            <button
              onClick={() => onNavigateTab('community')}
              className="text-xs font-bold text-[#673AB7] hover:underline"
            >
              {t('viewAll')}
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100 flex items-start gap-2">
              <span className="text-sm">💡</span>
              <div>
                <p className="font-semibold text-gray-800">Lighting repaired near Uttam Nagar Metro Pillar 650</p>
                <p className="text-[10px] text-gray-500">Verified by Municipal Corporation • 4 hours ago</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start gap-2">
              <span className="text-sm">👮</span>
              <div>
                <p className="font-semibold text-gray-800">Police Pink Booth active at Janakpuri West Gate 2</p>
                <p className="text-[10px] text-gray-500">Patrol duty confirmed until 11 PM</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Modal */}
      <ConnectContactModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onSuccess={loadContacts}
      />

    </div>
  );
};
