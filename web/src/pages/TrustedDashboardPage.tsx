// ============================================================
// d:\ABHAYA\web\src\pages\TrustedDashboardPage.tsx
// Trusted Contact Guardian Portal (For Rahul Sharma)
// Real-time Automated SOS Alert Receiver & Live Tracking
// ============================================================

import React, { useState, useEffect } from 'react';
import { HeartHandshake, ShieldCheck, Radio, Phone, MessageSquare, AlertTriangle, BatteryCharging, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { MapComponent } from '../components/MapComponent';
import { subscribeToEmergencyAlerts, subscribeToLiveLocation, resolveEmergencySOS, LiveSOSData, LiveLocationData } from '../services/liveSync';

export const TrustedDashboardPage: React.FC = () => {
  const { t } = useLanguage();

  const [activeSos, setActiveSos] = useState<LiveSOSData | null>(null);
  const [priyaLocation, setPriyaLocation] = useState<[number, number]>([28.621, 77.061]);
  const [priyaBattery, setPriyaBattery] = useState<number>(84);
  const [lastUpdateText, setLastUpdateText] = useState<string>('Just now');

  // Play audible alert sound when SOS is active
  const playSiren = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(850, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(450, audioCtx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {}
  };

  // Subscribe to real-time emergency alerts & live GPS
  useEffect(() => {
    const unsubscribeSOS = subscribeToEmergencyAlerts((alert) => {
      if (alert && alert.status === 'active') {
        setActiveSos(alert);
        setPriyaLocation([alert.lat, alert.lng]);
        setPriyaBattery(alert.batteryLevel);
        setLastUpdateText('Live Emergency Dispatch');
        playSiren();
      } else {
        setActiveSos(null);
      }
    });

    const unsubscribeLocation = subscribeToLiveLocation((loc: LiveLocationData) => {
      setPriyaLocation([loc.lat, loc.lng]);
      setPriyaBattery(loc.batteryLevel);
      setLastUpdateText(new Date().toLocaleTimeString());
    });

    return () => {
      unsubscribeSOS();
      unsubscribeLocation();
    };
  }, []);

  const handleResolveAlert = async () => {
    if (activeSos) {
      await resolveEmergencySOS(activeSos.sessionId);
    } else {
      await resolveEmergencySOS();
    }
    setActiveSos(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Real-time SOS Alert Banner if Active */}
      {activeSos && (
        <div className="bg-[#D93636] text-white p-6 rounded-3xl shadow-2xl shadow-red-500/40 border-2 border-white flex flex-col md:flex-row items-center justify-between gap-4 animate-bounce">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white text-red-600 flex items-center justify-center flex-shrink-0 shadow-lg">
              <AlertTriangle className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-black/30">
                  🚨 LIVE EMERGENCY ALERT
                </span>
                <span className="text-xs font-semibold">
                  {new Date(activeSos.activatedAt).toLocaleTimeString()}
                </span>
              </div>
              <h2 className="font-black text-xl sm:text-2xl mt-0.5">
                {activeSos.userName} Triggered Emergency SOS!
              </h2>
              <p className="text-xs text-white/95 mt-1">
                📍 Location: {activeSos.address} ({activeSos.lat.toFixed(4)}° N, {activeSos.lng.toFixed(4)}° E) • Battery {activeSos.batteryLevel}%
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={`tel:${activeSos.userPhone.replace(/[^0-9+]/g, '')}`}
              className="px-4 py-2.5 rounded-xl bg-white text-red-700 font-black text-xs shadow-md hover:bg-gray-100 flex items-center gap-1.5 transition-all"
            >
              <Phone className="w-4 h-4 text-red-600" />
              <span>Call Priya Now</span>
            </a>

            <a
              href="tel:112"
              className="px-4 py-2.5 rounded-xl bg-gray-900 text-white font-black text-xs shadow-md hover:bg-black flex items-center gap-1.5 transition-all"
            >
              <span>Call Police (112)</span>
            </a>

            <button
              onClick={handleResolveAlert}
              className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs shadow-md flex items-center gap-1.5 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark Resolved</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Welcome Banner */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center">
              <HeartHandshake className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#292936]">
              Guardian Safety Portal
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-[#673AB7]">
              Rahul Sharma (Brother)
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-xl">
            Authorized to view Priya Sharma's live journey and receive high-priority emergency dispatches.
          </p>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {activeSos ? (
            <button
              onClick={handleResolveAlert}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark SOS Resolved</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>All Safe • No Active Emergency</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Authorized User & Live Tracking Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Authorized User Card (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Connected Primary User
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                activeSos ? 'bg-red-100 text-red-800' : 'bg-emerald-50 text-emerald-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${activeSos ? 'bg-red-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`}></span>
                {activeSos ? 'SOS IN PROGRESS' : 'Location Stream Active'}
              </span>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120"
                alt="Priya"
                className="w-12 h-12 rounded-full object-cover border-2 border-[#673AB7]"
              />
              <div>
                <h3 className="font-extrabold text-sm text-[#292936]">Priya Sharma</h3>
                <p className="text-xs text-gray-500 font-mono">ABHAYA-USER-1001</p>
                <p className="text-[11px] text-gray-500 font-medium">+91 9000000001</p>
              </div>
            </div>

            {/* Live Telemetry Info */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span>Current Coordinates</span>
                </span>
                <span className="font-bold text-gray-900 font-mono">
                  {priyaLocation[0].toFixed(4)}° N, {priyaLocation[1].toFixed(4)}° E
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>Last Coordinates Ping</span>
                </span>
                <span className="font-bold text-gray-900">{lastUpdateText}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500 flex items-center gap-1">
                  <BatteryCharging className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Priya's Battery</span>
                </span>
                <span className="font-bold text-emerald-700">{priyaBattery}%</span>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-gray-500 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#673AB7]" />
                  <span>Corridor Security</span>
                </span>
                <span className="font-bold text-emerald-700">Zone A Safe Path</span>
              </div>
            </div>

            {/* Direct Communication Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <a
                href="tel:+919000000001"
                className="py-2.5 px-3 rounded-xl bg-purple-100 hover:bg-purple-200 text-[#673AB7] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Priya</span>
              </a>

              <a
                href="sms:+919000000001"
                className="py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>SMS Check-in</span>
              </a>
            </div>

          </div>

          {/* Privacy Guarantee Note */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200 text-xs text-gray-500 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-gray-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Strict Privacy Controls</span>
            </div>
            <p>
              Under Indian Digital Personal Data Protection standards, Priya's coordinates are only shared during active journeys or emergency events.
            </p>
          </div>

        </div>

        {/* Right Side: Guardian Map View (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3 px-2">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${activeSos ? 'bg-red-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`}></span>
                <span className="font-bold text-xs text-[#292936]">
                  {activeSos ? 'EMERGENCY LOCATION (Priya Sharma)' : 'Live GPS Guardian View (Priya Sharma)'}
                </span>
              </div>
              <span className="text-[11px] text-gray-400">
                Auto-updating stream
              </span>
            </div>

            <MapComponent
              center={priyaLocation}
              zoom={14}
              height="450px"
              routes={[
                {
                  coordinates: [
                    [28.6186, 77.0545],
                    [28.621, 77.061],
                    [28.625, 77.071],
                    [28.6289, 77.0789],
                  ],
                  color: activeSos ? '#D93636' : '#2E9D64',
                  name: 'Priya Journey Path',
                  zone: activeSos ? 'C' : 'A',
                },
              ]}
              markers={[
                {
                  lat: priyaLocation[0],
                  lng: priyaLocation[1],
                  title: activeSos ? '🚨 EMERGENCY: Priya Sharma Location' : 'Priya Sharma (Current Position)',
                  type: activeSos ? 'hazard' : 'user',
                  description: activeSos ? 'Priya activated Emergency SOS here!' : 'Moving along safe corridor',
                },
                {
                  lat: 28.6195,
                  lng: 77.0562,
                  title: 'Uttam Nagar Police Station',
                  type: 'police',
                  description: 'Nearest station • +91 11 2533 5555',
                },
                {
                  lat: 28.6255,
                  lng: 77.0845,
                  title: 'Mata Chanan Devi Hospital',
                  type: 'hospital',
                },
              ]}
            />
          </div>
        </div>

      </div>

    </div>
  );
};
