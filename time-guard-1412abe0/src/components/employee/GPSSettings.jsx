import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Loader2, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format12Hour, format24Hour } from '@/components/utils/timeUtils';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function GPSSettings({ profile, onUpdate }) {
  const [schedule, setSchedule] = useState(() => {
    const defaultSchedule = DAYS.reduce((acc, day) => {
      acc[day] = {
        enabled: true,
        start: '12:00 AM',
        end: '11:59 PM'
      };
      return acc;
    }, {});

    if (profile.gps_schedule) {
      DAYS.forEach(day => {
        if (profile.gps_schedule[day]) {
          defaultSchedule[day] = {
            enabled: true,
            start: format12Hour(profile.gps_schedule[day].start || '00:00'),
            end: format12Hour(profile.gps_schedule[day].end || '23:59')
          };
        }
      });
    }

    return defaultSchedule;
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleTimeChange = (day, field, value) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleToggleDay = (day) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const gpsSchedule = DAYS.reduce((acc, day) => {
        if (schedule[day].enabled) {
          acc[day] = {
            start: format24Hour(schedule[day].start),
            end: format24Hour(schedule[day].end)
          };
        }
        return acc;
      }, {});

      await base44.entities.Profile.update(profile.id, {
        gps_schedule: gpsSchedule
      });

      toast.success('GPS settings saved successfully!');
      onUpdate?.();
    } catch (err) {
      toast.error('Failed to save settings: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          GPS Access Settings
        </CardTitle>
        <p className="text-sm text-slate-600 mt-2">
          Control when the app can access your location. GPS will only be used during these hours.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {DAYS.map(day => (
          <div key={day} className="border rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-3">
              <Checkbox
                id={`day-${day}`}
                checked={schedule[day].enabled}
                onCheckedChange={() => handleToggleDay(day)}
              />
              <label 
                htmlFor={`day-${day}`}
                className="font-medium cursor-pointer text-sm sm:text-base"
              >
                {day}
              </label>
            </div>

            {schedule[day].enabled && (
              <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4 pl-6">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">Start</Label>
                  <Input
                    type="time"
                    value={format24Hour(schedule[day].start)}
                    onChange={(e) => handleTimeChange(day, 'start', format12Hour(e.target.value))}
                    className="text-sm"
                  />
                  <div className="text-xs text-slate-500">{schedule[day].start}</div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">End</Label>
                  <Input
                    type="time"
                    value={format24Hour(schedule[day].end)}
                    onChange={(e) => handleTimeChange(day, 'end', format12Hour(e.target.value))}
                    className="text-sm"
                  />
                  <div className="text-xs text-slate-500">{schedule[day].end}</div>
                </div>
              </div>
            )}
          </div>
        ))}

        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}