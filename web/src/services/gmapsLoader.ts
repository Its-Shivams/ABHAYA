// ============================================================
// d:\ABHAYA\web\src\services\gmapsLoader.ts
// Dynamic Google Maps JavaScript SDK Loader
// ============================================================

let isGoogleMapsLoading = false;
let isGoogleMapsLoaded = false;
let loadPromise: Promise<boolean> | null = null;

export function loadGoogleMaps(apiKey: string): Promise<boolean> {
  if (isGoogleMapsLoaded && (window as any).google?.maps) {
    return Promise.resolve(true);
  }

  if (loadPromise) {
    return loadPromise;
  }

  if (!apiKey || apiKey.trim() === '') {
    return Promise.resolve(false);
  }

  isGoogleMapsLoading = true;

  loadPromise = new Promise((resolve) => {
    // Check if script already exists
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      if ((window as any).google?.maps) {
        isGoogleMapsLoaded = true;
        resolve(true);
      } else {
        existingScript.addEventListener('load', () => {
          isGoogleMapsLoaded = true;
          resolve(true);
        });
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.type = 'text/javascript';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      isGoogleMapsLoaded = true;
      isGoogleMapsLoading = false;
      console.log('✅ Google Maps SDK loaded successfully');
      resolve(true);
    };

    script.onerror = (err) => {
      console.warn('❌ Google Maps script load error (invalid API key or network restricted):', err);
      isGoogleMapsLoading = false;
      resolve(false);
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

export function isGoogleMapsAvailable(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).google?.maps);
}
