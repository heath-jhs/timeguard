import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, MapPin, Building2, ExternalLink, Plus, Loader2 } from 'lucide-react';
import { format, isFuture, isPast, isWithinInterval, parseISO, isToday, startOfDay } from 'date-fns';
import SiteMap from '../timeclock/SiteMap';
import { format12Hour } from '@/components/utils/timeUtils';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function EmployeeAssignmentDetail({ employee, assignments, sites, onClose, onViewSite, onRefresh }) {
  const [activeTab, setActiveTab] = useState('current');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSite, setSelectedSite] = useState('');
  const [arrivalTime, setArrivalTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [isSaving, setIsSaving] = useState(false);

  if (!employee) return null;

  const now = new Date();
  const today = startOfDay(now);

  // Categorize assignments
  const currentAssignments = assignments.filter(a => {
    if (!a.start_date && !a.end_date) return true;
    
    const startDate = a.start_date ? startOfDay(parseISO(a.start_date)) : null;
    const endDate = a.end_date ? startOfDay(parseISO(a.end_date)) : null;
    
    if (!startDate && endDate) return endDate >= today;
    if (startDate && !endDate) return startDate <= today;
    if (startDate && endDate) {
      return startDate <= today && endDate >= today;
    }
    return true;
  });

  const futureAssignments = assignments.filter(a => {
    if (!a.start_date) return false;
    const startDate = startOfDay(parseISO(a.start_date));
    return startDate > today;
  });

  const pastAssignments = assignments.filter(a => {
    if (!a.end_date) return false;
    const endDate = startOfDay(parseISO(a.end_date));
    return endDate < today;
  });

  const assignedSiteIds = assignments.map(a => a.site_id);
  const availableSites = sites.filter(s => !assignedSiteIds.includes(s.id));

  const getSite = (siteId) => sites.find(s => s.id === siteId);

  const handleAddAssignment = async () => {
    if (!selectedSite) {
      toast.error('Please select a site');
      return;
    }

    setIsSaving(true);
    try {
      await base44.entities.EmployeeSite.create({
        employee_id: employee.id,
        site_id: selectedSite,
        arrival_time: arrivalTime,
        end_time: endTime
      });

      toast.success('Assignment added successfully!');
      setShowAddForm(false);
      setSelectedSite('');
      setArrivalTime('09:00');
      setEndTime('17:00');
      onRefresh?.();
    } catch (err) {
      toast.error('Failed to add assignment: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const AssignmentCard = ({ assignment, type }) => {
    const site = getSite(assignment.site_id);
    if (!site) return null;

    return (
      <Card className="border">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <button
                  onClick={() => onViewSite && onViewSite(site)}
                  className="font-semibold text-lg flex items-center gap-2 hover:text-blue-600 underline-offset-4 hover:underline text-left"
                >
                  <Building2 className="h-5 w-5 text-blue-600" />
                  {site.name}
                </button>
                <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {site.address}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {type === 'future' && <Badge variant="secondary">Upcoming</Badge>}
                {type === 'past' && <Badge variant="outline">Completed</Badge>}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onViewSite && onViewSite(site)}
                >
                  <ExternalLink className="h-4 w-4 text-slate-400" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t">
              <div>
                <div className="text-xs text-slate-500 mb-1">Daily Schedule</div>
                <div className="flex items-center gap-1 text-sm font-medium">
                  <Clock className="h-4 w-4 text-slate-400" />
                  {format12Hour(assignment.arrival_time || '09:00')} - {format12Hour(assignment.end_time || '17:00')}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Assignment Period</div>
                <div className="flex items-center gap-1 text-sm font-medium">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  {assignment.start_date ? format(parseISO(assignment.start_date), 'MMM d') : 'Ongoing'}
                  {assignment.end_date && ` - ${format(parseISO(assignment.end_date), 'MMM d')}`}
                </div>
              </div>
            </div>

            {site.latitude && site.longitude && (
              <div className="pt-3 border-t">
                <div className="text-xs text-slate-500 mb-2">Location</div>
                <div className="h-32 rounded-lg overflow-hidden">
                  <SiteMap 
                    sites={[site]} 
                    height="128px" 
                    showGeofence={true}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={!!employee} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {employee.full_name || employee.email}
          </DialogTitle>
          <div className="flex items-center gap-4 text-sm text-slate-600 mt-2">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {format12Hour(employee.daily_start || '09:00')} - {format12Hour(employee.daily_end || '17:00')}
            </span>
            <span>{employee.work_days?.join(', ') || 'Mon-Fri'}</span>
          </div>
        </DialogHeader>

        {/* Add Site Form */}
        <div className="mt-4">
          {showAddForm ? (
            <div className="border rounded-lg p-4 bg-slate-50">
              <h3 className="font-medium mb-4">Assign to Site</h3>
              <div className="space-y-4">
                <div>
                  <Label>Select Site</Label>
                  <Select value={selectedSite} onValueChange={setSelectedSite}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a site" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSites.map(site => (
                        <SelectItem key={site.id} value={site.id}>
                          {site.name}
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
              Assign to New Site
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="current">
              Current ({currentAssignments.length})
            </TabsTrigger>
            <TabsTrigger value="future">
              Future ({futureAssignments.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastAssignments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4 mt-6">
            {currentAssignments.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No current assignments
              </div>
            ) : (
              currentAssignments.map(a => (
                <AssignmentCard key={a.id} assignment={a} type="current" />
              ))
            )}
          </TabsContent>

          <TabsContent value="future" className="space-y-4 mt-6">
            {futureAssignments.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No future assignments
              </div>
            ) : (
              futureAssignments.map(a => (
                <AssignmentCard key={a.id} assignment={a} type="future" />
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4 mt-6">
            {pastAssignments.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No past assignments
              </div>
            ) : (
              pastAssignments.map(a => (
                <AssignmentCard key={a.id} assignment={a} type="past" />
              ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}