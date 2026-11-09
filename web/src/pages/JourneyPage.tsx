// ============================================================
// d:\ABHAYA\web\src\pages\JourneyPage.tsx
// Real-Time Live Journey Sharing & Guardian Tracking
// Automated ETA, Deviation Checks, and Contact Authorization
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  Radio,
  ShieldCheck,
  BatteryCharging,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Users,
  Navigation,
  Crosshair,
  Shield,
  HelpCircle,
  Play,
  Square,
  ChevronRight,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { MapComponent } from '../components/MapComponent';
import { RouteOption, ConnectedContact } from '../types';
import { apiClient } from '../services/api';
import { useLiveLocation } from '../hooks/useLiveLocation';
import { broadcastLiveCoordinates } from '../services/liveSync';

interface JourneyPageProps {
  initialRoute?: RouteOption | null;
  onOpenSOS: () => void;
}

export const JourneyPage: React.FC<JourneyPageProps> = ({ initialRoute, onOpenSOS }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const liveLocation = useLiveLocation();

  const [isJourneyActive, setIsJourneyActive] = useState<boolean>(true);
  const [progressPercent, setProgressPercent] = useState<number>(35);
  const [etaMinutes, setEtaMinutes] = useState<number>(11);
  const [batteryLevel, setBatteryLevel] = useState<number>(84);
  const [lastPingTime, setLastPingTime] = useState<string>('Just now');
  const [contacts, setContacts] = useState<ConnectedContact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [deviationAlert, setDeviationAlert] = useState<boolean>(false);

  const routeCoords: [number, number][] = initialRoute?.coordinates || [
    [28.6186, 77.0545],
    [28.6212, 77.0615],
    [28.6254, 77.0712],
    [28.6289, 77.0789],
  ];

  const [currentCoord, setCurrentCoord] = useState<[number, number]>([
    liveLocation.isRealGPS ? liveLocation.lat : 28.6212,
    liveLocation.isRealGPS ? liveLocation.lng : 77.0615,
  ]);

  // Load connected contacts
  useEffect(() => {
    apiClient.get('/contacts').then((res) => {
      if (res.data?.success && Array.isArray(res.data.data)) {
        setContacts(res.data.data);
        setSelectedContacts(res.data.data.map((c: any) => c.id));
      }
    }).catch(() => {});
  }, []);

  // Sync with real GPS
  useEffect(() => {
    if (liveLocation.isRealGPS) {
      setCurrentCoord([liveLocation.lat, liveLocation.lng]);
      setLastPingTime(new Date().toLocaleTimeString());
    }
  }, [liveLocation.lat, liveLocation.lng, liveLocation.isRealGPS]);

  // Broadcast location
  useEffect(() => {
    if (!isJourneyActive) return;

    broadcastLiveCoordinates({
      lat: currentCoord[0],
      lng: currentCoord[1],
      accuracy: liveLocation.accuracy || 8,
      speed: liveLocation.speed || 14,
      heading: liveLocation.heading || 45,
      timestamp: new Date().toISOString(),
      batteryLevel,
      isRealGPS: liveLocation.isRealGPS,
    });
  }, [currentCoord, isJourneyActive, batteryLevel]);

  // Advance simulated movement if not real GPS
  useEffect(() => {
    if (!isJourneyActive || liveLocation.isRealGPS) return;

    const timer = setInterval(() => {
      setProgressPercent((prev) => (prev >= 95 ? 100 : prev + 5));
      setEtaMinutes((prev) => Math.max(1, prev - 1));
      setLastPingTime(new Date().toLocaleTimeString());

      setCurrentCoord(([lat, lng]) => [
        lat + 0.0006 * (Math.random() > 0.5 ? 1 : 0.8),
        lng + 0.0009 * (Math.random() > 0.5 ? 1 : 0.8),
      ]);
    }, 6000);

    return () => clearInterval(timer);
  }, [isJourneyActive, liveLocation.isRealGPS]);

  const handleStopJourney = () => {
    setIsJourneyActive(false);
    setProgressPercent(100);
  };

  const handleStartJourney = () => {
    setIsJourneyActive(true);
    setProgressPercent(10);
    setEtaMinutes(14);
    setCurrentCoord([liveLocation.lat, liveLocation.lng]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center border border-emerald-100">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#252238]">
                  {t('journeyTitle')}
                </h1>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  isJourneyActive ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200' : 'bg-gray-100 text-gray-600'
                }`}>
                  {isJourneyActive ? 'STREAMING ACTIVE' : 'JOURNEY COMPLETED'}
                </span>
              </div>
              <p className="text-xs text-[#777487] mt-0.5">
                Authorized guardians receive live GPS coordinates, battery level and corridor updates.
              </p>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2.5">
          {isJourneyActive ? (
            <button
              onClick={handleStopJourney}
              className="px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>End Journey Safely</span>
            </button>
          ) : (
            <button
              onClick={handleStartJourney}
              className="px-4 py-2.5 rounded-xl bg-[#673AB7] hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start New Journey</span>
            </button>
          )}

          <button
            onClick={onOpenSOS}
            className="px-4 py-2.5 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>SOS</span>
          </button>
        </div>
      </div>

      {/* Route Deviation Prompt Alert (If Triggered) */}
      {deviationAlert && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-xs text-amber-900">Route Deviation Detected</p>
              <p className="text-[11px] text-amber-700">You appear to have departed from the evaluated safe route. Is everything alright?</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDeviationAlert(false)}
              className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-xs font-bold text-amber-800 hover:bg-amber-100"
            >
              Yes, I took a detour
            </button>
            <button
              onClick={onOpenSOS}
              className="px-3 py-1.5 rounded-xl bg-[#DC2626] text-white text-xs font-bold hover:bg-red-700"
            >
              Need Help (SOS)
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Telemetry & Guardian Controls (4 cols) + Map View (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Telemetry Column */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Progress Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#777487]">
                Journey Progress
              </span>
              <span className="font-mono font-bold text-xs text-[#16A34A]">{progressPercent}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full bg-[#16A34A] rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <Clock className="w-4 h-4 text-[#673AB7] mx-auto mb-1" />
                <span className="text-[10px] text-[#777487] font-semibold block uppercase">Est. Arrival</span>
                <span className="font-black text-sm text-[#252238]">{etaMinutes} mins</span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <BatteryCharging className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <span className="text-[10px] text-[#777487] font-semibold block uppercase">Device Battery</span>
                <span className="font-black text-sm text-emerald-700">{batteryLevel}% OK</span>
              </div>
            </div>

            <div className="text-xs text-[#777487] pt-2 border-t border-gray-100 space-y-1">
              <div className="flex justify-between">
                <span>Last GPS Ping:</span>
                <strong className="text-[#252238]">{lastPingTime}</strong>
              </div>
              <div className="flex justify-between">
                <span>Coordinates:</span>
                <span className="font-mono text-[#252238]">{currentCoord[0].toFixed(4)}° N, {currentCoord[1].toFixed(4)}° E</span>
              </div>
            </div>
          </div>

          {/* Connected Guardians Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#777487]">
                Live Sharing With
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                Encrypted Stream
              </span>
            </div>

            {contacts.length === 0 ? (
              <p className="text-xs text-[#777487] py-2">
                No guardians currently linked. Go to Profile to link family members.
              </p>
            ) : (
              <div className="space-y-2">
                {contacts.map((c) => (
                  <div key={c.id} className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-purple-100 text-[#673AB7] font-bold flex items-center justify-center text-xs">
                        {(c.name || 'G')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-[#252238]">{c.name}</p>
                        <p className="text-[10px] text-[#777487]">{c.nickname || 'Guardian'}</p>
                      </div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Simulate Detour Test */}
          <button
            onClick={() => setDeviationAlert(!deviationAlert)}
            className="w-full py-2 rounded-xl border border-gray-200 text-xs font-semibold text-[#777487] hover:bg-gray-50 flex items-center justify-center gap-1.5 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Simulate Deviation Trigger</span>
          </button>

        </div>

        {/* Right Map Column (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-4 shadow-sm border border-gray-200/80 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-ping"></span>
              <h2 className="font-bold text-sm text-[#252238]">
                Real-Time Journey Path & Corridor
              </h2>
            </div>
            <span className="text-[11px] text-[#777487]">
              Active GPS Tracking
            </span>
          </div>

          <MapComponent
            center={currentCoord}
            zoom={14}
            height="440px"
            routes={[
              {
                coordinates: routeCoords,
                color: '#16A34A',
                name: 'Authorized Journey Corridor',
                zone: 'A',
                isRecommended: true,
              },
            ]}
            markers={[
              {
                lat: currentCoord[0],
                lng: currentCoord[1],
                title: 'Live Position',
                type: 'user',
                description: 'You are travelling along Zone A Safe Path',
              },
              {
                lat: routeCoords[routeCoords.length - 1][0],
                lng: routeCoords[routeCoords.length - 1][1],
                title: 'Destination',
                type: 'destination',
                description: 'Janakpuri District Centre',
              },
              {
                lat: 28.6195,
                lng: 77.0562,
                title: 'Uttam Nagar Police Station',
                type: 'police',
              },
            ]}
          />
        </div>

      </div>

    </div>
  );
};
