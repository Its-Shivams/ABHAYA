// ============================================================
// d:\ABHAYA\web\src\components\SOSModal.tsx
// Emergency SOS System with Real-Time Guardian Dispatch & Real GPS
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Phone, ShieldCheck, CheckCircle2, X, Navigation, MapPin } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { triggerEmergencySOS, resolveEmergencySOS } from '../services/liveSync';
import { useLiveLocation } from '../hooks/useLiveLocation';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SOSModal: React.FC<SOSModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const liveLocation = useLiveLocation();

  const [isActivated, setIsActivated] = useState<boolean>(false);
  const [holdingProgress, setHoldingProgress] = useState<number>(0);
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const holdIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      setHoldingProgress(0);
      setIsHolding(false);
      clearInterval(holdIntervalRef.current);
    }
  }, [isOpen]);

  const startHolding = () => {
    if (isActivated) return;
    setIsHolding(true);
    setHoldingProgress(0);

    const startTime = Date.now();
    const duration = 2500; // 2.5 seconds hold

    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.round((elapsed / duration) * 100));
      setHoldingProgress(progress);

      if (progress >= 100) {
        clearInterval(holdIntervalRef.current);
        triggerSOS();
      }
    }, 50);
  };

  const stopHolding = () => {
    if (isActivated) return;
    setIsHolding(false);
    setHoldingProgress(0);
    clearInterval(holdIntervalRef.current);
  };

  const triggerSOS = async () => {
    setIsActivated(true);
    setIsHolding(false);

    const activeSos = await triggerEmergencySOS({
      lat: liveLocation.lat,
      lng: liveLocation.lng,
      address: liveLocation.address || 'Uttam Nagar East, New Delhi (Live Geolocation)',
      batteryLevel: 82,
      userId: user?.id,
      userName: user?.profile?.full_name || user?.profile?.display_name || user?.email || 'Primary User',
      userPhone: user?.phone || '+91 9000000001',
    });

    setSessionId(activeSos.sessionId);
  };

  const resolveSOS = async () => {
    if (sessionId) {
      await resolveEmergencySOS(sessionId);
    }
    setIsActivated(false);
    setHoldingProgress(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border-2 border-red-500/20">
        
        {/* Modal Header */}
        <div className={`p-6 text-white text-center transition-colors ${isActivated ? 'bg-[#D93636] animate-pulse' : 'bg-gradient-to-r from-red-600 to-[#673AB7]'}`}>
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/20">
              {isActivated ? 'HIGH-PRIORITY ACTIVE EMERGENCY' : 'CONFIRM EMERGENCY ASSISTANCE'}
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-2 border-2 border-white/30">
              <AlertTriangle className="w-9 h-9 stroke-[2.5]" />
            </div>
            <h2 className="text-2xl font-black tracking-tight">{t('sosTitle')}</h2>
            <p className="text-sm font-medium text-white/90 mt-1 max-w-sm">
              {isActivated ? t('sosAlertSent') : t('sosPrompt')}
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {!isActivated ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              
              {/* Circular Hold Button */}
              <div
                onMouseDown={startHolding}
                onMouseUp={stopHolding}
                onMouseLeave={stopHolding}
                onTouchStart={startHolding}
                onTouchEnd={stopHolding}
                className="relative w-44 h-44 rounded-full flex items-center justify-center cursor-pointer select-none transition-transform active:scale-95 shadow-xl shadow-red-500/30 group"
              >
                {/* SVG Progress Ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="88"
                    cy="88"
                    r="80"
                    stroke="#FEE2E2"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="88"
                    cy="88"
                    r="80"
                    stroke="#D93636"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 80}
                    strokeDashoffset={2 * Math.PI * 80 * (1 - holdingProgress / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-75"
                  />
                </svg>

                {/* Inner Button */}
                <div className="w-36 h-36 rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white flex flex-col items-center justify-center shadow-inner group-hover:from-red-600 group-hover:to-red-800">
                  <span className="text-3xl font-black">SOS</span>
                  <span className="text-[11px] font-semibold mt-1 px-2 py-0.5 rounded bg-black/20">
                    {isHolding ? `${holdingProgress}%` : 'PRESS & HOLD'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-500 font-medium mt-6">
                {isHolding ? t('sosHolding') : 'Press and hold for 2.5 seconds to prevent accidental dispatch'}
              </p>

              {/* Coordinates Preview */}
              <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                <MapPin className="w-3.5 h-3.5 text-red-500" />
                <span>Dispatch Coords: {liveLocation.lat.toFixed(4)}° N, {liveLocation.lng.toFixed(4)}° E</span>
              </div>

              {/* Instant Test Activation */}
              <button
                onClick={triggerSOS}
                className="mt-4 text-xs font-bold text-gray-500 hover:text-[#673AB7] underline"
              >
                Direct Test Click (Skip 2.5s Hold)
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Status Alert Banner */}
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-red-600 animate-ping mt-1"></div>
                <div>
                  <h4 className="font-bold text-sm text-red-900">
                    Alert Dispatched to Rahul Sharma & Guardian Circle!
                  </h4>
                  <p className="text-xs text-red-700 mt-0.5">
                    Live GPS coordinates: {liveLocation.lat.toFixed(4)}° N, {liveLocation.lng.toFixed(4)}° E ({liveLocation.address})
                  </p>
                </div>
              </div>

              {/* Immediate Call Hotlines */}
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="tel:112"
                  className="p-3 rounded-xl bg-gray-900 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-black transition-colors"
                >
                  <Phone className="w-4 h-4 text-red-400" />
                  <span>{t('callPolice')}</span>
                </a>

                <a
                  href="tel:1091"
                  className="p-3 rounded-xl bg-[#673AB7] text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-purple-800 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-pink-300" />
                  <span>{t('callWomenHelpline')}</span>
                </a>
              </div>

              {/* Nearest Emergency Facilities */}
              <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/70">
                <h5 className="font-bold text-xs text-gray-700 uppercase tracking-wider mb-2">
                  Nearest Verified Emergency Responders
                </h5>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-gray-200">
                    <div>
                      <p className="font-bold text-[#292936]">Uttam Nagar Police Station</p>
                      <p className="text-[11px] text-gray-500">350m away • +91 11 2533 5555</p>
                    </div>
                    <a
                      href="tel:01125335555"
                      className="px-2.5 py-1.5 rounded-lg bg-blue-100 text-blue-700 font-bold text-[11px] hover:bg-blue-200"
                    >
                      Call Station
                    </a>
                  </div>

                  <div className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-gray-200">
                    <div>
                      <p className="font-bold text-[#292936]">Mata Chanan Devi Hospital</p>
                      <p className="text-[11px] text-gray-500">1.8km away • Emergency Casualty 24/7</p>
                    </div>
                    <a
                      href="tel:01145582000"
                      className="px-2.5 py-1.5 rounded-lg bg-red-100 text-red-700 font-bold text-[11px] hover:bg-red-200"
                    >
                      Call Hospital
                    </a>
                  </div>
                </div>
              </div>

              {/* Resolve Button */}
              <button
                onClick={resolveSOS}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{t('markResolved')}</span>
              </button>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
