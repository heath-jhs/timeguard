import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, History, MapPin, Calendar, Settings, Camera } from 'lucide-react';
import ClockWidget from '../components/timeclock/ClockWidget';
import TimeHistory from '../components/timeclock/TimeHistory';
import WeeklyStats from '../components/timeclock/WeeklyStats';
import SiteMap from '../components/timeclock/SiteMap';
import { useLocationWatcher } from '../components/timeclock/LocationWatcher';
import { isWithinGeofence } from '../components/timeclock/GeofenceUtils';
import { Skeleton } from "@/components/ui/skeleton";
import GPSSettings from '../components/employee/GPSSettings';
import AssignmentsList from '../components/employee/AssignmentsList';
import OnsiteActions from '../components/employee/OnsiteActions';
import CalendarSync from '../components/calendar/CalendarSync';

export default function EmployeeDashboard() {
  const [profile, setProfile] = useState(undefined);
  const [activeTab, setActiveTab] = useState('clock');
  const queryClient = useQueryClient();
  const { location, getCurrentPosition } = useLocationWatcher();

  // Fetch current user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
          const profiles = await base44.entities.Profile.filter({ email: user.email });
          if (profiles.length > 0) {
            setProfile(profiles[0]);
          } else {
            console.error('No profile found for user:', user.email);
            setProfile(null);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
      }
    };
    fetchProfile();
  }, []);

  // Fetch assigned sites for this employee
  const { data: assignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ['employeeSites', profile?.id],
    queryFn: () => base44.entities.EmployeeSite.filter({ employee_id: profile?.id }),
    enabled: !!profile?.id
  });

  // Fetch all sites
  const { data: allSites = [], isLoading: loadingSites } = useQuery({
    queryKey: ['sites'],
    queryFn: () => base44.entities.Site.list()
  });

  // Get assigned sites with full details
  const assignedSites = allSites.filter(site => 
    assignments.some(a => a.site_id === site.id)
  );

  // Fetch time entries for this employee
  const { data: entries = [], isLoading: loadingEntries } = useQuery({
    queryKey: ['timeEntries', profile?.id],
    queryFn: () => base44.entities.TimeEntry.filter({ employee_id: profile?.id }),
    enabled: !!profile?.id
  });

  // Find active entry (clocked in but not out)
  const activeEntry = entries.find(e => e.status === 'active' && !e.clock_out_time);

  // Check if currently at any assigned site
  const currentSite = assignedSites.find(site => {
    if (!site.latitude || !site.longitude || !location) return false;
    const check = isWithinGeofence(
      location.latitude,
      location.longitude,
      site.latitude,
      site.longitude,
      site.geofence_radius || 100
    );
    return check.isWithin;
  });

  const handleNavigate = (site) => {
    if (site.latitude && site.longitude) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${site.latitude},${site.longitude}`,
        '_blank'
      );
    }
  };

  const handleClockAction = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['timeEntries', profile?.id] });
  }, [queryClient, profile?.id]);

  // Get user location on mount
  useEffect(() => {
    getCurrentPosition().catch(() => {});
  }, [getCurrentPosition]);

  const isLoading = !profile || (profile && (loadingAssignments || loadingSites || loadingEntries));

  if (profile === undefined) {
    // Still loading initial profile
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (profile === null) {
    // Profile not found
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Profile Not Found</h2>
          <p className="text-slate-600">Please contact your administrator to set up your account.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              Welcome, {profile.full_name?.split(' ')[0] || 'Employee'}
            </h1>
            <p className="text-slate-500 mt-1">
              {new Date().toLocaleDateString([], { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>

        {/* Weekly Stats */}
        <WeeklyStats entries={entries} workHoursPerDay={profile.work_hours || 8} profile={profile} />

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 gap-1 h-auto p-1">
            <TabsTrigger value="clock" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Clock</span>
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Sites</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Map</span>
            </TabsTrigger>
            {currentSite && (
              <TabsTrigger value="onsite" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline">Onsite</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">GPS</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clock" className="mt-6">
            <ClockWidget
              profile={profile}
              assignedSites={assignedSites}
              activeEntry={activeEntry}
              onClockAction={handleClockAction}
            />
          </TabsContent>

          <TabsContent value="assignments" className="mt-6">
            <AssignmentsList
              assignments={assignments}
              sites={allSites}
              onNavigate={handleNavigate}
            />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <TimeHistory entries={entries} sites={allSites} />
          </TabsContent>

          <TabsContent value="map" className="mt-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Your Work Sites</h2>
              {assignedSites.length > 0 ? (
                <SiteMap
                  sites={assignedSites}
                  userLocation={location}
                  height="450px"
                  showGeofence={true}
                />
              ) : (
                <div className="bg-white rounded-xl p-8 text-center text-slate-500 border">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No work sites assigned yet</p>
                  <p className="text-sm mt-1">Contact your administrator</p>
                </div>
              )}
            </div>
          </TabsContent>

          {currentSite && (
            <TabsContent value="onsite" className="mt-6">
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-800">
                    You are currently at: {currentSite.name}
                  </p>
                </div>
                <OnsiteActions
                  site={currentSite}
                  profile={profile}
                  location={location}
                />
              </div>
            </TabsContent>
          )}

          <TabsContent value="settings" className="mt-6">
            <div className="space-y-6">
              <CalendarSync profile={profile} />
              <GPSSettings profile={profile} onUpdate={() => window.location.reload()} />
            </div>
          </TabsContent>
          </Tabs>
      </div>
    </div>
  );
}