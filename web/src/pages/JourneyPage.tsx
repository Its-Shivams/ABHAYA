// ============================================================
// d:\ABHAYA\web\src\pages\JourneyPage.tsx
// Real-Time Live Journey Sharing & Guardian Tracking
// Broadcasts Live GPS to Rahul in real time
// ============================================================

import React, { useState, useEffect } from 'react';
import { Radio, ShieldCheck, BatteryCharging, Clock, MapPin, CheckCircle2, AlertTriangle, Users, Navigation, Crosshair } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { MapComponent } from '../components/MapComponent';
import { RouteOption } from '../types';
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
  const [journeyId, setJourneyId] = useState<string>('jrn-live-001');

  // Coordinates simulation along the path
  const routeCoords: [number, number][] = [
    [28.6186, 77.0545],
    [28.621, 77.061],
    [28.625, 77.071],
    [28.6289, 77.0789],
  ];

  const [currentCoord, setCurrentCoord] = useState<[number, number]>([
    liveLocation.isRealGPS ? liveLocation.lat : 28.621,
    liveLocation.isRealGPS ? liveLocation.lng : 77.061,
  ]);

  // Sync with real GPS if active
  useEffect(() => {
    if (liveLocation.isRealGPS) {
      setCurrentCoord([liveLocation.lat, liveLocation.lng]);
    }
  }, [liveLocation.lat, liveLocation.lng, liveLocation.isRealGPS]);

  // Broadcast location to Rahul
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

  // Simulation timer if real GPS is not used
  useEffect(() => {
    if (!isJourneyActive || liveLocation.isRealGPS) return;

    const timer = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 100) return 100;
        return prev + 5;
      });

      setEtaMinutes((prev) => Math.max(1, prev - 1));

      // Slightly advance coordinates
      setCurrentCoord(([lat, lng]) => [
        lat + 0.0006 * (Math.random() > 0.5 ? 1 : 0.5),
        lng + 0.001 * (Math.random() > 0.5 ? 1 : 0.5),
      ]);
    }, 5000);

    return () => clearInterval(timer);
  }, [isJourneyActive, liveLocation.isRealGPS]);

  const handleStopJourney = async () => {
    try {
      await apiClient.post(`/journeys/${journeyId}/stop`);
    } catch {}
    setIsJourneyActive(false);
  };

  const handleStartJourney = async () => {
    setIsJourneyActive(true);
    setProgressPercent(10);
    setEtaMinutes(14);
    setCurrentCoord([liveLocation.lat, liveLocation.lng]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#292936]">
              {t('journeyTitle')}
            </h1>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${isJourneyActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
              {isJourneyActive ? 'LIVE TRACKING ACTIVE' : 'JOURNEY COMPLETED'}
            </span>
          </div>

          <p className="text-xs text-gray-500 mt-1">
            Live encrypted coordinates are broadcasting to Rahul Sharma with safety corridor surveillance.
          </p>
        </div>

        {/* GPS Mode & SOS Shortcut */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => liveLocation.toggleRealGPS()}
            className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold border flex items-center gap-1.5 transition-all shadow-sm ${
              liveLocation.useRealDeviceGPS
                ? 'bg-blue-600 text-white border-blue-700'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
            }`}
          >
            <Crosshair className={`w-4 h-4 ${liveLocation.useRealDeviceGPS ? 'animate-spin' : 'text-blue-600'}`} />
            <span>{liveLocation.useRealDeviceGPS ? 'Using Real GPS' : 'GPS: Demo Delhi'}</span>
          </button>

          <button
            onClick={onOpenSOS}
            className="px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md shadow-red-500/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
            <span>TRIGGER SOS</span>
          </button>
        </div>
      </div>

      {/* Main Tracking Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Map with Live Progress (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-200">
            
            {/* Progress Bar Header */}
            <div className="mb-3 px-2">
              <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>Uttam Nagar East → Janakpuri District Centre</span>
                </div>
                <span className="text-[#673AB7]">{progressPercent}% Traveled</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#673AB7] to-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            <MapComponent
              center={currentCoord}
              zoom={14}
              height="440px"
              routes={[
                {
                  coordinates: routeCoords,
                  color: '#2E9D64',
                  name: 'Live Journey Path',
                  zone: 'A',
                },
              ]}
              markers={[
                {
                  lat: currentCoord[0],
                  lng: currentCoord[1],
                  title: `Your Live Position (${user?.profile?.display_name || user?.profile?.full_name || 'You'})`,
                  type: 'user',
                  description: liveLocation.isRealGPS ? 'Real Device GPS Stream' : 'Moving along safe corridor at 16 km/h',
                },
                {
                  lat: 28.6186,
                  lng: 77.0545,
                  title: 'Start: Uttam Nagar East',
                  type: 'destination',
                },
                {
                  lat: 28.6289,
                  lng: 77.0789,
                  title: 'Destination: Janakpuri District Centre',
                  type: 'destination',
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

        {/* Right Side: Guardian Info & Controls (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Live Telemetry Panel */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Live Sharing Telemetry
            </h3>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <Clock className="w-5 h-5 text-[#673AB7] mx-auto mb-1" />
                <span className="text-[10px] text-gray-400 font-semibold block uppercase">Remaining</span>
                <span className="font-black text-sm text-[#292936]">{etaMinutes} mins</span>
              </div>

              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <BatteryCharging className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <span className="text-[10px] text-gray-400 font-semibold block uppercase">Battery</span>
                <span className="font-black text-sm text-emerald-700">{batteryLevel}% OK</span>
              </div>
            </div>

            {/* Guardian Sharing Row */}
            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#673AB7] block mb-2">
                Active Guardian Stream
              </span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#673AB7] to-pink-500 text-white font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-sm border border-purple-200">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-xs text-[#292936]">Connected Guardians</p>
                  <p className="text-[10px] text-gray-500">Live GPS stream broadcasting to your trusted network</p>
                </div>
                <span className="ml-auto w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
            </div>

            {/* Real GPS Info */}
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 font-semibold">
              <p>📡 Current Coords: {currentCoord[0].toFixed(4)}° N, {currentCoord[1].toFixed(4)}° E</p>
              <p className="text-[10px] text-blue-700 font-normal mt-0.5">
                {liveLocation.isRealGPS ? 'High-precision browser GPS active' : 'Simulating Delhi corridor movement'}
              </p>
            </div>

            {/* Controls */}
            {isJourneyActive ? (
              <button
                onClick={handleStopJourney}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('stopJourneyBtn')}</span>
              </button>
            ) : (
              <button
                onClick={handleStartJourney}
                className="w-full py-3 px-4 rounded-2xl bg-[#673AB7] hover:bg-purple-800 text-white font-extrabold text-xs shadow-md shadow-[#673AB7]/20 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Navigation className="w-4 h-4" />
                <span>{t('startJourneyBtn')}</span>
              </button>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};
