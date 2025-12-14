import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function DashboardPreference({ profile, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [preference, setPreference] = useState(profile.preferred_dashboard || '');
  const [isSaving, setIsSaving] = useState(false);

  const dashboards = [
    { value: 'AdminDashboard', label: 'Admin Dashboard', description: 'Full system management' },
    { value: 'ManagerDashboard', label: 'Manager Dashboard', description: 'Site and team oversight' },
    { value: 'EmployeeDashboard', label: 'Employee Dashboard', description: 'Time clock and assignments' }
  ];

  // Filter available dashboards based on role
  const availableDashboards = dashboards.filter(d => {
    if (profile.role === 'admin') return true;
    if (profile.role === 'manager') return d.value !== 'AdminDashboard';
    return d.value === 'EmployeeDashboard';
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await base44.entities.Profile.update(profile.id, {
        preferred_dashboard: preference || null
      });

      toast.success('Default dashboard updated!');
      setOpen(false);
      onUpdate?.();
    } catch (err) {
      toast.error('Failed to update preference: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Dashboard Preference
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Default Dashboard</DialogTitle>
          <DialogDescription>
            Choose which dashboard you want to see when you log in. Leave blank to use your role's default.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Preferred Dashboard</Label>
            <Select value={preference} onValueChange={setPreference}>
              <SelectTrigger>
                <SelectValue placeholder={`Default (${profile.role === 'admin' ? 'Admin' : profile.role === 'manager' ? 'Manager' : 'Employee'} Dashboard)`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Use Role Default</SelectItem>
                {availableDashboards.map(d => (
                  <SelectItem key={d.value} value={d.value}>
                    <div>
                      <div className="font-medium">{d.label}</div>
                      <div className="text-xs text-slate-500">{d.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
            <strong>Tip:</strong> Admins and managers who work on-site can set their default to Employee Dashboard for quick time clock access, while still accessing other dashboards from the menu.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Preference'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}