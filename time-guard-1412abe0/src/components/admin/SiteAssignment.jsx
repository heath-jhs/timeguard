import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Users, Building2, CalendarIcon, Loader2, Save, Clock, Settings, Eye } from 'lucide-react';
import { format, isFuture, isPast, isToday } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Input } from "@/components/ui/input";
import { format12Hour } from '@/components/utils/timeUtils';
import EmployeeAssignmentDetail from './EmployeeAssignmentDetail';
import SiteAssignmentsView from './SiteAssignmentsView';

      export default function SiteAssignment({ profiles, sites, assignments, onRefresh }) {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedSites, setSelectedSites] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [arrivalTime, setArrivalTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [isSaving, setIsSaving] = useState(false);
  const [detailEmployee, setDetailEmployee] = useState(null);
  const [detailSite, setDetailSite] = useState(null);

  // Allow all users to be assigned to sites
  const assignableUsers = profiles;

  // Load current assignments when employee changes
  useEffect(() => {
    if (selectedEmployee) {
      const employeeAssignments = assignments.filter(a => a.employee_id === selectedEmployee);
      setSelectedSites(employeeAssignments.map(a => a.site_id));
    } else {
      setSelectedSites([]);
    }
  }, [selectedEmployee, assignments]);

  const handleSiteToggle = (siteId) => {
    setSelectedSites(prev => 
      prev.includes(siteId) 
        ? prev.filter(id => id !== siteId)
        : [...prev, siteId]
    );
  };

  const handleSave = async () => {
    if (!selectedEmployee) {
      toast.error('Please select a user');
      return;
    }

    setIsSaving(true);
    try {
      // Check for conflicts with site hours
      const conflicts = [];
      for (const siteId of selectedSites) {
        const site = sites.find(s => s.id === siteId);
        if (site?.allowed_hours_start && site?.allowed_hours_end) {
          if (arrivalTime < site.allowed_hours_start || endTime > site.allowed_hours_end) {
            conflicts.push({
              site: site.name,
              message: `Assignment hours (${arrivalTime}-${endTime}) conflict with allowed hours (${site.allowed_hours_start}-${site.allowed_hours_end})`
            });
          }
        }
      }

      if (conflicts.length > 0) {
        const confirmMsg = `Conflicts detected:\n${conflicts.map(c => `• ${c.site}: ${c.message}`).join('\n')}\n\nDo you want to continue?`;
        if (!window.confirm(confirmMsg)) {
          setIsSaving(false);
          return;
        }
      }

      // Delete existing assignments for this employee
      const existingAssignments = assignments.filter(a => a.employee_id === selectedEmployee);
      for (const assignment of existingAssignments) {
        await base44.entities.EmployeeSite.delete(assignment.id);
      }

      // Create new assignments
      for (const siteId of selectedSites) {
        await base44.entities.EmployeeSite.create({
          employee_id: selectedEmployee,
          site_id: siteId,
          start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
          end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
          arrival_time: arrivalTime,
          end_time: endTime
        });
      }

      toast.success('Site assignments saved successfully!');
      onRefresh?.();
    } catch (err) {
      toast.error('Failed to save assignments: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getSiteName = (siteId) => {
    const site = sites.find(s => s.id === siteId);
    return site?.name || 'Unknown';
  };

  const getEmployeeName = (employeeId) => {
    const emp = profiles.find(p => p.id === employeeId);
    return emp?.full_name || emp?.email || 'Unknown';
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Assignment Form */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-slate-600" />
            Assign Sites to User
          </CardTitle>
          <p className="text-sm text-slate-600 mt-2">
            Assign work sites to employees, managers, or admins for appointments and labor tracking.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Selection */}
          <div className="space-y-2">
            <Label>Select User</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a user" />
              </SelectTrigger>
              <SelectContent>
                {assignableUsers.map(user => (
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

          {/* Site Selection */}
          {selectedEmployee && (
            <div className="space-y-3">
              <Label>Assign to Sites</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                {sites.map(site => (
                  <div key={site.id} className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded">
                    <Checkbox
                      id={`site-${site.id}`}
                      checked={selectedSites.includes(site.id)}
                      onCheckedChange={() => handleSiteToggle(site.id)}
                    />
                    <label 
                      htmlFor={`site-${site.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium">{site.name}</div>
                      <div className="text-sm text-slate-500">{site.address}</div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Date Range */}
          {selectedEmployee && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {startDate ? format(startDate, 'PPP') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>End Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {endDate ? format(endDate, 'PPP') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Daily Times */}
          {selectedEmployee && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Daily Arrival Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="time"
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Daily End Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          {selectedEmployee && (
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
                  Save Assignments
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Current Assignments Overview */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-slate-600" />
            Current Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No site assignments yet
            </div>
          ) : (
            <div className="space-y-4">
              {assignableUsers.map(user => {
                const userAssignments = assignments.filter(a => a.employee_id === user.id);
                if (userAssignments.length === 0) return null;

                return (
                  <div key={user.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.full_name || user.email}</span>
                        <Badge variant="outline" className="text-xs">{user.role}</Badge>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => setDetailEmployee(user)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {userAssignments.map(a => {
                        const site = sites.find(s => s.id === a.site_id);
                        return (
                          <div key={a.id} className="text-sm border-l-2 border-blue-200 pl-2 py-1">
                            <Badge variant="secondary" className="mb-1">
                              {getSiteName(a.site_id)}
                            </Badge>
                            {a.arrival_time && a.end_time && (
                              <div className="text-xs text-slate-700 ml-1 font-medium">
                                Assigned: {format12Hour(a.arrival_time)} - {format12Hour(a.end_time)}
                              </div>
                            )}
                            {site?.allowed_hours_start && site?.allowed_hours_end && (
                              <div className="text-xs text-slate-500 ml-1">
                                Allowed: {format12Hour(site.allowed_hours_start)} - {format12Hour(site.allowed_hours_end)}
                              </div>
                            )}
                            {(a.start_date || a.end_date) && (
                              <div className="text-xs text-slate-400 ml-1 mt-1">
                                {a.start_date && format(new Date(a.start_date), 'MMM d')}
                                {a.start_date && a.end_date && ' - '}
                                {a.end_date && format(new Date(a.end_date), 'MMM d, yyyy')}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {detailEmployee && (
        <EmployeeAssignmentDetail
          employee={detailEmployee}
          assignments={assignments.filter(a => a.employee_id === detailEmployee.id)}
          sites={sites}
          onClose={() => setDetailEmployee(null)}
          onViewSite={(site) => {
            setDetailEmployee(null);
            setDetailSite(site);
          }}
          onRefresh={handleRefresh}
        />
      )}

      {detailSite && (
        <SiteAssignmentsView
          site={detailSite}
          assignments={assignments}
          profiles={profiles}
          onClose={() => setDetailSite(null)}
          onViewUser={(user) => {
            setDetailSite(null);
            setDetailEmployee(user);
          }}
          onRefresh={handleRefresh}
        />
      )}
      </div>
      );
      }