import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ConflictAcknowledgmentDialog({ conflict, onAcknowledge, onClose }) {
  const handleAcknowledge = async () => {
    try {
      // Log the conflict
      await base44.entities.Conflict.create({
        employee_id: conflict.employee_id,
        site_id: conflict.site_id,
        conflict_type: conflict.type,
        conflict_time: new Date().toISOString(),
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
        details: conflict.message
      });
      
      toast.success('Conflict acknowledged and logged');
      onAcknowledge?.();
      onClose();
    } catch (err) {
      toast.error('Failed to log conflict: ' + err.message);
    }
  };

  if (!conflict) return null;

  return (
    <Dialog open={!!conflict} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            Schedule Conflict Detected
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-slate-700">{conflict.message}</p>
          
          {conflict.details && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm">
              <strong>Details:</strong>
              <p className="mt-1">{conflict.details}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAcknowledge} className="bg-orange-600 hover:bg-orange-700">
            Acknowledge & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}