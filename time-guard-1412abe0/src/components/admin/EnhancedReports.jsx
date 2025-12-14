import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Calendar } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { toast } from 'sonner';

export default function EnhancedReports({ entries, profiles, sites }) {
  const [timeRange, setTimeRange] = useState('7');
  const [selectedSite, setSelectedSite] = useState('all');

  const reportData = useMemo(() => {
    const days = parseInt(timeRange);
    const startDate = startOfDay(subDays(new Date(), days - 1));
    const endDate = endOfDay(new Date());

    let filteredEntries = entries.filter(e => {
      const entryDate = new Date(e.clock_in_time);
      return entryDate >= startDate && entryDate <= endDate;
    });

    if (selectedSite !== 'all') {
      filteredEntries = filteredEntries.filter(e => e.site_id === selectedSite);
    }

    // Calculate hours by employee and site
    const employeeHours = {};
    const siteHours = {};

    filteredEntries.forEach(entry => {
      if (entry.clock_in_time && entry.clock_out_time) {
        const minutes = (new Date(entry.clock_out_time) - new Date(entry.clock_in_time)) / (1000 * 60);
        const hours = minutes / 60;

        // By employee
        if (!employeeHours[entry.employee_id]) {
          employeeHours[entry.employee_id] = 0;
        }
        employeeHours[entry.employee_id] += hours;

        // By site
        if (!siteHours[entry.site_id]) {
          siteHours[entry.site_id] = 0;
        }
        siteHours[entry.site_id] += hours;
      }
    });

    return { filteredEntries, employeeHours, siteHours };
  }, [entries, timeRange, selectedSite]);

  const getEmployeeName = (employeeId) => {
    const emp = profiles.find(p => p.id === employeeId);
    return emp?.full_name || emp?.email || 'Unknown';
  };

  const getSiteName = (siteId) => {
    const site = sites.find(s => s.id === siteId);
    return site?.name || 'Unknown';
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Employee', 'Site', 'Clock In', 'Clock Out', 'Hours', 'Status'];
    const rows = reportData.filteredEntries.map(entry => {
      const hours = entry.clock_in_time && entry.clock_out_time
        ? ((new Date(entry.clock_out_time) - new Date(entry.clock_in_time)) / (1000 * 60 * 60)).toFixed(2)
        : 'N/A';

      return [
        format(new Date(entry.clock_in_time), 'yyyy-MM-dd'),
        getEmployeeName(entry.employee_id),
        getSiteName(entry.site_id),
        format(new Date(entry.clock_in_time), 'HH:mm'),
        entry.clock_out_time ? format(new Date(entry.clock_out_time), 'HH:mm') : 'Active',
        hours,
        entry.status
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timesheet-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Report exported successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-600" />
            Time Clock Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-500" />
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="14">Last 14 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={selectedSite} onValueChange={setSelectedSite}>
              <SelectTrigger className="w-52">
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

            <Button onClick={exportToCSV} variant="outline" className="ml-auto">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Hours by Site */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Hours by Site</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(reportData.siteHours)
              .sort(([, a], [, b]) => b - a)
              .map(([siteId, hours]) => (
                <div key={siteId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="font-medium">{getSiteName(siteId)}</span>
                  <span className="text-lg font-bold text-blue-600">
                    {hours.toFixed(1)}h
                  </span>
                </div>
              ))}
            {Object.keys(reportData.siteHours).length === 0 && (
              <div className="text-center py-8 text-slate-500">
                No data for selected period
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hours by Employee */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Hours by Employee</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(reportData.employeeHours)
              .sort(([, a], [, b]) => b - a)
              .map(([employeeId, hours]) => {
                const profile = profiles.find(p => p.id === employeeId);
                const expectedHours = profile?.work_hours || 8;
                const daysInRange = parseInt(timeRange);
                const expectedTotal = expectedHours * Math.min(daysInRange, 5); // Assuming 5 work days per week
                const variance = hours - expectedTotal;

                return (
                  <div key={employeeId} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{getEmployeeName(employeeId)}</span>
                      <span className="text-lg font-bold text-blue-600">
                        {hours.toFixed(1)}h
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span>Expected: {expectedTotal.toFixed(1)}h</span>
                      <span className={variance >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {variance >= 0 ? '+' : ''}{variance.toFixed(1)}h
                      </span>
                    </div>
                  </div>
                );
              })}
            {Object.keys(reportData.employeeHours).length === 0 && (
              <div className="text-center py-8 text-slate-500">
                No data for selected period
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}