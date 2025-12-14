import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Check, AlertTriangle, ArrowUpDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function VarianceAlerts({ alerts, profiles, sites, onRefresh }) {
  const [sortBy, setSortBy] = useState('date');
  const [filterSite, setFilterSite] = useState('all');
  const [filterEmployee, setFilterEmployee] = useState('all');
  const handleAcknowledge = async (alert) => {
    try {
      await base44.entities.VarianceAlert.update(alert.id, {
        acknowledged: true,
        acknowledged_at: new Date().toISOString()
      });
      toast.success('Alert acknowledged');
      onRefresh?.();
    } catch (err) {
      toast.error('Failed to acknowledge: ' + err.message);
    }
  };

  const getEmployeeName = (employeeId) => {
    const emp = profiles.find(p => p.id === employeeId);
    return emp?.full_name || emp?.email || 'Unknown';
  };

  const getSiteName = (siteId) => {
    const site = sites.find(s => s.id === siteId);
    return site?.name || 'Unknown';
  };

  // Filter alerts
  let filteredAlerts = alerts;
  if (filterSite !== 'all') {
    filteredAlerts = filteredAlerts.filter(a => a.site_id === filterSite);
  }
  if (filterEmployee !== 'all') {
    filteredAlerts = filteredAlerts.filter(a => a.employee_id === filterEmployee);
  }

  // Sort alerts
  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.date) - new Date(a.date);
      case 'variance':
        return b.variance_percentage - a.variance_percentage;
      case 'employee':
        return getEmployeeName(a.employee_id).localeCompare(getEmployeeName(b.employee_id));
      case 'site':
        return getSiteName(a.site_id).localeCompare(getSiteName(b.site_id));
      default:
        return 0;
    }
  });

  const pendingAlerts = sortedAlerts.filter(a => !a.acknowledged);
  const acknowledgedAlerts = sortedAlerts.filter(a => a.acknowledged);

  return (
    <div className="space-y-6">
      {/* Filters and Sort */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Sort By
              </label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date (Newest First)</SelectItem>
                  <SelectItem value="variance">Variance % (Highest First)</SelectItem>
                  <SelectItem value="employee">Employee Name</SelectItem>
                  <SelectItem value="site">Site Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Filter by Site</label>
              <Select value={filterSite} onValueChange={setFilterSite}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sites</SelectItem>
                  {sites.map(site => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Filter by Employee</label>
              <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {profiles.filter(p => p.role === 'employee').map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name || emp.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-600" />
            Pending Variance Alerts ({pendingAlerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingAlerts.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No pending alerts
            </div>
          ) : (
            <div className="space-y-3">
              {pendingAlerts.map(alert => (
                <div key={alert.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        <span className="font-semibold text-slate-900">
                          {getEmployeeName(alert.employee_id)} - {getSiteName(alert.site_id)}
                        </span>
                      </div>
                      <div className="text-sm space-y-1">
                        <p className="text-slate-700">
                          Date: {format(new Date(alert.date), 'MMM d, yyyy')}
                        </p>
                        <p className="text-slate-700">
                          Expected: {alert.expected_hours}h | Actual: {alert.actual_hours}h
                        </p>
                        <p className="text-orange-700 font-medium">
                          Variance: {alert.variance_percentage.toFixed(1)}% (Threshold: {alert.threshold_used}%)
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAcknowledge(alert)}
                      className="ml-4"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Acknowledge
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            Acknowledged Alerts ({acknowledgedAlerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {acknowledgedAlerts.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No acknowledged alerts
            </div>
          ) : (
            <div className="space-y-3">
              {acknowledgedAlerts.slice(0, 10).map(alert => (
                <div key={alert.id} className="border rounded-lg p-4 bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-slate-900">
                          {getEmployeeName(alert.employee_id)} - {getSiteName(alert.site_id)}
                        </span>
                        <Badge className="bg-green-100 text-green-700">
                          Acknowledged
                        </Badge>
                      </div>
                      <div className="text-sm space-y-1 text-slate-600">
                        <p>Date: {format(new Date(alert.date), 'MMM d, yyyy')}</p>
                        <p>Expected: {alert.expected_hours}h | Actual: {alert.actual_hours}h</p>
                        <p>Variance: {alert.variance_percentage.toFixed(1)}%</p>
                        {alert.acknowledged_at && (
                          <p className="text-xs">
                            Acknowledged: {format(new Date(alert.acknowledged_at), 'MMM d, yyyy h:mm a')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}