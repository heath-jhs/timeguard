import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, MapPin, CheckCircle2, XCircle, Loader2, Play, Square, Navigation, AlertTriangle } from 'lucide-react';
import { useLocationWatcher, LocationStatus } from './LocationWatcher';
import { isWithinGeofence, formatDuration, formatTime } from './GeofenceUtils';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import ConflictAcknowledgmentDialog from '../admin/ConflictAcknowledgmentDialog';

export default function ClockWidget({ profile, assignedSites, activeEntry, onClockAction }) {
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [isClocking, setIsClocking] = useState(false);
  const [geofenceStatus, setGeofenceStatus] = useState(null);
  const [elapsedTime, setElapsedTime] = useState('0h 0m');
  const [conflict, setConflict] = useState(null);
  
  const { location, error, isWatching, getCurrentPosition, startWatching, stopWatching } = useLocationWatcher();

  const selectedSite = assignedSites.find(s => s.id === selectedSiteId);
  const isClockedIn = !!activeEntry;

  // Update elapsed time every minute
  useEffect(() => {
    if (!activeEntry?.clock_in_time) return;
    
    const updateElapsed = () => {
      setElapsedTime(formatDuration(activeEntry.clock_in_time, null));
    };
    
    updateElapsed();
    const interval = setInterval(updateElapsed, 60000);
    return () => clearInterval(interval);
  }, [activeEntry?.clock_in_time]);

  // Check geofence when location or site changes
  useEffect(() => {
    if (location && selectedSite?.latitude && selectedSite?.longitude) {
      const status = isWithinGeofence(
        location.latitude,
        location.longitude,
        selectedSite.latitude,
        selectedSite.longitude,
        selectedSite.geofence_radius || 100
      );
      setGeofenceStatus(status);
    } else {
      setGeofenceStatus(null);
    }
  }, [location, selectedSite]);

  // Set initial site if clocked in
  useEffect(() => {
    if (activeEntry?.site_id) {
      setSelectedSiteId(activeEntry.site_id);
    } else if (assignedSites.length === 1) {
      setSelectedSiteId(assignedSites[0].id);
    }
  }, [activeEntry, assignedSites]);

  const handleClockIn = async () => {
    if (!selectedSiteId) {
      toast.error('Please select a work site');
      return;
    }

    setIsClocking(true);
    
    try {
      const currentLocation = await getCurrentPosition();
      
      if (!currentLocation) {
        toast.error('Unable to get your location');
        setIsClocking(false);
        return;
      }

      const site = assignedSites.find(s => s.id === selectedSiteId);
      if (!site?.latitude || !site?.longitude) {
        toast.error('Site location not configured');
        setIsClocking(false);
        return;
      }

      const geoCheck = isWithinGeofence(
        currentLocation.latitude,
        currentLocation.longitude,
        site.latitude,
        site.longitude,
        site.geofence_radius || 100
      );

      if (!geoCheck.isWithin) {
        toast.error(`You are ${geoCheck.distance}m away from the site. Must be within ${geoCheck.radiusMeters}m to clock in.`);
        setIsClocking(false);
        return;
      }

      // Check if outside site allowed hours
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      if (site.allowed_hours_start && site.allowed_hours_end) {
        if (currentTime < site.allowed_hours_start || currentTime > site.allowed_hours_end) {
          setConflict({
            employee_id: profile.id,
            site_id: site.id,
            type: 'outside_hours',
            message: `You are clocking in outside allowed site hours (${site.allowed_hours_start}-${site.allowed_hours_end}).`,
            details: `Current time: ${currentTime}. This will be logged as a schedule conflict.`,
            onAcknowledge: () => proceedWithClockIn(currentLocation)
          });
          setIsClocking(false);
          return;
        }
      }

      await proceedWithClockIn(currentLocation);
    } catch (err) {
      toast.error('Failed to clock in: ' + err.message);
      setIsClocking(false);
    }
  };

  const proceedWithClockIn = async (currentLocation) => {
    setIsClocking(true);
    try {
      const entry = await base44.entities.TimeEntry.create({
        employee_id: profile.id,
        site_id: selectedSiteId,
        clock_in_time: new Date().toISOString(),
        clock_in_lat: currentLocation.latitude,
        clock_in_lon: currentLocation.longitude,
        status: 'active'
      });

      toast.success('Clocked in successfully!');
      onClockAction?.(entry);
      startWatching();
    } catch (err) {
      toast.error('Failed to clock in: ' + err.message);
    } finally {
      setIsClocking(false);
    }
  };

  const handleClockOut = async () => {
    if (!activeEntry) return;

    setIsClocking(true);
    
    try {
      const currentLocation = await getCurrentPosition();
      
      await base44.entities.TimeEntry.update(activeEntry.id, {
        clock_out_time: new Date().toISOString(),
        clock_out_lat: currentLocation?.latitude || null,
        clock_out_lon: currentLocation?.longitude || null,
        status: 'completed'
      });

      toast.success('Clocked out successfully!');
      stopWatching();
      onClockAction?.(null);
    } catch (err) {
      toast.error('Failed to clock out: ' + err.message);
    } finally {
      setIsClocking(false);
    }
  };

  const openNavigation = () => {
    if (selectedSite?.latitude && selectedSite?.longitude) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${selectedSite.latitude},${selectedSite.longitude}`,
        '_blank'
      );
    }
  };

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-white">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Clock className="h-5 w-5 text-blue-600" />
            Time Clock
          </CardTitle>
          {isClockedIn && (
            <Badge className="bg-green-100 text-green-700 border-green-200">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
              Active
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Site Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Work Site</label>
          <Select 
            value={selectedSiteId} 
            onValueChange={setSelectedSiteId}
            disabled={isClockedIn}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select your work site" />
            </SelectTrigger>
            <SelectContent>
              {assignedSites.map(site => (
                <SelectItem key={site.id} value={site.id}>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {site.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedSite && (
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {selectedSite.address}
            </p>
          )}
        </div>

        {/* Location Status */}
        <LocationStatus location={location} error={error} isWatching={isWatching} />

        {/* Geofence Status */}
        {geofenceStatus && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            geofenceStatus.isWithin 
              ? 'bg-green-50 text-green-700' 
              : 'bg-amber-50 text-amber-700'
          }`}>
            {geofenceStatus.isWithin ? (
              <>
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">
                  You're within the geofence ({geofenceStatus.distance}m away)
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5" />
                <span className="text-sm font-medium">
                  {geofenceStatus.distance}m away (must be within {geofenceStatus.radiusMeters}m)
                </span>
              </>
            )}
          </div>
        )}

        {/* Active Session Info */}
        {isClockedIn && (
          <div className="bg-blue-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-600">Clocked in at</span>
              <span className="font-semibold text-blue-900">
                {formatTime(activeEntry.clock_in_time)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-600">Duration</span>
              <span className="font-bold text-2xl text-blue-900">{elapsedTime}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!isClockedIn ? (
            <>
              <Button
                className="flex-1 h-14 text-lg font-semibold bg-green-600 hover:bg-green-700"
                onClick={handleClockIn}
                disabled={isClocking || !selectedSiteId}
              >
                {isClocking ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Play className="h-5 w-5 mr-2" />
                )}
                Clock In
              </Button>
              
              {selectedSite?.latitude && (
                <Button
                  variant="outline"
                  className="h-14"
                  onClick={openNavigation}
                >
                  <Navigation className="h-5 w-5" />
                </Button>
              )}
            </>
          ) : (
            <Button
              className="flex-1 h-14 text-lg font-semibold bg-red-600 hover:bg-red-700"
              onClick={handleClockOut}
              disabled={isClocking}
            >
              {isClocking ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Square className="h-5 w-5 mr-2" />
              )}
              Clock Out
            </Button>
          )}
        </div>
      </CardContent>

      {conflict && (
        <ConflictAcknowledgmentDialog
          conflict={conflict}
          onAcknowledge={() => {
            conflict.onAcknowledge?.();
            setConflict(null);
          }}
          onClose={() => setConflict(null)}
        />
      )}
    </Card>
  );
}