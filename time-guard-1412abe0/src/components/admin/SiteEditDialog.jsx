import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Clock, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function SiteEditDialog({ site, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    geofence_radius: 100,
    allowed_hours_start: '09:00',
    allowed_hours_end: '17:00',
    variance_threshold: null,
    manager_id: null,
    is_active: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const handleGeocode = async () => {
    if (!formData.address) {
      toast.error('Please enter an address first');
      return;
    }

    setIsGeocoding(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a geocoding assistant. Find the exact latitude and longitude coordinates for this address: "${formData.address}". 

Search for this address and return the precise geographic coordinates. If multiple locations match, choose the most likely one based on the address details provided.

Return ONLY a JSON object with exactly this structure:
{
  "lat": <latitude as decimal number>,
  "lon": <longitude as decimal number>
}

Do not include any explanation, just the JSON with the coordinates.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            lat: { type: 'number' },
            lon: { type: 'number' }
          },
          required: ['lat', 'lon']
        }
      });

      if (result.lat && result.lon) {
        setFormData(prev => ({
          ...prev,
          latitude: result.lat,
          longitude: result.lon
        }));
        toast.success(`Coordinates found: ${result.lat.toFixed(6)}, ${result.lon.toFixed(6)}`);
      } else {
        toast.error('Could not find coordinates for this address');
      }
    } catch (err) {
      toast.error('Geocoding failed: ' + err.message);
    } finally {
      setIsGeocoding(false);
    }
  };

  useEffect(() => {
    if (site) {
      setFormData({
        name: site.name || '',
        address: site.address || '',
        latitude: site.latitude || '',
        longitude: site.longitude || '',
        geofence_radius: site.geofence_radius || 100,
        allowed_hours_start: site.allowed_hours_start || '09:00',
        allowed_hours_end: site.allowed_hours_end || '17:00',
        variance_threshold: site.variance_threshold || null,
        manager_id: site.manager_id || null,
        is_active: site.is_active !== false
      });
    }
  }, [site]);

  const handleSave = async () => {
    if (!formData.name || !formData.address) {
      toast.error('Name and address are required');
      return;
    }

    if (!formData.allowed_hours_start || !formData.allowed_hours_end) {
      toast.error('Allowed work hours are required');
      return;
    }

    setIsSaving(true);
    try {
      await base44.entities.Site.update(site.id, {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        geofence_radius: parseFloat(formData.geofence_radius)
      });
      toast.success('Site updated successfully!');
      onSave?.();
      onClose();
    } catch (err) {
      toast.error('Failed to save: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!site) return null;

  return (
    <Dialog open={!!site} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Site</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Site Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Site name"
              />
            </div>
            <div className="space-y-2">
              <Label>Geofence Radius (meters)</Label>
              <Input
                type="number"
                value={formData.geofence_radius}
                onChange={(e) => setFormData({ ...formData, geofence_radius: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Address *</Label>
            <div className="flex gap-2">
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                onBlur={() => {
                  if (formData.address && !formData.latitude && !formData.longitude) {
                    handleGeocode();
                  }
                }}
                placeholder="123 Main St, City, State"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleGeocode}
                disabled={isGeocoding || !formData.address}
              >
                {isGeocoding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Latitude</Label>
              <Input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="40.7128"
              />
            </div>
            <div className="space-y-2">
              <Label>Longitude</Label>
              <Input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="-74.0060"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Allowed Hours Start *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="time"
                  value={formData.allowed_hours_start}
                  onChange={(e) => setFormData({ ...formData, allowed_hours_start: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Allowed Hours End *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="time"
                  value={formData.allowed_hours_end}
                  onChange={(e) => setFormData({ ...formData, allowed_hours_end: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Variance Threshold (%)</Label>
            <Input
              type="number"
              step="1"
              min="1"
              max="100"
              value={formData.variance_threshold || 5}
              onChange={(e) => setFormData({ ...formData, variance_threshold: e.target.value ? parseInt(e.target.value) : 5 })}
              placeholder="5"
            />
            <p className="text-xs text-slate-500">
              Alert managers when employee hours differ from expected by this percentage. For example, if set to 10%, working 7.2 hours instead of 8 hours (10% variance) triggers an alert. Default: 5%
            </p>
          </div>

          <Button 
            className="w-full" 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}