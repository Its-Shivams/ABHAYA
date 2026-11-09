// ============================================================
// d:\ABHAYA\web\src\components\MapComponent.tsx
// Resilient Map Service Abstraction (Google Maps & Leaflet OpenStreetMap)
// With Layer Filters, Auto-fit Bounds & gm_authFailure Fallback
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { loadGoogleMaps, onGoogleMapsAuthFailure } from '../services/gmapsLoader';
import { Layers, Shield, PhoneCall, Eye, Sun, Wifi, AlertTriangle } from 'lucide-react';

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  'AIzaSyC3OcH3lzZj7mTW4vK9XZG9SD1gWP89MqU';

export interface MapLayerFilters {
  streetlights?: boolean;
  cctv?: boolean;
  police?: boolean;
  hospitals?: boolean;
  community?: boolean;
  mobileNetwork?: boolean;
}

export interface MapMarker {
  lat: number;
  lng: number;
  title: string;
  type?: 'user' | 'police' | 'hospital' | 'metro' | 'hazard' | 'destination' | 'cctv' | 'light';
  description?: string;
}

export interface MapRoute {
  coordinates: [number, number][];
  color: string;
  name?: string;
  zone?: string;
  isRecommended?: boolean;
}

interface MapComponentProps {
  center?: [number, number];
  zoom?: number;
  routes?: MapRoute[];
  markers?: MapMarker[];
  height?: string;
  interactive?: boolean;
  showLayerControls?: boolean;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  center = [28.623, 77.065],
  zoom = 13,
  routes = [],
  markers = [],
  height = '420px',
  interactive = true,
  showLayerControls = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const leafletLayersRef = useRef<L.LayerGroup | null>(null);
  const googleMapRef = useRef<any>(null);
  const googleOverlaysRef = useRef<{ markers: any[]; polylines: any[] }>({ markers: [], polylines: [] });

  const [activeEngine, setActiveEngine] = useState<'google' | 'leaflet'>('leaflet');
  const [layers, setLayers] = useState<MapLayerFilters>({
    streetlights: true,
    cctv: true,
    police: true,
    hospitals: true,
    community: true,
    mobileNetwork: true,
  });
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState<boolean>(false);

  // Initialize and handle engine selection
  useEffect(() => {
    let isSubscribed = true;

    // Listen for Google Maps auth failure (billing / referrer restrictions)
    const unsubscribeAuthFailure = onGoogleMapsAuthFailure(() => {
      if (isSubscribed) {
        console.warn('Switching to high-performance Leaflet OpenStreetMap engine');
        setActiveEngine('leaflet');
        if (containerRef.current) {
          initLeafletMap();
        }
      }
    });

    // Attempt Google Maps load
    loadGoogleMaps(GOOGLE_MAPS_API_KEY).then((success) => {
      if (!isSubscribed) return;
      if (success && (window as any).google?.maps && containerRef.current) {
        setActiveEngine('google');
        initGoogleMap();
      } else {
        setActiveEngine('leaflet');
        initLeafletMap();
      }
    });

    return () => {
      isSubscribed = false;
      unsubscribeAuthFailure();
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // ─── Leaflet Map Initialization ─────────────────────────────
  const initLeafletMap = () => {
    if (!containerRef.current) return;

    if (!leafletMapRef.current) {
      containerRef.current.innerHTML = '';
      const map = L.map(containerRef.current, {
        center,
        zoom,
        zoomControl: false, // Custom placed zoom controls
        attributionControl: false,
      });

      // CARTO Voyager modern clean vector-style tiles (safe, high contrast, clean)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Add zoom control at bottom-right
      if (interactive) {
        L.control.zoom({ position: 'bottomright' }).addTo(map);
      }

      const layerGroup = L.layerGroup().addTo(map);
      leafletLayersRef.current = layerGroup;
      leafletMapRef.current = map;
    } else {
      leafletMapRef.current.setView(center, zoom);
    }

    updateLeafletLayers();
  };

  const updateLeafletLayers = () => {
    const map = leafletMapRef.current;
    const layerGroup = leafletLayersRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. Draw Routes
    const allLatLngs: [number, number][] = [];
    routes.forEach((r, idx) => {
      if (r.coordinates && r.coordinates.length > 0) {
        r.coordinates.forEach((c) => allLatLngs.push(c));

        const polyline = L.polyline(r.coordinates, {
          color: r.color || '#673AB7',
          weight: r.isRecommended ? 6 : 4,
          opacity: r.isRecommended ? 0.95 : 0.65,
          lineJoin: 'round',
          dashArray: r.zone === 'C' ? '4, 8' : undefined,
        });

        if (r.name) {
          polyline.bindPopup(`
            <div style="font-family:Inter,sans-serif;padding:4px;min-width:140px;">
              <b style="color:#252238;font-size:12px;">${r.name}</b>
              <p style="font-size:11px;color:#777487;margin-top:2px;">Safety Zone: <b style="color:${r.color};">${r.zone || 'Evaluated'}</b></p>
            </div>
          `);
        }
        layerGroup.addLayer(polyline);
      }
    });

    // 2. Filter & Render Markers based on active layer controls
    markers.forEach((m) => {
      // Check layer filters
      if (m.type === 'police' && !layers.police) return;
      if (m.type === 'hospital' && !layers.hospitals) return;
      if (m.type === 'hazard' && !layers.community) return;
      if (m.type === 'cctv' && !layers.cctv) return;
      if (m.type === 'light' && !layers.streetlights) return;

      allLatLngs.push([m.lat, m.lng]);

      let iconHtml = '';
      if (m.type === 'user') {
        iconHtml = `<div class="relative flex items-center justify-center">
          <div class="animate-ping absolute w-7 h-7 rounded-full bg-[#673AB7] opacity-60"></div>
          <div class="w-4 h-4 bg-[#673AB7] border-2 border-white rounded-full shadow-lg"></div>
        </div>`;
      } else if (m.type === 'destination') {
        iconHtml = `<div class="bg-[#DC2626] text-white p-1 rounded-full shadow-md text-xs font-bold border-2 border-white flex items-center justify-center w-7 h-7 animate-bounce">🏁</div>`;
      } else if (m.type === 'police') {
        iconHtml = `<div class="bg-blue-600 text-white p-1 rounded-full shadow-md text-xs font-bold border-2 border-white flex items-center justify-center w-7 h-7">👮</div>`;
      } else if (m.type === 'hospital') {
        iconHtml = `<div class="bg-red-600 text-white p-1 rounded-full shadow-md text-xs font-bold border-2 border-white flex items-center justify-center w-7 h-7">🏥</div>`;
      } else if (m.type === 'metro') {
        iconHtml = `<div class="bg-[#16A34A] text-white p-1 rounded-full shadow-md text-xs font-bold border-2 border-white flex items-center justify-center w-7 h-7">🚇</div>`;
      } else if (m.type === 'hazard') {
        iconHtml = `<div class="bg-[#F59E0B] text-white p-1 rounded-full shadow-md text-xs font-bold border-2 border-white flex items-center justify-center w-7 h-7">⚠️</div>`;
      } else {
        iconHtml = `<div class="bg-[#673AB7] text-white p-1 rounded-full shadow-md text-xs font-bold border-2 border-white flex items-center justify-center w-7 h-7">📍</div>`;
      }

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-abhaya-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([m.lat, m.lng], { icon: customIcon });
      if (m.title || m.description) {
        marker.bindPopup(`
          <div style="font-family:Inter,sans-serif;padding:4px;max-width:200px;">
            <b style="color:#252238;font-size:12px;">${m.title}</b>
            ${m.description ? `<p style="font-size:11px;color:#777487;margin-top:2px;">${m.description}</p>` : ''}
          </div>
        `);
      }
      layerGroup.addLayer(marker);
    });

    // Auto-fit bounds if we have routes or multiple markers
    if (allLatLngs.length > 1) {
      try {
        const bounds = L.latLngBounds(allLatLngs);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      } catch {}
    }
  };

  // ─── Google Maps Map Initialization (If Available) ──────────
  const initGoogleMap = () => {
    if (!containerRef.current || !(window as any).google?.maps) return;

    containerRef.current.innerHTML = '';
    const google = (window as any).google;

    const map = new google.maps.Map(containerRef.current, {
      center: { lat: center[0], lng: center[1] },
      zoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: interactive,
      styles: [
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
      ],
    });

    googleMapRef.current = map;
    updateGoogleOverlays();
  };

  const updateGoogleOverlays = () => {
    const map = googleMapRef.current;
    const google = (window as any).google;
    if (!map || !google?.maps) return;

    googleOverlaysRef.current.markers.forEach((m) => m.setMap(null));
    googleOverlaysRef.current.polylines.forEach((p) => p.setMap(null));
    googleOverlaysRef.current = { markers: [], polylines: [] };

    const bounds = new google.maps.LatLngBounds();

    routes.forEach((r) => {
      const path = r.coordinates.map(([lat, lng]) => {
        const pt = new google.maps.LatLng(lat, lng);
        bounds.extend(pt);
        return pt;
      });

      const polyline = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: r.color || '#673AB7',
        strokeOpacity: r.isRecommended ? 0.95 : 0.65,
        strokeWeight: r.isRecommended ? 6 : 4,
      });
      polyline.setMap(map);
      googleOverlaysRef.current.polylines.push(polyline);
    });

    markers.forEach((m) => {
      if (m.type === 'police' && !layers.police) return;
      if (m.type === 'hospital' && !layers.hospitals) return;
      if (m.type === 'hazard' && !layers.community) return;

      const pos = new google.maps.LatLng(m.lat, m.lng);
      bounds.extend(pos);

      const marker = new google.maps.Marker({
        position: pos,
        map,
        title: m.title,
      });

      if (m.title || m.description) {
        const infowindow = new google.maps.InfoWindow({
          content: `<div style="font-family:Inter,sans-serif;padding:4px;"><b style="color:#252238;">${m.title}</b><p style="font-size:11px;color:#777487;margin-top:2px;">${m.description || ''}</p></div>`,
        });
        marker.addListener('click', () => {
          infowindow.open(map, marker);
        });
      }

      googleOverlaysRef.current.markers.push(marker);
    });

    if (routes.length > 0 && !bounds.isEmpty()) {
      map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    }
  };

  useEffect(() => {
    if (activeEngine === 'google') {
      updateGoogleOverlays();
    } else {
      updateLeafletLayers();
    }
  }, [routes, markers, layers, activeEngine]);

  const toggleLayer = (layerKey: keyof MapLayerFilters) => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-sm border border-gray-200/80 bg-white">
      <div ref={containerRef} style={{ height, width: '100%' }} />

      {/* Top Left: Map Engine Status */}
      <div className="absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-gray-200 flex items-center gap-2 text-xs font-semibold text-[#252238]">
        <span className={`w-2 h-2 rounded-full ${activeEngine === 'google' ? 'bg-blue-600' : 'bg-emerald-600'} animate-pulse`}></span>
        <span>{activeEngine === 'google' ? 'Google Maps Service' : 'ABHAYA Dynamic Safety Map'}</span>
      </div>

      {/* Top Right: Layer Filter Controls */}
      {showLayerControls && (
        <div className="absolute top-3 right-3 z-[400]">
          <div className="relative">
            <button
              onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
              className="px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md text-xs font-bold text-[#252238] shadow-sm border border-gray-200 hover:border-[#673AB7] flex items-center gap-1.5 transition-all"
            >
              <Layers className="w-3.5 h-3.5 text-[#673AB7]" />
              <span>Safety Layers</span>
            </button>

            {isLayerMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl p-3 shadow-xl border border-gray-100 space-y-2 text-xs animate-fadeIn">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#777487] mb-1">
                  Toggle Map Indicators
                </p>

                <label className="flex items-center justify-between cursor-pointer py-1 border-b border-gray-50">
                  <span className="flex items-center gap-1.5 text-gray-700">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>Streetlights</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.streetlights}
                    onChange={() => toggleLayer('streetlights')}
                    className="accent-[#673AB7]"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer py-1 border-b border-gray-50">
                  <span className="flex items-center gap-1.5 text-gray-700">
                    <Eye className="w-3.5 h-3.5 text-purple-600" />
                    <span>CCTV Cameras</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.cctv}
                    onChange={() => toggleLayer('cctv')}
                    className="accent-[#673AB7]"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer py-1 border-b border-gray-50">
                  <span className="flex items-center gap-1.5 text-gray-700">
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    <span>Police Stations</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.police}
                    onChange={() => toggleLayer('police')}
                    className="accent-[#673AB7]"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer py-1 border-b border-gray-50">
                  <span className="flex items-center gap-1.5 text-gray-700">
                    <PhoneCall className="w-3.5 h-3.5 text-red-600" />
                    <span>Hospitals</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.hospitals}
                    onChange={() => toggleLayer('hospitals')}
                    className="accent-[#673AB7]"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer py-1">
                  <span className="flex items-center gap-1.5 text-gray-700">
                    <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mobile Signal</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.mobileNetwork}
                    onChange={() => toggleLayer('mobileNetwork')}
                    className="accent-[#673AB7]"
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
