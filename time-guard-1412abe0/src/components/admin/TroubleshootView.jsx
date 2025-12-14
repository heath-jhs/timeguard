import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Clock, Calendar, MapPin, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

export default function TroubleshootView({ profiles, sites }) {
  const [selectedProfile, setSelectedProfile] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const profile = profiles.find(p => p.id === selectedProfile);

  const { data: assignments = [] } = useQuery({
    queryKey: ['troubleshoot-assignments', selectedProfile],
    queryFn: () => base44.entities.EmployeeSite.filter({ employee_id: selectedProfile }),
    enabled: !!selectedProfile && profile?.role === 'employee'
  });

  const { data: entries = [] } = useQuery({
    queryKey: ['troubleshoot-entries', selectedProfile],
    queryFn: () => base44.entities.TimeEntry.filter({ employee_id: selectedProfile }),
    enabled: !!selectedProfile
  });

  const { data: managerSites = [] } = useQuery({
    queryKey: ['troubleshoot-manager-sites', selectedProfile],
    queryFn: () => base44.entities.Site.filter({ manager_id: selectedProfile }),
    enabled: !!selectedProfile && profile?.role === 'manager'
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['troubleshoot-alerts', selectedProfile],
    queryFn: () => base44.entities.VarianceAlert.filter({ manager_id: selectedProfile }),
    enabled: !!selectedProfile && profile?.role === 'manager'
  });

  const activeEntry = entries.find(e => e.status === 'active' && !e.clock_out_time);

  const managers = profiles.filter(p => p.role === 'manager');
  const employees = profiles.filter(p => p.role === 'employee');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          Troubleshoot View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Troubleshoot User View</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select User</label>
            <Select value={selectedProfile} onValueChange={setSelectedProfile}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a user..." />
              </SelectTrigger>
              <SelectContent>
                {managers.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500">
                      Managers
                    </div>
                    {managers.map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.full_name || m.email}
                      </SelectItem>
                    ))}
                  </>
                )}
                {employees.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500">
                      Employees
                    </div>
                    {employees.map(e => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.full_name || e.email}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {profile && (
            <div className="space-y-4">
              {/* User Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">User Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div><span className="font-medium">Name:</span> {profile.full_name || 'N/A'}</div>
                  <div><span className="font-medium">Email:</span> {profile.email}</div>
                  <div><span className="font-medium">Role:</span> <Badge>{profile.role}</Badge></div>
                  {profile.role === 'employee' && (
                    <>
                      <div><span className="font-medium">Expected Hours:</span> {profile.work_hours || 8}/day</div>
                      <div><span className="font-medium">Work Days:</span> {profile.work_days?.join(', ') || 'Mon-Fri'}</div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Employee View */}
              {profile.role === 'employee' && (
                <>
                  {activeEntry && (
                    <Card className="border-green-200 bg-green-50">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Clock className="h-4 w-4 text-green-600" />
                          Currently Clocked In
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm">
                        <div><span className="font-medium">Site:</span> {sites.find(s => s.id === activeEntry.site_id)?.name || 'Unknown'}</div>
                        <div><span className="font-medium">Since:</span> {format(new Date(activeEntry.clock_in_time), 'PPp')}</div>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Current Assignments ({assignments.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {assignments.length === 0 ? (
                        <p className="text-sm text-slate-500">No assignments</p>
                      ) : (
                        <div className="space-y-2">
                          {assignments.map(a => {
                            const site = sites.find(s => s.id === a.site_id);
                            return (
                              <div key={a.id} className="border rounded p-2 text-sm">
                                <div className="font-medium">{site?.name || 'Unknown'}</div>
                                <div className="text-slate-600 text-xs flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {site?.address}
                                </div>
                                {a.arrival_time && a.end_time && (
                                  <div className="text-xs text-slate-500 mt-1">
                                    Hours: {a.arrival_time} - {a.end_time}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Recent Time Entries</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {entries.length === 0 ? (
                        <p className="text-sm text-slate-500">No time entries</p>
                      ) : (
                        <div className="space-y-2">
                          {entries.slice(0, 5).map(e => {
                            const site = sites.find(s => s.id === e.site_id);
                            const duration = e.clock_out_time 
                              ? ((new Date(e.clock_out_time) - new Date(e.clock_in_time)) / (1000 * 60 * 60)).toFixed(2)
                              : 'In Progress';
                            return (
                              <div key={e.id} className="border rounded p-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="font-medium">{site?.name || 'Unknown'}</span>
                                  <Badge variant={e.status === 'active' ? 'default' : 'secondary'}>
                                    {e.status}
                                  </Badge>
                                </div>
                                <div className="text-xs text-slate-600 mt-1">
                                  {format(new Date(e.clock_in_time), 'PP p')}
                                </div>
                                <div className="text-xs text-slate-500">
                                  Duration: {duration} {typeof duration === 'string' ? '' : 'hrs'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Manager View */}
              {profile.role === 'manager' && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Managed Sites ({managerSites.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {managerSites.length === 0 ? (
                        <p className="text-sm text-slate-500">No sites assigned</p>
                      ) : (
                        <div className="space-y-2">
                          {managerSites.map(s => (
                            <div key={s.id} className="border rounded p-2 text-sm">
                              <div className="font-medium">{s.name}</div>
                              <div className="text-xs text-slate-600">{s.address}</div>
                              {s.allowed_hours_start && s.allowed_hours_end && (
                                <div className="text-xs text-slate-500 mt-1">
                                  Hours: {s.allowed_hours_start} - {s.allowed_hours_end}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Variance Alerts ({alerts.filter(a => !a.acknowledged).length} pending)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {alerts.length === 0 ? (
                        <p className="text-sm text-slate-500">No alerts</p>
                      ) : (
                        <div className="space-y-2">
                          {alerts.slice(0, 5).map(a => {
                            const emp = profiles.find(p => p.id === a.employee_id);
                            const site = sites.find(s => s.id === a.site_id);
                            return (
                              <div key={a.id} className="border rounded p-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="font-medium">{emp?.full_name || 'Unknown'}</span>
                                  <Badge variant={a.acknowledged ? 'secondary' : 'destructive'}>
                                    {a.acknowledged ? 'Ack' : 'Pending'}
                                  </Badge>
                                </div>
                                <div className="text-xs text-slate-600">
                                  {site?.name} - {format(new Date(a.date), 'PP')}
                                </div>
                                <div className="text-xs text-slate-500">
                                  Expected: {a.expected_hours}h, Actual: {a.actual_hours}h ({a.variance_percentage.toFixed(1)}%)
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}