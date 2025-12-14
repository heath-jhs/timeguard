import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Navigation, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { format12Hour } from '@/components/utils/timeUtils';

export default function AssignmentsList({ assignments, sites, onNavigate }) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const categorizedAssignments = assignments.reduce((acc, assignment) => {
    const site = sites.find(s => s.id === assignment.site_id);
    if (!site) return acc;

    const startDate = assignment.start_date ? new Date(assignment.start_date) : null;
    const endDate = assignment.end_date ? new Date(assignment.end_date) : null;

    if (startDate && startDate > now) {
      acc.upcoming.push({ ...assignment, site });
    } else if (!endDate || endDate >= now) {
      acc.current.push({ ...assignment, site });
    } else {
      acc.past.push({ ...assignment, site });
    }

    return acc;
  }, { current: [], upcoming: [], past: [] });

  const AssignmentCard = ({ assignment, isPast = false }) => (
    <div className={`border rounded-lg p-4 ${isPast ? 'bg-slate-50' : 'bg-white'}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-slate-900">{assignment.site.name}</h3>
          <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3" />
            {assignment.site.address}
          </p>
        </div>
        {!isPast && assignment.site.latitude && assignment.site.longitude && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onNavigate?.(assignment.site)}
          >
            <Navigation className="h-4 w-4 mr-1" />
            Navigate
          </Button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2 mt-3">
        {assignment.arrival_time && assignment.end_time && (
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {format12Hour(assignment.arrival_time)} - {format12Hour(assignment.end_time)}
          </Badge>
        )}
        {assignment.site.allowed_hours_start && assignment.site.allowed_hours_end && (
          <Badge variant="secondary" className="text-xs">
            Allowed: {format12Hour(assignment.site.allowed_hours_start)} - {format12Hour(assignment.site.allowed_hours_end)}
          </Badge>
        )}
      </div>

      {(assignment.start_date || assignment.end_date) && (
        <div className="text-xs text-slate-500 mt-2">
          {assignment.start_date && format(new Date(assignment.start_date), 'MMM d, yyyy')}
          {assignment.start_date && assignment.end_date && ' - '}
          {assignment.end_date && format(new Date(assignment.end_date), 'MMM d, yyyy')}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Current Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categorizedAssignments.current.length === 0 ? (
            <p className="text-center py-8 text-slate-500">No current assignments</p>
          ) : (
            <div className="space-y-3">
              {categorizedAssignments.current.map(a => (
                <AssignmentCard key={a.id} assignment={a} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {categorizedAssignments.upcoming.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              Upcoming Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categorizedAssignments.upcoming.map(a => (
                <AssignmentCard key={a.id} assignment={a} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {categorizedAssignments.past.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-slate-400" />
              Past Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categorizedAssignments.past.slice(0, 5).map(a => (
                <AssignmentCard key={a.id} assignment={a} isPast />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}