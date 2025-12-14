import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Calendar, Save, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function EmployeeScheduleSettings({ employee, onClose, onSave }) {
  const [formData, setFormData] = useState({
    daily_start: '09:00',
    daily_end: '17:00',
    work_hours: 8,
    work_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({
        daily_start: employee.daily_start || '09:00',
        daily_end: employee.daily_end || '17:00',
        work_hours: employee.work_hours || 8,
        work_days: employee.work_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      });
    }
  }, [employee]);

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      work_days: prev.work_days.includes(day)
        ? prev.work_days.filter(d => d !== day)
        : [...prev.work_days, day]
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await base44.entities.Profile.update(employee.id, formData);
      toast.success('Schedule settings saved!');
      onSave?.();
      onClose();
    } catch (err) {
      toast.error('Failed to save: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!employee) return null;

  return (
    <Dialog open={!!employee} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Settings - {employee.full_name || employee.email}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Daily Times */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Standard Start Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="time"
                  value={formData.daily_start}
                  onChange={(e) => setFormData({ ...formData, daily_start: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Standard End Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="time"
                  value={formData.daily_end}
                  onChange={(e) => setFormData({ ...formData, daily_end: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Expected Hours */}
          <div className="space-y-2">
            <Label>Expected Daily Hours</Label>
            <Input
              type="number"
              min="1"
              max="24"
              step="0.5"
              value={formData.work_hours}
              onChange={(e) => setFormData({ ...formData, work_hours: parseFloat(e.target.value) })}
            />
          </div>

          {/* Work Days */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Standard Work Days
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {DAYS.map(day => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox
                    id={day}
                    checked={formData.work_days.includes(day)}
                    onCheckedChange={() => handleDayToggle(day)}
                  />
                  <label htmlFor={day} className="text-sm cursor-pointer">
                    {day}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
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
                Save Schedule
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}