// ============================================================
// d:\ABHAYA\web\src\pages\DashboardPage.tsx
// Redesigned Home Dashboard — Immediate Women Safety & Route Priority
// Modern Minimal Clean UI: Inter Typography, 16px Radius, Subtle Borders
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  Navigation,
  Radio,
  AlertTriangle,
  FileWarning,
  PhoneCall,
  Users,
  ShieldCheck,
  ChevronRight,
  MapPin,
  Sparkles,
  Activity,
  Crosshair,
  UserPlus,
  Shield,
  Clock,
  ArrowRight,
  Eye,
  Sun,
  Wifi,
  CheckCircle2,
} from 'lucide-react';
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

  const userName = user?.profile?.display_name || user?.profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Traveler';
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

  // Broadcast current location to guardians
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
      
      {/* ─── A & B. Welcome & Session Status Banner ─────────────── */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/80 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-[#252238] tracking-tight">
              {t('greeting')}, {userName}! 👋
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#16A34A] border border-emerald-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse"></span>
              Active Safety Shield
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-[#777487]">
            <span className="font-mono font-bold text-[#673AB7] bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100">
              {abhayaId}
            </span>
            <span>•</span>
            <div className="flex items-center gap-1 text-[#252238]">
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              <span className="font-medium">
                {liveLocation.isRealGPS
                  ? `Device GPS (${liveLocation.lat.toFixed(4)}° N, ${liveLocation.lng.toFixed(4)}° E)`
                  : 'Uttam Nagar East, New Delhi'}
              </span>
            </div>
          </div>
        </div>

        {/* Primary Call to Action & Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Main Hero Route Button */}
          <button
            onClick={() => onNavigateTab('routes')}
            className="px-5 py-3 rounded-xl bg-[#673AB7] hover:bg-purple-800 text-white font-extrabold text-xs shadow-sm flex items-center gap-2 transition-all active:scale-[0.99]"
          >
            <Navigation className="w-4 h-4" />
            <span>FIND SAFEST ROUTE</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Quick Voice Assistant */}
          <button
            onClick={onOpenVoice}
            className="px-3.5 py-3 rounded-xl border border-gray-200 hover:border-[#673AB7] bg-white text-[#252238] font-bold text-xs flex items-center gap-1.5 transition-all"
            title="Voice Safety Assistant"
          >
            <Sparkles className="w-4 h-4 text-[#673AB7]" />
            <span>Voice</span>
          </button>

          {/* Emergency SOS Button */}
          <button
            onClick={onOpenSOS}
            className="px-4 py-3 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white font-black text-xs shadow-sm flex items-center gap-1.5 transition-all active:scale-[0.98]"
          >
            <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
            <span>SOS</span>
          </button>
        </div>
      </div>

      {/* ─── C & D. Main Safety Section & Area Summary ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Map (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-4 shadow-sm border border-gray-200/80 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse"></span>
              <h2 className="font-bold text-sm text-[#252238]">
                Surroundings & Nearby Facilities
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('routes')}
              className="text-xs font-bold text-[#673AB7] hover:underline flex items-center gap-1"
            >
              <span>Explore Safe Corridors</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <MapComponent
            center={[liveLocation.lat, liveLocation.lng]}
            zoom={14}
            height="380px"
            markers={[
              {
                lat: liveLocation.lat,
                lng: liveLocation.lng,
                title: `Your Location (${userName})`,
                type: 'user',
                description: liveLocation.isRealGPS ? 'Real Device GPS locked' : 'Uttam Nagar Safe Corridor',
              },
              {
                lat: 28.6195,
                lng: 77.0562,
                title: 'Uttam Nagar Police Station',
                type: 'police',
                description: '24x7 Women Safety Desk • 350m away',
              },
              {
                lat: 28.6255,
                lng: 77.0845,
                title: 'Mata Chanan Devi Hospital',
                type: 'hospital',
                description: 'Emergency Trauma Care • 1.8km',
              },
              {
                lat: 28.6294,
                lng: 77.0778,
                title: 'Janakpuri West Metro Station',
                type: 'metro',
                description: 'Pink Booth & CCTV Corridor • 1.2km',
              },
            ]}
          />
        </div>

        {/* Area Safety Summary (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-200/80 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#777487]">
                  {t('areaSafetyStatus')}
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#16A34A]">
                Zone A (Safe)
              </span>
            </div>

            {/* Score Ring */}
            <div className="my-5 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-50 border-4 border-emerald-200 shadow-inner">
                <div>
                  <span className="text-3xl font-black text-[#16A34A] leading-none">84</span>
                  <span className="text-[10px] font-bold text-[#777487] block">/100</span>
                </div>
              </div>
              <p className="font-bold text-sm text-[#252238] mt-2">
                Commercial & Transit Corridor
              </p>
              <p className="text-[11px] text-[#777487] max-w-xs mx-auto mt-0.5">
                High commercial footfall, active police patrolling, continuous streetlights.
              </p>
            </div>

            {/* Metrics Breakdown */}
            <div className="space-y-2 text-xs border-t border-gray-100 pt-3">
              <div className="flex justify-between py-1">
                <span className="text-[#777487] flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  Streetlight Coverage
                </span>
                <span className="font-bold text-[#252238]">88% Illuminated</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#777487] flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-purple-600" />
                  CCTV Density
                </span>
                <span className="font-bold text-[#252238]">High (Metro Route)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#777487] flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  Police Proximity
                </span>
                <span className="font-bold text-[#16A34A]">350m (Pink Booth)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#777487] flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  Cellular Signal
                </span>
                <span className="font-bold text-[#16A34A]">Excellent 5G</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 text-[10px] text-[#777487] flex items-center justify-between">
            <span>Confidence: <strong>92%</strong></span>
            <span>Updated: Just now</span>
          </div>
        </div>

      </div>

      {/* ─── E. Five Clean Quick Actions ───────────────────────── */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#777487] mb-3 px-1">
          Safety Actions
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          
          {/* Action 1: Find Safest Route */}
          <button
            onClick={() => onNavigateTab('routes')}
            className="p-4 rounded-2xl bg-white border border-gray-200/80 hover:border-[#673AB7] hover:shadow-sm transition-all text-left flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#673AB7] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Navigation className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <p className="font-bold text-xs text-[#252238]">Find Safest Route</p>
              <p className="text-[10px] text-[#777487] mt-0.5">8-Factor Navigation</p>
            </div>
          </button>

          {/* Action 2: Share Live Journey */}
          <button
            onClick={() => onNavigateTab('journey')}
            className="p-4 rounded-2xl bg-white border border-gray-200/80 hover:border-[#673AB7] hover:shadow-sm transition-all text-left flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Radio className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <p className="font-bold text-xs text-[#252238]">Share Live Journey</p>
              <p className="text-[10px] text-[#777487] mt-0.5">Guardian Tracking</p>
            </div>
          </button>

          {/* Action 3: Emergency SOS */}
          <button
            onClick={onOpenSOS}
            className="p-4 rounded-2xl bg-red-50/60 border border-red-200/80 hover:border-red-500 hover:shadow-sm transition-all text-left flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#DC2626] text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-sm">
              <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <p className="font-bold text-xs text-[#DC2626]">Emergency SOS</p>
              <p className="text-[10px] text-red-600/80 mt-0.5">Hold 2.5s for Dispatch</p>
            </div>
          </button>

          {/* Action 4: Report Unsafe Area */}
          <button
            onClick={() => onNavigateTab('community')}
            className="p-4 rounded-2xl bg-white border border-gray-200/80 hover:border-amber-500 hover:shadow-sm transition-all text-left flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <FileWarning className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <p className="font-bold text-xs text-[#252238]">Report Hazard</p>
              <p className="text-[10px] text-[#777487] mt-0.5">Lights, CCTV, Danger</p>
            </div>
          </button>

          {/* Action 5: Nearby Help */}
          <button
            onClick={() => onNavigateTab('nearby')}
            className="p-4 rounded-2xl bg-white border border-gray-200/80 hover:border-emerald-500 hover:shadow-sm transition-all text-left flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <PhoneCall className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <p className="font-bold text-xs text-[#252238]">Nearby Facilities</p>
              <p className="text-[10px] text-[#777487] mt-0.5">Police & Hospitals</p>
            </div>
          </button>

        </div>
      </div>

      {/* ─── F & G. Trusted Contacts & Verified Community Alerts ─ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Trusted Contacts Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#252238] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
              <span>{t('connectedContacts')}</span>
            </h3>
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="text-xs font-bold text-[#673AB7] hover:bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 flex items-center gap-1 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Link Guardian</span>
            </button>
          </div>

          {contacts.length === 0 ? (
            <div className="p-4 rounded-xl bg-gray-50 border border-dashed border-gray-200 text-center space-y-2">
              <p className="text-xs font-bold text-[#252238]">No Guardians Linked Yet</p>
              <p className="text-[11px] text-[#777487]">
                Connect a trusted contact so they receive your live journey updates and emergency alerts.
              </p>
              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-[#673AB7] hover:bg-purple-800 text-white font-bold text-xs transition-colors shadow-sm inline-flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Link Trusted Guardian</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {contacts.map((c) => (
                <div key={c.id} className="p-3 rounded-xl bg-gray-50/80 border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-[#673AB7] font-black flex items-center justify-center text-xs flex-shrink-0">
                      {(c.name || 'G')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-[#252238]">
                        {c.name} {c.nickname ? `(${c.nickname})` : ''}
                      </p>
                      <p className="text-[10px] text-[#777487] font-mono">
                        {c.phone || c.email} • {c.abhayaId}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Linked
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Verified Community Activity Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#252238] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#673AB7]" />
              <span>Verified Local Safety Updates</span>
            </h3>
            <button
              onClick={() => onNavigateTab('community')}
              className="text-xs font-bold text-[#673AB7] hover:underline"
            >
              {t('viewAll')}
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100/60 flex items-start gap-2.5">
              <span className="text-base">💡</span>
              <div>
                <p className="font-semibold text-[#252238]">High-mast lighting active at Uttam Nagar Metro Pillar 650</p>
                <p className="text-[10px] text-[#777487]">Verified municipal audit • Area illuminated</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100/60 flex items-start gap-2.5">
              <span className="text-base">👮</span>
              <div>
                <p className="font-semibold text-[#252238]">Pink Booth staffed at Janakpuri West Gate 2</p>
                <p className="text-[10px] text-[#777487]">Delhi Police verified patrol duty active</p>
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
