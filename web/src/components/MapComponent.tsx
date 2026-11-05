// ============================================================
// d:\ABHAYA\web\src\components\MapComponent.tsx
// Seamless Google Maps SDK Integration with Zero User-Facing Configuration
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { loadGoogleMaps } from '../services/gmapsLoader';

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  'AIzaSyC3OcH3lzZj7mTW4vK9XZG9SD1gWP89MqU';

interface MapComponentProps {
  center?: [number, number];
  zoom?: number;
  routes?: Array<{
    coordinates: [number, number][];
    color: string;
    name?: string;
    zone?: string;
  }>;
  markers?: Array<{
    lat: number;
    lng: number;
    title: string;
    type?: 'user' | 'police' | 'hospital' | 'metro' | 'hazard' | 'destination';
    description?: string;
  }>;
  height?: string;
  interactive?: boolean;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  center = [28.623, 77.065],
  zoom = 13,
  routes = [],
  markers = [],
  height = '420px',
  interactive = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const leafletLayersRef = useRef<L.LayerGroup | null>(null);
  const googleMapRef = useRef<any>(null);
  const googleOverlaysRef = useRef<{ markers: any[]; polylines: any[] }>({ markers: [], polylines: [] });

  const [activeEngine, setActiveEngine] = useState<'google' | 'leaflet'>('google');

  useEffect(() => {
    if (!containerRef.current) return;

    // Try loading Google Maps with the provided API Key
    loadGoogleMaps(GOOGLE_MAPS_API_KEY).then((success) => {
      if (success && (window as any).google?.maps && containerRef.current) {
        setActiveEngine('google');
        initGoogleMap();
      } else {
        // Fallback to Leaflet OSM if Google Maps script encounters domain restrictions
        setActiveEngine('leaflet');
        initLeafletMap();
      }
    });

    return () => {
      // Cleanup if needed
    };
  }, []);

  // ─── Google Maps Initialization ─────────────────────────────
  const initGoogleMap = () => {
    if (!containerRef.current || !(window as any).google?.maps) return;

    containerRef.current.innerHTML = '';
    const google = (window as any).google;

    const map = new google.maps.Map(containerRef.current, {
      center: { lat: center[0], lng: center[1] },
      zoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: interactive,
      zoomControl: interactive,
    });

    googleMapRef.current = map;
    updateGoogleOverlays();
  };

  const updateGoogleOverlays = () => {
    const map = googleMapRef.current;
    const google = (window as any).google;
    if (!map || !google?.maps) return;

    // Clear previous overlays
    googleOverlaysRef.current.markers.forEach((m) => m.setMap(null));
    googleOverlaysRef.current.polylines.forEach((p) => p.setMap(null));
    googleOverlaysRef.current = { markers: [], polylines: [] };

    // Draw Google Maps Polylines
    routes.forEach((r, idx) => {
      const path = r.coordinates.map(([lat, lng]) => ({ lat, lng }));
      const polyline = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: r.color || '#673AB7',
        strokeOpacity: idx === 0 ? 0.95 : 0.65,
        strokeWeight: idx === 0 ? 6 : 4,
      });
      polyline.setMap(map);
      googleOverlaysRef.current.polylines.push(polyline);
    });

    // Draw Google Maps Markers
    markers.forEach((m) => {
      const marker = new google.maps.Marker({
        position: { lat: m.lat, lng: m.lng },
        map,
        title: m.title,
      });

      if (m.title || m.description) {
        const infowindow = new google.maps.InfoWindow({
          content: `<div style="padding:4px;"><b style="color:#292936;">${m.title}</b><p style="font-size:11px;color:#666;margin-top:2px;">${m.description || ''}</p></div>`,
        });
        marker.addListener('click', () => {
          infowindow.open(map, marker);
        });
      }

      googleOverlaysRef.current.markers.push(marker);
    });
  };

  // ─── Leaflet Fallback Initialization ────────────────────────
  const initLeafletMap = () => {
    if (!containerRef.current) return;

    if (!leafletMapRef.current) {
      containerRef.current.innerHTML = '';
      const map = L.map(containerRef.current, {
        center,
        zoom,
        zoomControl: interactive,
        dragging: interactive,
        touchZoom: interactive,
        scrollWheelZoom: interactive ? 'center' : false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 19,
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      leafletLayersRef.current = layerGroup;
      leafletMapRef.current = map;
    } else {
      leafletMapRef.current.setView(center, zoom);
    }

    updateLeafletLayers();
  };

  const updateLeafletLayers = () => {
    const layerGroup = leafletLayersRef.current;
    if (!layerGroup) return;

    layerGroup.clearLayers();

    // Polylines
    routes.forEach((r, idx) => {
      if (r.coordinates && r.coordinates.length > 0) {
        const polyline = L.polyline(r.coordinates, {
          color: r.color || '#673AB7',
          weight: idx === 0 ? 6 : 4,
          opacity: idx === 0 ? 0.95 : 0.65,
          lineJoin: 'round',
        });
        if (r.name) {
          polyline.bindPopup(`<b>${r.name}</b><br/>Zone: ${r.zone || 'Evaluated'}`);
        }
        layerGroup.addLayer(polyline);
      }
    });

    // Markers
    markers.forEach((m) => {
      let iconHtml = '';
      if (m.type === 'user') {
        iconHtml = `<div class="relative flex items-center justify-center">
          <div class="animate-ping absolute w-6 h-6 rounded-full bg-[#673AB7] opacity-60"></div>
          <div class="w-4 h-4 bg-[#673AB7] border-2 border-white rounded-full shadow-md"></div>
        </div>`;
      } else if (m.type === 'police') {
        iconHtml = `<div class="bg-blue-600 text-white p-1 rounded-full shadow-md text-xs font-bold border-2 border-white flex items-center justify-center w-7 h-7">👮</div>`;
      } else if (m.type === 'hospital') {
        iconHtml = `<div class="bg-red-600 text-white p-1 rounded-full shadow-md text-xs font-bold border-2 border-white flex items-center justify-center w-7 h-7">🏥</div>`;
      } else if (m.type === 'metro') {
        iconHtml = `<div class="bg-emerald-600 text-white p-1 rounded-full shadow-md text-xs font-bold border-2 border-white flex items-center justify-center w-7 h-7">🚇</div>`;
      } else if (m.type === 'hazard') {
        iconHtml = `<div class="bg-amber-500 text-white p-1 rounded-full shadow-md text-xs font-bold border-2 border-white flex items-center justify-center w-7 h-7">⚠️</div>`;
      } else {
        iconHtml = `<div class="bg-[#673AB7] text-white p-1 rounded-full shadow-md text-xs font-bold border-2 border-white flex items-center justify-center w-7 h-7">📍</div>`;
      }

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-leaflet-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([m.lat, m.lng], { icon: customIcon });
      if (m.title) {
        marker.bindPopup(`<b>${m.title}</b>${m.description ? `<br/><small>${m.description}</small>` : ''}`);
      }
      layerGroup.addLayer(marker);
    });
  };

  useEffect(() => {
    if (activeEngine === 'google' && googleMapRef.current) {
      updateGoogleOverlays();
    } else if (activeEngine === 'leaflet' && leafletLayersRef.current) {
      updateLeafletLayers();
    }
  }, [routes, markers, activeEngine]);

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-sm border border-gray-200">
      <div ref={containerRef} style={{ height, width: '100%' }} />

      {/* Clean Status Badge (No API Key or Settings Button displayed) */}
      <div className="absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-gray-200 flex items-center gap-2 text-xs font-semibold text-[#292936]">
        <span className={`w-2 h-2 rounded-full ${activeEngine === 'google' ? 'bg-blue-500' : 'bg-emerald-500'} animate-pulse`}></span>
        <span>{activeEngine === 'google' ? 'Google Maps' : 'ABHAYA Safety Map'}</span>
      </div>
    </div>
  );
};
