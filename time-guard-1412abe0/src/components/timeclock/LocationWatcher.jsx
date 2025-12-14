import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

export function useLocationWatcher() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isWatching, setIsWatching] = useState(false);
  const [watchId, setWatchId] = useState(null);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsWatching(true);
    setError(null);

    const id = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
        setError(null);
      },
      (err) => {
        setError(err.message);
        setIsWatching(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );

    setWatchId(id);
  }, []);

  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsWatching(false);
  }, [watchId]);

  const getCurrentPosition = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          setLocation(loc);
          resolve(loc);
        },
        (err) => {
          setError(err.message);
          reject(err);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    });
  }, []);

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return {
    location,
    error,
    isWatching,
    startWatching,
    stopWatching,
    getCurrentPosition
  };
}

export function LocationStatus({ location, error, isWatching }) {
  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (isWatching && !location) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Getting your location...</span>
      </div>
    );
  }

  if (location) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 mb-4">
        <MapPin className="h-4 w-4" />
        <span>
          Location: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          {location.accuracy && ` (±${Math.round(location.accuracy)}m)`}
        </span>
      </div>
    );
  }

  return null;
}