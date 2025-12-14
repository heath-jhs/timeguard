import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { BarChart3, Calendar } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

export default function ReportsChart({ entries, profiles, sites }) {
  const [timeRange, setTimeRange] = useState('7');
  const [chartType, setChartType] = useState('hours');

  const chartData = useMemo(() => {
    const days = parseInt(timeRange);
    const startDate = subDays(new Date(), days - 1);
    const endDate = new Date();
    
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
    
    return dateRange.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayEntries = entries.filter(e => {
        const entryDate = format(new Date(e.clock_in_time), 'yyyy-MM-dd');
        return entryDate === dateStr;
      });
      
      let totalMinutes = 0;
      dayEntries.forEach(entry => {
        if (entry.clock_in_time && entry.clock_out_time) {
          const start = new Date(entry.clock_in_time);
          const end = new Date(entry.clock_out_time);
          totalMinutes += (end - start) / (1000 * 60);
        }
      });
      
      const uniqueEmployees = new Set(dayEntries.map(e => e.employee_id)).size;
      
      return {
        date: format(date, 'MMM d'),
        fullDate: dateStr,
        hours: Math.round(totalMinutes / 60 * 10) / 10,
        entries: dayEntries.length,
        employees: uniqueEmployees
      };
    });
  }, [entries, timeRange]);



  const totalHours = chartData.reduce((sum, d) => sum + d.hours, 0);
  const totalEntries = chartData.reduce((sum, d) => sum + d.entries, 0);
  const avgHoursPerDay = chartData.length > 0 ? (totalHours / chartData.length).toFixed(1) : 0;

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-slate-600" />
          Time Reports
        </CardTitle>
        
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={chartType} onValueChange={setChartType}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hours">Hours</SelectItem>
              <SelectItem value="entries">Entries</SelectItem>
              <SelectItem value="employees">Employees</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-900">{totalHours.toFixed(1)}h</div>
            <div className="text-sm text-blue-600">Total Hours</div>
          </div>
          <div className="bg-emerald-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-emerald-900">{totalEntries}</div>
            <div className="text-sm text-emerald-600">Total Entries</div>
          </div>
          <div className="bg-violet-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-violet-900">{avgHoursPerDay}h</div>
            <div className="text-sm text-violet-600">Avg/Day</div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'hours' ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="hours" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                  name="Hours Worked"
                />
              </LineChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey={chartType} 
                  fill={chartType === 'entries' ? '#10b981' : '#8b5cf6'}
                  radius={[4, 4, 0, 0]}
                  name={chartType === 'entries' ? 'Clock Entries' : 'Active Employees'}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}