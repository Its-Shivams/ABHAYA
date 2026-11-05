// ============================================================
// d:\ABHAYA\web\src\hooks\useLiveLocation.ts
// Real Device Geolocation Hook with High-Accuracy GPS
// ============================================================

import { useState, useEffect } from 'react';

export interface LocationState {
  lat: number;
  lng: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  isRealGPS: boolean;
  isLoading: boolean;
  error: string | null;
  address: string;
}

// Default Uttam Nagar East, New Delhi coordinates
const DEMO_COORDS = {
  lat: 28.6186,
  lng: 77.0545,
  address: 'Uttam Nagar East, New Delhi',
};

export function useLiveLocation() {
  const [useRealDeviceGPS, setUseRealDeviceGPS] = useState<boolean>(() => {
    return localStorage.getItem('abhaya_use_real_gps') === 'true';
  });

  const [location, setLocation] = useState<LocationState>({
    lat: DEMO_COORDS.lat,
    lng: DEMO_COORDS.lng,
    accuracy: null,
    speed: null,
    heading: null,
    isRealGPS: false,
    isLoading: false,
    error: null,
    address: DEMO_COORDS.address,
  });

  useEffect(() => {
    let watchId: number | null = null;

    if (useRealDeviceGPS && 'geolocation' in navigator) {
      setLocation((prev) => ({ ...prev, isLoading: true, error: null }));

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy, speed, heading } = pos.coords;
          setLocation({
            lat: latitude,
            lng: longitude,
            accuracy: Math.round(accuracy),
            speed: speed ? Math.round(speed * 3.6) : 0, // km/h
            heading,
            isRealGPS: true,
            isLoading: false,
            error: null,
            address: `Live GPS: ${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`,
          });
        },
        (err) => {
          console.warn('Geolocation permission notice:', err.message);
          setLocation((prev) => ({
            ...prev,
            isLoading: false,
            error: 'GPS permission denied or unavailable. Using New Delhi demo coordinates.',
            isRealGPS: false,
          }));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );

      // Continuous Watch Position
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy, speed, heading } = pos.coords;
          setLocation({
            lat: latitude,
            lng: longitude,
            accuracy: Math.round(accuracy),
            speed: speed ? Math.round(speed * 3.6) : 0,
            heading,
            isRealGPS: true,
            isLoading: false,
            error: null,
            address: `Live GPS: ${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`,
          });
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 3000 }
      );
    } else {
      // Revert to demo coordinates
      setLocation({
        lat: DEMO_COORDS.lat,
        lng: DEMO_COORDS.lng,
        accuracy: 10,
        speed: 12,
        heading: 45,
        isRealGPS: false,
        isLoading: false,
        error: null,
        address: DEMO_COORDS.address,
      });
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [useRealDeviceGPS]);

  const toggleRealGPS = (enable?: boolean) => {
    const next = enable !== undefined ? enable : !useRealDeviceGPS;
    setUseRealDeviceGPS(next);
    localStorage.setItem('abhaya_use_real_gps', String(next));
  };

  const requestRealGPS = () => {
    toggleRealGPS(true);
  };

  return {
    ...location,
    useRealDeviceGPS,
    toggleRealGPS,
    requestRealGPS,
  };
}
