import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Clock } from 'lucide-react';
import { format } from 'date-fns';
import SiteMap from '../timeclock/SiteMap';

export default function LiveActivityMap({ entries, profiles, sites }) {
  // Get active clock-ins
  const activeEntries = useMemo(() => {
    return entries.filter(e => e.status === 'active' && !e.clock_out_time);
  }, [entries]);

  // Group by site
  const siteActivity = useMemo(() => {
    const grouped = {};
    activeEntries.forEach(entry => {
      if (!grouped[entry.site_id]) {
        grouped[entry.site_id] = [];
      }
      const profile = profiles.find(p => p.id === entry.employee_id);
      if (profile) {
        grouped[entry.site_id].push({
          ...entry,
          profile
        });
      }
    });
    return grouped;
  }, [activeEntries, profiles]);

  const activeSites = sites.filter(s => siteActivity[s.id]);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-slate-600" />
            Live Activity Map
          </span>
          <Badge variant="secondary" className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            {activeEntries.length} Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Map */}
        <div className="rounded-xl overflow-hidden border">
          {activeSites.length > 0 ? (
            <SiteMap 
              sites={activeSites} 
              height="400px" 
              showGeofence={true}
            />
          ) : (
            <div className="h-64 flex items-center justify-center bg-slate-50 text-slate-500">
              <div className="text-center">
                <MapPin className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No active clock-ins</p>
              </div>
            </div>
          )}
        </div>

        {/* Active Sites List */}
        {activeSites.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-slate-700">Active by Site</h3>
            {activeSites.map(site => (
              <Card key={site.id} className="border">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{site.name}</h4>
                      <p className="text-sm text-slate-600">{site.address}</p>
                    </div>
                    <Badge variant="secondary">
                      <Users className="h-3 w-3 mr-1" />
                      {siteActivity[site.id].length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {siteActivity[site.id].map(activity => (
                      <div 
                        key={activity.id} 
                        className="flex items-center justify-between text-sm bg-slate-50 rounded-lg p-2"
                      >
                        <span className="font-medium">
                          {activity.profile.full_name || activity.profile.email}
                        </span>
                        <span className="text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Since {format(new Date(activity.clock_in_time), 'HH:mm')}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}