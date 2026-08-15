import { useState, useEffect, useRef, useCallback } from 'react';
import { Location, TouristProfile } from '../types';

export type GeolocationPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

export interface TelemetryData {
  lat: number;
  lng: number;
  accuracy: number;
  altitude?: number | null;
  speed?: number | null;
  heading?: number | null;
  timestamp: number;
  address?: string;
}

interface UseTouristLiveLocationOptions {
  tourist?: TouristProfile;
  onLocationUpdate?: (location: Location) => void;
  autoSyncServer?: boolean;
}

export function useTouristLiveLocation(options: UseTouristLiveLocationOptions = {}) {
  const { tourist, onLocationUpdate, autoSyncServer = true } = options;

  const [permissionState, setPermissionState] = useState<GeolocationPermissionState>('prompt');
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [coords, setCoords] = useState<TelemetryData | null>(null);
  const [address, setAddress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const lastSyncRef = useRef<number>(0);
  const lastCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Check battery if Battery API is available
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery?.().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      }).catch(() => {});
    }
  }, []);

  // Reverse Geocode helper (Nominatim with local caching)
  const resolveAddress = useCallback(async (lat: number, lng: number): Promise<string> => {
    try {
      if (lat >= 30.05 && lat <= 30.20 && lng >= 78.20 && lng <= 78.40) {
        if (lat > 30.12) return 'Tapovan & Lakshman Jhula, Rishikesh';
        if (lat < 30.11) return 'Triveni Ghat & Ram Jhula, Rishikesh';
        return 'Ganga Riverfront Corridor, Rishikesh';
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
        {
          signal: controller.signal,
          headers: { 'Accept-Language': 'en' }
        }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const parts = [
          data.address?.suburb || data.address?.neighbourhood || data.address?.road,
          data.address?.city || data.address?.town || data.address?.state_district,
          data.address?.state
        ].filter(Boolean);
        if (parts.length > 0) return parts.join(', ');
        if (data.display_name) return data.display_name.split(',').slice(0, 2).join(',');
      }
    } catch {
      // Fallback
    }
    return `Live GPS: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
  }, []);

  // Sync location to backend (throttled)
  const syncWithServer = useCallback(async (telemetry: TelemetryData, currentTouristId?: string) => {
    const targetId = currentTouristId || tourist?.id;
    if (!targetId) return;

    const now = Date.now();
    // Rate limit server syncs to max once every 15 seconds unless forced
    if (now - lastSyncRef.current < 15000) return;
    lastSyncRef.current = now;

    try {
      await fetch(`/api/tourists/${targetId}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: telemetry.lat,
          lng: telemetry.lng,
          address: telemetry.address || address,
          accuracy: telemetry.accuracy,
          altitude: telemetry.altitude,
          speed: telemetry.speed,
          batteryLevel: batteryLevel ?? tourist?.batteryLevel ?? 100
        })
      });
    } catch (err) {
      console.warn('Live location sync skipped:', err);
    }
  }, [tourist?.id, tourist?.batteryLevel, address, batteryLevel]);

  // Handle Position Updates with Movement Filtering
  const handlePositionSuccess = useCallback(async (pos: GeolocationPosition) => {
    if (!isMountedRef.current) return;
    const { latitude, longitude, accuracy, altitude, speed, heading } = pos.coords;

    // Filter minor jitter: only update if moved >= 15m or > 60s elapsed
    const last = lastCoordsRef.current;
    if (last) {
      const R = 6371000;
      const dLat = (latitude - last.lat) * (Math.PI / 180);
      const dLon = (longitude - last.lng) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(last.lat * (Math.PI / 180)) * Math.cos(latitude * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = R * c;

      const timeSinceLastSync = Date.now() - lastSyncRef.current;
      if (dist < 15 && timeSinceLastSync < 60000) {
        return;
      }
    }
    lastCoordsRef.current = { lat: latitude, lng: longitude };

    setError(null);
    setPermissionState('granted');
    setIsTracking(true);

    const resolvedAddr = await resolveAddress(latitude, longitude);
    if (!isMountedRef.current) return;

    setAddress(resolvedAddr);

    const telemetry: TelemetryData = {
      lat: latitude,
      lng: longitude,
      accuracy: Math.round(accuracy),
      altitude: altitude ? Math.round(altitude) : null,
      speed: speed ? Math.round(speed * 3.6) : null,
      heading: heading ? Math.round(heading) : null,
      timestamp: pos.timestamp,
      address: resolvedAddr
    };

    setCoords(telemetry);

    const locationObj: Location = {
      lat: latitude,
      lng: longitude,
      address: resolvedAddr,
      accuracy: Math.round(accuracy),
      altitude: altitude ? Math.round(altitude) : null,
      speed: speed ? Math.round(speed * 3.6) : null,
      heading: heading ? Math.round(heading) : null,
      timestamp: pos.timestamp,
      isLiveGps: true
    };

    onLocationUpdate?.(locationObj);

    if (autoSyncServer) {
      syncWithServer(telemetry);
    }
  }, [resolveAddress, onLocationUpdate, autoSyncServer, syncWithServer]);

  const handlePositionError = useCallback((err: GeolocationPositionError) => {
    if (!isMountedRef.current) return;
    setIsTracking(false);

    if (err.code === err.PERMISSION_DENIED) {
      setPermissionState('denied');
      setError('Location permission was denied. Please allow location access in your browser to enable live tracking.');
    } else if (err.code === err.POSITION_UNAVAILABLE) {
      setError('Live GPS signal is currently unavailable.');
    } else if (err.code === err.TIMEOUT) {
      setError('Location request timed out.');
    } else {
      setError(err.message || 'An unknown location error occurred.');
    }
  }, []);

  // Start live tracking
  const startLiveTracking = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setPermissionState('unsupported');
      setError('Your browser does not support GPS Geolocation.');
      return;
    }

    setError(null);

    // Initial position fetch
    navigator.geolocation.getCurrentPosition(
      handlePositionSuccess,
      handlePositionError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );

    // Stop existing watcher
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    // Continuous watch with gentle interval
    const id = navigator.geolocation.watchPosition(
      handlePositionSuccess,
      handlePositionError,
      {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 60000
      }
    );
    watchIdRef.current = id;
    setIsTracking(true);
  }, [handlePositionSuccess, handlePositionError]);

  // Stop live tracking
  const stopLiveTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Check initial permission state
  useEffect(() => {
    isMountedRef.current = true;

    if (!('geolocation' in navigator)) {
      setPermissionState('unsupported');
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' })
        .then((permissionStatus) => {
          if (!isMountedRef.current) return;
          setPermissionState(permissionStatus.state as GeolocationPermissionState);

          if (permissionStatus.state === 'granted') {
            startLiveTracking();
          }

          permissionStatus.onchange = () => {
            if (!isMountedRef.current) return;
            const newState = permissionStatus.state as GeolocationPermissionState;
            setPermissionState(newState);
            if (newState === 'granted') {
              startLiveTracking();
            } else if (newState === 'denied') {
              stopLiveTracking();
            }
          };
        })
        .catch(() => {});
    }

    return () => {
      isMountedRef.current = false;
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [startLiveTracking, stopLiveTracking]);

  return {
    permissionState,
    isTracking,
    coords,
    address,
    error,
    batteryLevel,
    startLiveTracking,
    stopLiveTracking,
    recenterLocation: startLiveTracking,
    syncWithServer
  };
}
