// ============================================================
// d:\ABHAYA\web\src\services\gmapsLoader.ts
// Dynamic Google Maps JavaScript SDK Loader with gm_authFailure Detection
// ============================================================

let isGoogleMapsLoading = false;
let isGoogleMapsLoaded = false;
let hasAuthFailed = false;
let loadPromise: Promise<boolean> | null = null;
const authFailureListeners: Array<() => void> = [];

// Intercept Google Maps Auth Failure (billing, domain, or key restrictions)
if (typeof window !== 'undefined') {
  (window as any).gm_authFailure = () => {
    console.warn('⚠️ Google Maps auth failure detected (billing or key restriction). Falling back to ABHAYA Safety Map.');
    hasAuthFailed = true;
    authFailureListeners.forEach((fn) => {
      try {
        fn();
      } catch {}
    });
  };
}

export function onGoogleMapsAuthFailure(callback: () => void): () => void {
  authFailureListeners.push(callback);
  if (hasAuthFailed) {
    callback();
  }
  return () => {
    const idx = authFailureListeners.indexOf(callback);
    if (idx !== -1) authFailureListeners.splice(idx, 1);
  };
}

export function loadGoogleMaps(apiKey: string): Promise<boolean> {
  if (hasAuthFailed) {
    return Promise.resolve(false);
  }

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
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      if ((window as any).google?.maps && !hasAuthFailed) {
        isGoogleMapsLoaded = true;
        resolve(true);
      } else {
        existingScript.addEventListener('load', () => {
          isGoogleMapsLoaded = !hasAuthFailed;
          resolve(!hasAuthFailed);
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
      // Give a tiny grace period for gm_authFailure to fire if key is invalid
      setTimeout(() => {
        if (hasAuthFailed) {
          resolve(false);
        } else {
          isGoogleMapsLoaded = true;
          isGoogleMapsLoading = false;
          resolve(true);
        }
      }, 300);
    };

    script.onerror = (err) => {
      console.warn('❌ Google Maps script load network error:', err);
      isGoogleMapsLoading = false;
      resolve(false);
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

export function isGoogleMapsAvailable(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).google?.maps) && !hasAuthFailed;
}
