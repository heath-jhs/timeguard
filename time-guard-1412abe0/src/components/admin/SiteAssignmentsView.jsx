import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Clock, Calendar, ExternalLink, Plus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { format12Hour } from '@/components/utils/timeUtils';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function SiteAssignmentsView({ site, assignments, profiles, onClose, onViewUser, onRefresh }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [arrivalTime, setArrivalTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [isSaving, setIsSaving] = useState(false);

  const siteAssignments = assignments.filter(a => a.site_id === site.id);
  const assignedUserIds = siteAssignments.map(a => a.employee_id);
  const availableUsers = profiles.filter(p => !assignedUserIds.includes(p.id));

  const getUserName = (userId) => {
    const user = profiles.find(p => p.id === userId);
    return user?.full_name || user?.email || 'Unknown';
  };

  const getUserRole = (userId) => {
    const user = profiles.find(p => p.id === userId);
    return user?.role || 'employee';
  };

  const handleAddAssignment = async () => {
    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }

    setIsSaving(true);
    try {
      await base44.entities.EmployeeSite.create({
        employee_id: selectedUser,
        site_id: site.id,
        arrival_time: arrivalTime,
        end_time: endTime
      });

      toast.success('Assignment added successfully!');
      setShowAddForm(false);
      setSelectedUser('');
      setArrivalTime('09:00');
      setEndTime('17:00');
      onRefresh?.();
    } catch (err) {
      toast.error('Failed to add assignment: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Assignments for {site.name}
          </DialogTitle>
          <p className="text-sm text-slate-600">{site.address}</p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Add Assignment Form */}
          {showAddForm ? (
            <div className="border rounded-lg p-4 bg-slate-50">
              <h3 className="font-medium mb-4">Add User to Site</h3>
              <div className="space-y-4">
                <div>
                  <Label>Select User</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center gap-2">
                            <span>{user.full_name || user.email}</span>
                            <span className="text-xs text-slate-500">({user.role})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Arrival Time</Label>
                    <Input
                      type="time"
                      value={arrivalTime}
                      onChange={(e) => setArrivalTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddAssignment} disabled={isSaving} className="flex-1">
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Assignment
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Button onClick={() => setShowAddForm(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add User to This Site
            </Button>
          )}

          {siteAssignments.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No users assigned to this site</p>
            </div>
          ) : (
            <div className="space-y-3">
              {siteAssignments.map(assignment => {
                const userName = getUserName(assignment.employee_id);
                const userRole = getUserRole(assignment.employee_id);

                return (
                  <div key={assignment.id} className="border rounded-lg p-4 bg-white hover:bg-slate-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <button
                          onClick={() => {
                            const user = profiles.find(p => p.id === assignment.employee_id);
                            if (user && onViewUser) {
                              onViewUser(user);
                            }
                          }}
                          className="font-medium text-slate-900 hover:text-blue-600 underline-offset-4 hover:underline text-left"
                        >
                          {userName}
                        </button>
                        <Badge variant="outline" className="mt-1 text-xs capitalize">
                          {userRole}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          const user = profiles.find(p => p.id === assignment.employee_id);
                          if (user && onViewUser) {
                            onViewUser(user);
                          }
                        }}
                      >
                        <ExternalLink className="h-4 w-4 text-slate-400" />
                      </Button>
                    </div>

                    <div className="space-y-2 mt-3">
                      {assignment.arrival_time && assignment.end_time && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <span>
                            {format12Hour(assignment.arrival_time)} - {format12Hour(assignment.end_time)}
                          </span>
                        </div>
                      )}

                      {(assignment.start_date || assignment.end_date) && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span>
                            {assignment.start_date && format(new Date(assignment.start_date), 'MMM d, yyyy')}
                            {assignment.start_date && assignment.end_date && ' - '}
                            {assignment.end_date && format(new Date(assignment.end_date), 'MMM d, yyyy')}
                            {!assignment.start_date && !assignment.end_date && 'Ongoing'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}