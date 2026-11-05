// ============================================================
// d:\ABHAYA\web\src\pages\SafeRoutesPage.tsx
// Smart Safe Route Navigation — Core Safety Intelligence Module
// Evaluates road segments with 7-parameter weighted scoring
// ============================================================

import React, { useState, useEffect } from 'react';
import { Navigation, ShieldCheck, Clock, AlertTriangle, CheckCircle2, ChevronRight, Info, MapPin, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { RouteOption } from '../types';
import { fetchSafeRoutes } from '../services/api';
import { MapComponent } from '../components/MapComponent';

interface SafeRoutesPageProps {
  onStartJourneyWithRoute: (route: RouteOption) => void;
}

export const SafeRoutesPage: React.FC<SafeRoutesPageProps> = ({ onStartJourneyWithRoute }) => {
  const { t } = useLanguage();

  const [originText, setOriginText] = useState<string>('Uttam Nagar East Metro, New Delhi');
  const [destText, setDestText] = useState<string>('Janakpuri District Centre, New Delhi');
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false);

  // Initial load
  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    setIsLoading(true);
    const results = await fetchSafeRoutes(
      { lat: 28.6186, lng: 77.0545 },
      { lat: 28.6289, lng: 77.0789 }
    );
    setRoutes(results);
    if (results.length > 0) {
      setSelectedRoute(results[0]);
    }
    setIsLoading(false);
  };

  const handlePresetSelect = (origin: string, dest: string) => {
    setOriginText(origin);
    setDestText(dest);
    loadRoutes();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#673AB7] flex items-center justify-center">
              <Navigation className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#292936]">
              {t('navSafeRoutes')}
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-xl">
            Unlike standard maps that prioritize only the shortest path, ABHAYA's Safety Engine calculates streetlighting, CCTV, police proximity and crowd footfall.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Presets:
          </span>
          <button
            onClick={() => handlePresetSelect('Uttam Nagar East', 'Janakpuri District Centre')}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-purple-50 hover:text-[#673AB7] transition-colors"
          >
            Uttam Nagar → Janakpuri
          </button>
          <button
            onClick={() => handlePresetSelect('Uttam Nagar West', 'Vikaspuri Block H')}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-purple-50 hover:text-[#673AB7] transition-colors"
          >
            Uttam Nagar → Vikaspuri
          </button>
        </div>
      </div>

      {/* Main Grid: Inputs + Map + Route Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form & Route Alternatives (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Origin & Destination Inputs */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200 space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                {t('sourceLocation')}
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-emerald-600" />
                <input
                  type="text"
                  value={originText}
                  onChange={(e) => setOriginText(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-gray-200 focus:outline-none focus:border-[#673AB7]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                {t('destinationLocation')}
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-[#D93636]" />
                <input
                  type="text"
                  value={destText}
                  onChange={(e) => setDestText(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-gray-200 focus:outline-none focus:border-[#673AB7]"
                />
              </div>
            </div>

            <button
              onClick={loadRoutes}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#673AB7] hover:bg-purple-800 text-white font-bold text-xs shadow-md shadow-[#673AB7]/20 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isLoading ? 'Evaluating Road Safety...' : t('findRouteBtn')}</span>
            </button>
          </div>

          {/* Route Comparison Cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              {t('routeComparison')} ({routes.length} Available)
            </h3>

            {routes.map((r) => {
              const isSelected = selectedRoute?.id === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRoute(r)}
                  className={`p-4 rounded-3xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#673AB7] bg-purple-50/30 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {r.isRecommended && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 mb-1.5">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Recommended Safe Path
                        </span>
                      )}
                      <h4 className="font-extrabold text-sm text-[#292936]">{r.name}</h4>
                      <p className="text-xs text-gray-500 font-medium">{r.via}</p>
                    </div>

                    {/* Zone Badge */}
                    <div
                      className="px-2.5 py-1 rounded-xl text-white font-black text-xs text-center min-w-[54px] shadow-sm"
                      style={{ backgroundColor: r.zoneColor }}
                    >
                      <span className="text-[10px] block font-bold opacity-80">ZONE</span>
                      <span className="text-sm font-black">{r.zone}</span>
                    </div>
                  </div>

                  {/* Quick Stats: Safety Score, Distance, Time */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100 text-center">
                    <div className="bg-white/80 p-1.5 rounded-xl border border-gray-100">
                      <span className="text-[10px] text-gray-400 font-semibold block">Safety Score</span>
                      <span className="font-black text-xs" style={{ color: r.zoneColor }}>
                        {r.safetyScore}/100
                      </span>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded-xl border border-gray-100">
                      <span className="text-[10px] text-gray-400 font-semibold block">Distance</span>
                      <span className="font-bold text-xs text-[#292936]">{r.distanceKm} km</span>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded-xl border border-gray-100">
                      <span className="text-[10px] text-gray-400 font-semibold block">Est. Time</span>
                      <span className="font-bold text-xs text-[#292936]">{r.durationMinutes} mins</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-600 mt-2.5 leading-relaxed bg-white/60 p-2 rounded-xl">
                    {r.reason}
                  </p>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Column: Interactive Map & Selected Route Breakdown (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Map Polyline Display */}
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3 px-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedRoute?.zoneColor || '#673AB7' }}></span>
                <span className="font-bold text-xs text-[#292936]">
                  Displaying: {selectedRoute?.name || 'Selected Route'}
                </span>
              </div>
              <span className="text-xs font-semibold text-gray-500">
                Confidence: {selectedRoute?.confidencePercent || 94}%
              </span>
            </div>

            <MapComponent
              center={selectedRoute?.coordinates[1] || [28.623, 77.065]}
              zoom={13}
              height="380px"
              routes={
                selectedRoute
                  ? [
                      {
                        coordinates: selectedRoute.coordinates,
                        color: selectedRoute.zoneColor,
                        name: selectedRoute.name,
                        zone: selectedRoute.zone,
                      },
                    ]
                  : []
              }
              markers={[
                {
                  lat: 28.6186,
                  lng: 77.0545,
                  title: 'Origin: Uttam Nagar East',
                  type: 'user',
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
                {
                  lat: 28.6255,
                  lng: 77.0845,
                  title: 'Mata Chanan Devi Hospital',
                  type: 'hospital',
                },
              ]}
            />
          </div>

          {/* Detailed 7-Parameter Safety Engine Breakdown Card */}
          {selectedRoute && (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#673AB7]" />
                  <h3 className="font-extrabold text-sm text-[#292936]">
                    {t('safetyBreakdown')}
                  </h3>
                </div>
                <button
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className="text-xs font-bold text-[#673AB7] hover:underline"
                >
                  {showBreakdown ? 'Hide Parameters' : 'View Weights'}
                </button>
              </div>

              {/* 7 Factor Progress Bars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex justify-between font-semibold mb-1">
                    <span>Streetlight Illumination (20%)</span>
                    <span className="font-bold text-gray-900">{selectedRoute.parameters.streetlightScore}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${selectedRoute.parameters.streetlightScore}%` }}></div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex justify-between font-semibold mb-1">
                    <span>Public Activity & Footfall (15%)</span>
                    <span className="font-bold text-gray-900">{selectedRoute.parameters.publicActivityScore}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${selectedRoute.parameters.publicActivityScore}%` }}></div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex justify-between font-semibold mb-1">
                    <span>Incident-Free Record (25%)</span>
                    <span className="font-bold text-gray-900">{selectedRoute.parameters.incidentScore}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full" style={{ width: `${selectedRoute.parameters.incidentScore}%` }}></div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex justify-between font-semibold mb-1">
                    <span>Police Proximity (10%)</span>
                    <span className="font-bold text-gray-900">{selectedRoute.parameters.policeScore}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full" style={{ width: `${selectedRoute.parameters.policeScore}%` }}></div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex justify-between font-semibold mb-1">
                    <span>CCTV Coverage (10%)</span>
                    <span className="font-bold text-gray-900">{selectedRoute.parameters.cctvScore}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full" style={{ width: `${selectedRoute.parameters.cctvScore}%` }}></div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex justify-between font-semibold mb-1">
                    <span>Community Reports (15%)</span>
                    <span className="font-bold text-gray-900">{selectedRoute.parameters.communityScore}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${selectedRoute.parameters.communityScore}%` }}></div>
                  </div>
                </div>

              </div>

              {/* Start Navigation Action Button */}
              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Ready to travel safely?</p>
                  <p className="font-bold text-sm text-[#292936]">
                    Share live coordinates with Rahul during this trip.
                  </p>
                </div>

                <button
                  onClick={() => onStartJourneyWithRoute(selectedRoute)}
                  className="py-2.5 px-5 rounded-2xl bg-[#673AB7] hover:bg-purple-800 text-white font-extrabold text-xs shadow-md shadow-[#673AB7]/30 transition-all flex items-center gap-2 active:scale-95"
                >
                  <Navigation className="w-4 h-4" />
                  <span>{t('startNavigation')}</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
