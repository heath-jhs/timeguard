import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Clock, Calendar, Flame } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from 'lucide-react';

export default function WeeklyStats({ entries, workHoursPerDay = 8, profile }) {
  const stats = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weekEntries = entries.filter(e => 
      new Date(e.clock_in_time) >= startOfWeek
    );

    // Calculate total hours this week
    let totalMinutes = 0;
    weekEntries.forEach(entry => {
      if (entry.clock_in_time) {
        const start = new Date(entry.clock_in_time);
        const end = entry.clock_out_time ? new Date(entry.clock_out_time) : now;
        totalMinutes += (end - start) / (1000 * 60);
      }
    });

    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
    const expectedHours = workHoursPerDay * 5;
    const progress = Math.min(100, Math.round((totalHours / expectedHours) * 100));

    // Calculate streak (consecutive work days, excluding scheduled days off)
    const workDays = profile?.work_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    let streak = 0;
    const dayCheck = new Date();
    
    while (true) {
      const dayStart = new Date(dayCheck);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayCheck);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayName = dayNames[dayCheck.getDay()];
      const isWorkDay = workDays.includes(dayName);
      
      if (isWorkDay) {
        const hasEntry = entries.some(e => {
          const entryDate = new Date(e.clock_in_time);
          return entryDate >= dayStart && entryDate <= dayEnd;
        });
        
        if (hasEntry) {
          streak++;
        } else {
          // Only break on missed work days
          break;
        }
      }
      // Skip non-work days without breaking streak
      
      dayCheck.setDate(dayCheck.getDate() - 1);
      if (streak > 365) break; // Safety limit
    }

    // Days worked this week
    const daysWorked = new Set(
      weekEntries.map(e => new Date(e.clock_in_time).toDateString())
    ).size;

    return {
      totalHours,
      expectedHours,
      progress,
      streak,
      daysWorked,
      entriesCount: weekEntries.length
    };
  }, [entries, workHoursPerDay]);

  const statCards = [
    {
      title: 'Hours This Week',
      value: `${stats.totalHours}h`,
      subtext: `of ${stats.expectedHours}h expected`,
      icon: Clock,
      color: 'blue'
    },
    {
      title: 'Days Worked',
      value: stats.daysWorked,
      subtext: 'this week',
      icon: Calendar,
      color: 'emerald'
    },
    {
      title: 'Current Streak',
      value: `${stats.streak} day${stats.streak !== 1 ? 's' : ''}`,
      subtext: 'consecutive work days',
      icon: Flame,
      color: 'orange'
    },
    {
      title: 'Weekly Progress',
      value: `${stats.progress}%`,
      subtext: 'of weekly target',
      icon: TrendingUp,
      color: 'violet',
      tooltip: `Progress towards your ${stats.expectedHours}h weekly target (${workHoursPerDay}h/day × 5 days)`
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
    violet: 'bg-violet-50 text-violet-600'
  };

  return (
    <TooltipProvider>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <Card key={idx} className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs font-medium text-slate-500">
                      {stat.title}
                    </p>
                    {stat.tooltip && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-slate-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs max-w-xs">{stat.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {stat.value}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {stat.subtext}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${colorClasses[stat.color]}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
}