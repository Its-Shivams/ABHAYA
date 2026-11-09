// ============================================================
// d:\ABHAYA\web\src\pages\SafeRoutesPage.tsx
// Smart Safe Route Navigation — Core Safety Intelligence Module
// 8-Factor Weighted Scoring with Live Autocomplete & GPS Reverse Geocode
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  Navigation,
  ShieldCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Info,
  MapPin,
  Sparkles,
  Crosshair,
  Loader2,
  Search,
  X,
  Wifi,
  Sun,
  Eye,
  Shield,
  Activity,
  Layers,
  PhoneCall,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { RouteOption, PlaceSuggestion } from '../types';
import { fetchSafeRoutes, fetchPlaceSuggestions, reverseGeocodeCoordinates } from '../services/api';
import { MapComponent, MapRoute, MapMarker } from '../components/MapComponent';
import { useLiveLocation } from '../hooks/useLiveLocation';

interface SafeRoutesPageProps {
  onStartJourneyWithRoute: (route: RouteOption) => void;
}

export const SafeRoutesPage: React.FC<SafeRoutesPageProps> = ({ onStartJourneyWithRoute }) => {
  const { t } = useLanguage();
  const liveLocation = useLiveLocation();

  // Starting location state
  const [originText, setOriginText] = useState<string>('Uttam Nagar East Metro Station, New Delhi');
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number }>({
    lat: 28.6186,
    lng: 77.0545,
  });
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsStatus, setGpsStatus] = useState<string>('');

  // Destination location state
  const [destText, setDestText] = useState<string>('Janakpuri District Centre, New Delhi');
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number }>({
    lat: 28.6289,
    lng: 77.0789,
  });

  // Autocomplete suggestions
  const [originSuggestions, setOriginSuggestions] = useState<PlaceSuggestion[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearchingDest, setIsSearchingDest] = useState<boolean>(false);
  const [isSearchingOrigin, setIsSearchingOrigin] = useState<boolean>(false);
  const [activeDropdown, setActiveDropdown] = useState<'origin' | 'dest' | null>(null);

  // Routes & Calculation State
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'breakdown'>('overview');

  const originSearchTimerRef = useRef<any>(null);
  const destSearchTimerRef = useRef<any>(null);

  // Initial load
  useEffect(() => {
    handleCalculateRoutes();
  }, []);

  // ─── GPS "Use My Current Location" ──────────────────────────
  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    setGpsStatus('Requesting GPS permission...');

    if (!navigator.geolocation) {
      setGpsStatus('Geolocation not supported by your browser');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setOriginCoords({ lat, lng });
        setGpsStatus('Resolving street address...');

        try {
          const res = await reverseGeocodeCoordinates(lat, lng);
          setOriginText(res.formattedAddress || `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`);
          setGpsStatus('Current GPS position locked');
        } catch {
          setOriginText(`GPS Location (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`);
          setGpsStatus('Coordinates locked');
        } finally {
          setIsLocating(false);
          setTimeout(() => setGpsStatus(''), 4000);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus('GPS permission denied. Please enter address manually.');
        } else {
          setGpsStatus('GPS unavailable. Using fallback location.');
        }
        setTimeout(() => setGpsStatus(''), 5000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // ─── Destination Autocomplete Search (Debounced) ───────────
  const handleDestInputChange = (value: string) => {
    setDestText(value);
    setActiveDropdown('dest');

    if (destSearchTimerRef.current) clearTimeout(destSearchTimerRef.current);

    if (value.trim().length < 2) {
      setDestSuggestions([]);
      return;
    }

    setIsSearchingDest(true);
    destSearchTimerRef.current = setTimeout(async () => {
      const suggestions = await fetchPlaceSuggestions(value);
      setDestSuggestions(suggestions);
      setIsSearchingDest(false);
    }, 300);
  };

  const handleSelectDestSuggestion = (p: PlaceSuggestion) => {
    setDestText(p.fullAddress);
    setDestCoords({ lat: p.lat, lng: p.lng });
    setDestSuggestions([]);
    setActiveDropdown(null);
  };

  // ─── Origin Autocomplete Search (Debounced) ────────────────
  const handleOriginInputChange = (value: string) => {
    setOriginText(value);
    setActiveDropdown('origin');

    if (originSearchTimerRef.current) clearTimeout(originSearchTimerRef.current);

    if (value.trim().length < 2) {
      setOriginSuggestions([]);
      return;
    }

    setIsSearchingOrigin(true);
    originSearchTimerRef.current = setTimeout(async () => {
      const suggestions = await fetchPlaceSuggestions(value);
      setOriginSuggestions(suggestions);
      setIsSearchingOrigin(false);
    }, 300);
  };

  const handleSelectOriginSuggestion = (p: PlaceSuggestion) => {
    setOriginText(p.fullAddress);
    setOriginCoords({ lat: p.lat, lng: p.lng });
    setOriginSuggestions([]);
    setActiveDropdown(null);
  };

  // ─── Calculate Safe Routes ──────────────────────────────────
  const handleCalculateRoutes = async () => {
    setIsLoadingRoutes(true);
    try {
      const results = await fetchSafeRoutes(originCoords, destCoords);
      setRoutes(results);
      if (results.length > 0) {
        setSelectedRoute(results[0]);
      }
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  // Prepare map overlays
  const mapRoutes: MapRoute[] = routes.map((r) => ({
    coordinates: r.coordinates,
    color: r.id === selectedRoute?.id ? (r.zone === 'A' ? '#16A34A' : r.zone === 'B' ? '#F59E0B' : '#DC2626') : '#A1A1AA',
    name: r.name,
    zone: r.zone,
    isRecommended: r.id === selectedRoute?.id,
  }));

  const mapMarkers: MapMarker[] = [
    {
      lat: originCoords.lat,
      lng: originCoords.lng,
      title: 'Starting Point',
      type: 'user',
      description: originText,
    },
    {
      lat: destCoords.lat,
      lng: destCoords.lng,
      title: 'Destination',
      type: 'destination',
      description: destText,
    },
    {
      lat: 28.6195,
      lng: 77.0562,
      title: 'Delhi Police Pink Booth',
      type: 'police',
      description: 'Dedicated 24x7 Women Safety Patrol Station',
    },
    {
      lat: 28.6255,
      lng: 77.0845,
      title: 'Mata Chanan Devi Hospital',
      type: 'hospital',
      description: 'Emergency Medical & Trauma Care',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#673AB7] flex items-center justify-center border border-purple-100">
              <Navigation className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#252238] tracking-tight">
                {t('navSafeRoutes')}
              </h1>
              <p className="text-xs text-[#777487] mt-0.5">
                Evaluates streetlighting, footfall, CCTV coverage, police proximity and cellular reliability.
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50/70 border border-purple-100 text-[11px] text-[#673AB7] font-medium">
          <Info className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Recommended safer routes based on multi-factor weighted safety models</span>
        </div>
      </div>

      {/* Main Grid: Left Controls (5 cols) + Right Map (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Location Inputs, GPS & Route Alternatives */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Card 1: Route Search Box */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200/80 space-y-4">
            
            {/* Origin Input */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#777487]">
                  {t('sourceLocation')}
                </label>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocating}
                  className="text-xs font-bold text-[#673AB7] hover:text-purple-800 flex items-center gap-1 transition-colors"
                >
                  {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Crosshair className="w-3.5 h-3.5" />}
                  <span>{isLocating ? 'Detecting GPS...' : 'Use My Current Location'}</span>
                </button>
              </div>

              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-emerald-600" />
                <input
                  type="text"
                  value={originText}
                  onChange={(e) => handleOriginInputChange(e.target.value)}
                  onFocus={() => setActiveDropdown('origin')}
                  placeholder="Enter starting street or landmark..."
                  className="w-full pl-9 pr-8 py-2.5 text-xs font-medium rounded-xl border border-gray-200 focus:outline-none focus:border-[#673AB7] focus:ring-2 focus:ring-purple-100 transition-all text-[#252238]"
                />
                {originText && (
                  <button
                    onClick={() => { setOriginText(''); setOriginSuggestions([]); }}
                    className="absolute right-2.5 top-3 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {gpsStatus && (
                <p className="text-[10px] text-purple-700 font-medium mt-1 animate-fadeIn flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse"></span>
                  {gpsStatus}
                </p>
              )}

              {/* Origin Autocomplete Dropdown */}
              {activeDropdown === 'origin' && originSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 z-50 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden divide-y divide-gray-50 animate-fadeIn">
                  {originSuggestions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectOriginSuggestion(s)}
                      className="w-full text-left p-3 hover:bg-purple-50/70 transition-colors flex items-start gap-2.5"
                    >
                      <MapPin className="w-4 h-4 text-[#673AB7] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-xs text-[#252238]">{s.mainText}</p>
                        <p className="text-[10px] text-[#777487]">{s.secondaryText}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Destination Input */}
            <div className="relative">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#777487] mb-1.5">
                {t('destinationLocation')}
              </label>

              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-[#DC2626]" />
                <input
                  type="text"
                  value={destText}
                  onChange={(e) => handleDestInputChange(e.target.value)}
                  onFocus={() => setActiveDropdown('dest')}
                  placeholder="Enter destination, metro, hospital or market..."
                  className="w-full pl-9 pr-8 py-2.5 text-xs font-medium rounded-xl border border-gray-200 focus:outline-none focus:border-[#673AB7] focus:ring-2 focus:ring-purple-100 transition-all text-[#252238]"
                />
                {destText && (
                  <button
                    onClick={() => { setDestText(''); setDestSuggestions([]); }}
                    className="absolute right-2.5 top-3 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Destination Autocomplete Dropdown */}
              {activeDropdown === 'dest' && destSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 z-50 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden divide-y divide-gray-50 animate-fadeIn">
                  {destSuggestions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectDestSuggestion(s)}
                      className="w-full text-left p-3 hover:bg-purple-50/70 transition-colors flex items-start gap-2.5"
                    >
                      <MapPin className="w-4 h-4 text-[#DC2626] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-xs text-[#252238]">{s.mainText}</p>
                        <p className="text-[10px] text-[#777487]">{s.secondaryText}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Calculate Button */}
            <button
              onClick={handleCalculateRoutes}
              disabled={isLoadingRoutes}
              className="w-full py-3 rounded-xl bg-[#673AB7] hover:bg-purple-800 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              {isLoadingRoutes ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{isLoadingRoutes ? 'Calculating Safest Routes...' : 'Calculate Safe Routes'}</span>
            </button>
          </div>

          {/* Card 2: Route Alternatives List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#777487]">
                Evaluated Alternative Routes ({routes.length})
              </h2>
              <span className="text-[11px] text-[#777487]">8-Factor Scored</span>
            </div>

            {routes.map((r) => {
              const isSelected = selectedRoute?.id === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRoute(r)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-[#673AB7] shadow-md ring-2 ring-purple-100'
                      : 'bg-white hover:bg-gray-50/80 border-gray-200/80 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        {r.isRecommended && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-[#16A34A] uppercase tracking-wide">
                            Recommended
                          </span>
                        )}
                        <h3 className="font-black text-sm text-[#252238]">{r.name}</h3>
                      </div>
                      <p className="text-[11px] text-[#777487] mt-1">{r.via}</p>
                    </div>

                    {/* Safety Score Badge */}
                    <div className="text-right flex-shrink-0">
                      <div
                        className="px-2.5 py-1 rounded-xl font-black text-xs inline-block text-white"
                        style={{ backgroundColor: r.zoneColor }}
                      >
                        {r.safetyScore}/100
                      </div>
                      <p className="text-[10px] font-bold mt-0.5" style={{ color: r.zoneColor }}>
                        Zone {r.zone}
                      </p>
                    </div>
                  </div>

                  {/* Distance & Time Specs */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100 text-center">
                    <div className="bg-gray-50/70 p-2 rounded-xl">
                      <span className="text-[10px] text-[#777487] block">Distance</span>
                      <span className="font-bold text-xs text-[#252238]">{r.distanceKm} km</span>
                    </div>
                    <div className="bg-gray-50/70 p-2 rounded-xl">
                      <span className="text-[10px] text-[#777487] block">Est. Time</span>
                      <span className="font-bold text-xs text-[#252238]">{r.durationMinutes} mins</span>
                    </div>
                    <div className="bg-gray-50/70 p-2 rounded-xl">
                      <span className="text-[10px] text-[#777487] block">Data Confidence</span>
                      <span className="font-bold text-xs text-purple-700">{r.confidencePercent || 90}%</span>
                    </div>
                  </div>

                  {/* Trade-off explanation */}
                  {r.tradeoffExplanation && (
                    <p className="text-[11px] text-[#777487] mt-2.5 bg-gray-50 p-2 rounded-xl leading-relaxed">
                      💡 <strong>Trade-off:</strong> {r.tradeoffExplanation}
                    </p>
                  )}

                  {/* Action on selected */}
                  {isSelected && (
                    <div className="mt-3.5 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[#16A34A] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Selected on Map
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartJourneyWithRoute(r);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-[#673AB7] hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <span>Start Journey with Route</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Column: Large Interactive Map & 8-Factor Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Interactive Map */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200/80 space-y-3">
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="font-bold text-sm text-[#252238]">
                  {selectedRoute ? selectedRoute.name : 'Corridor Safety View'}
                </h3>
                <p className="text-[11px] text-[#777487]">
                  Green = Safe (Zone A) • Amber = Moderate Caution (Zone B) • Red = High Risk (Zone C)
                </p>
              </div>
            </div>

            <MapComponent
              center={[originCoords.lat, originCoords.lng]}
              zoom={13}
              height="440px"
              routes={mapRoutes}
              markers={mapMarkers}
              showLayerControls={true}
            />
          </div>

          {/* 8-Factor Safety Breakdown Card */}
          {selectedRoute && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200/80 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#673AB7]" />
                  <h3 className="font-bold text-sm text-[#252238]">8-Factor Safety Analysis</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-[#777487]">
                    Confidence: <strong>{selectedRoute.confidencePercent || 92}%</strong>
                  </span>
                </div>
              </div>

              {/* 8 Factors Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                
                {/* 1. Incident Record */}
                <div className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100/70 text-xs">
                  <span className="text-[10px] text-[#777487] block font-semibold">Incident Record (20%)</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-bold text-sm text-[#252238]">{selectedRoute.parameters?.incidentScore ?? 84}/100</span>
                    <span className="text-[10px] text-emerald-700 font-bold">Good</span>
                  </div>
                </div>

                {/* 2. Streetlights */}
                <div className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-100/70 text-xs">
                  <span className="text-[10px] text-[#777487] block font-semibold">Streetlights (15%)</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-bold text-sm text-[#252238]">{selectedRoute.parameters?.streetlightScore ?? 88}%</span>
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                </div>

                {/* 3. Footfall */}
                <div className="p-2.5 rounded-xl bg-blue-50/50 border border-blue-100/70 text-xs">
                  <span className="text-[10px] text-[#777487] block font-semibold">Footfall (15%)</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-bold text-sm text-[#252238]">{selectedRoute.parameters?.publicActivityScore ?? 86}/100</span>
                    <Activity className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                </div>

                {/* 4. CCTV */}
                <div className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100/70 text-xs">
                  <span className="text-[10px] text-[#777487] block font-semibold">CCTV Coverage (10%)</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-bold text-sm text-[#252238]">{selectedRoute.parameters?.cctvScore ?? 80}%</span>
                    <Eye className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                </div>

                {/* 5. Police Proximity */}
                <div className="p-2.5 rounded-xl bg-indigo-50/50 border border-indigo-100/70 text-xs">
                  <span className="text-[10px] text-[#777487] block font-semibold">Police Proximity (10%)</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-bold text-sm text-[#252238]">{selectedRoute.parameters?.policeScore ?? 85}/100</span>
                    <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                </div>

                {/* 6. Hospital Access */}
                <div className="p-2.5 rounded-xl bg-red-50/50 border border-red-100/70 text-xs">
                  <span className="text-[10px] text-[#777487] block font-semibold">Hospital Access (5%)</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-bold text-sm text-[#252238]">{selectedRoute.parameters?.hospitalScore ?? 80}/100</span>
                    <PhoneCall className="w-3.5 h-3.5 text-red-500" />
                  </div>
                </div>

                {/* 7. Community Reports */}
                <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100/70 text-xs">
                  <span className="text-[10px] text-[#777487] block font-semibold">Community Score (10%)</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-bold text-sm text-[#252238]">{selectedRoute.parameters?.communityScore ?? 86}/100</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                </div>

                {/* 8. Mobile Network Availability */}
                <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100/70 text-xs">
                  <span className="text-[10px] text-[#777487] block font-semibold">Cellular Signal (15%)</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-bold text-sm text-[#252238]">
                      {selectedRoute.parameters?.mobileNetworkScore !== null && selectedRoute.parameters?.mobileNetworkScore !== undefined
                        ? `${selectedRoute.parameters.mobileNetworkScore}%`
                        : 'Unverified'}
                    </span>
                    <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                </div>

              </div>

              {/* Safety Reason Summary */}
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-xs text-[#252238]">
                <p className="font-semibold">{selectedRoute.reason}</p>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
