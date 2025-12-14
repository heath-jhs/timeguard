import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function EmployeeEditDialog({ employee, onClose, onSave }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    mailing_address: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({
        full_name: employee.full_name || '',
        email: employee.email || '',
        phone_number: employee.phone_number || '',
        mailing_address: employee.mailing_address || ''
      });
    }
  }, [employee]);

  const handleSave = async () => {
    if (!formData.email) {
      toast.error('Email is required');
      return;
    }

    setIsSaving(true);
    try {
      await base44.entities.Profile.update(employee.id, formData);
      toast.success('Employee updated successfully!');
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
          <DialogTitle>Edit Employee</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <Label>Email *</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
              disabled
            />
          </div>

          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input
              type="tel"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <Label>Mailing Address</Label>
            <Input
              value={formData.mailing_address}
              onChange={(e) => setFormData({ ...formData, mailing_address: e.target.value })}
              placeholder="123 Main St, City, State 12345"
            />
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