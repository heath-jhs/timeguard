import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Building2, Calendar, BarChart3, Map, Settings, Bell, UserCheck } from 'lucide-react';
import UserManagement from '../components/admin/UserManagement';
import PendingEnrollments from '../components/admin/PendingEnrollments';
import SiteManagement from '../components/admin/SiteManagement';
import SiteAssignment from '../components/admin/SiteAssignment';
import ReportsChart from '../components/admin/ReportsChart';
import SiteMap from '../components/timeclock/SiteMap';
import LiveActivityMap from '../components/admin/LiveActivityMap';
import EnhancedReports from '../components/admin/EnhancedReports';
import TroubleshootView from '../components/admin/TroubleshootView';
import VarianceAlerts from '../components/manager/VarianceAlerts';
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const queryClient = useQueryClient();

  // Fetch all profiles
  const { data: profiles = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => base44.entities.Profile.list()
  });

  // Fetch all sites
  const { data: sites = [], isLoading: loadingSites } = useQuery({
    queryKey: ['sites'],
    queryFn: () => base44.entities.Site.list()
  });

  // Fetch all assignments
  const { data: assignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => base44.entities.EmployeeSite.list()
  });

  // Fetch all time entries
  const { data: entries = [], isLoading: loadingEntries } = useQuery({
    queryKey: ['timeEntries'],
    queryFn: () => base44.entities.TimeEntry.list()
  });

  // Fetch variance alerts
  const { data: alerts = [] } = useQuery({
    queryKey: ['varianceAlerts'],
    queryFn: () => base44.entities.VarianceAlert.list()
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['profiles'] });
    queryClient.invalidateQueries({ queryKey: ['sites'] });
    queryClient.invalidateQueries({ queryKey: ['assignments'] });
    queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
    queryClient.invalidateQueries({ queryKey: ['varianceAlerts'] });
  };

  const isLoading = loadingProfiles || loadingSites || loadingAssignments || loadingEntries;

  // Stats
  const totalEmployees = profiles.filter(p => p.role === 'employee').length;
  const activeSites = sites.filter(s => s.is_active !== false).length;
  const activeClocks = entries.filter(e => e.status === 'active').length;
  const todayEntries = entries.filter(e => {
    const today = new Date().toDateString();
    return new Date(e.clock_in_time).toDateString() === today;
  }).length;
  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged).length;
  const pendingEnrollments = profiles.filter(p => p.registration_status === 'pending').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              Admin Dashboard
            </h1>
            <p className="text-slate-500 mt-1">
              Manage users, sites, and view reports
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TroubleshootView profiles={profiles} sites={sites} />
            <Badge className="bg-indigo-100 text-indigo-700 px-3 py-1">
              Administrator
            </Badge>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-md border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Employees</p>
                <p className="text-2xl font-bold text-slate-900">{totalEmployees}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Active Sites</p>
                <p className="text-2xl font-bold text-slate-900">{activeSites}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <Building2 className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Currently Clocked In</p>
                <p className="text-2xl font-bold text-slate-900">{activeClocks}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="w-5 h-5 flex items-center justify-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Today's Entries</p>
                <p className="text-2xl font-bold text-slate-900">{todayEntries}</p>
              </div>
              <div className="p-3 bg-violet-50 rounded-lg">
                <Calendar className="h-5 w-5 text-violet-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-white shadow-sm rounded-lg">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Pending {pendingEnrollments > 0 && (
                <Badge className="bg-amber-500 text-white h-5 min-w-5 px-1">
                  {pendingEnrollments}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="sites" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Sites
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Assignments
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Alerts {unacknowledgedAlerts > 0 && (
                <Badge className="bg-orange-500 text-white h-5 min-w-5 px-1">
                  {unacknowledgedAlerts}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="live" className="flex items-center gap-2">
              <div className="w-4 h-4 flex items-center justify-center">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
              Live
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              Map
            </TabsTrigger>
          </TabsList>

            <TabsContent value="pending" className="mt-6">
              <PendingEnrollments
                profiles={profiles}
                onRefresh={handleRefresh}
              />
            </TabsContent>

            <TabsContent value="users" className="mt-6">
              <UserManagement 
                profiles={profiles.filter(p => p.registration_status !== 'pending')} 
                onRefresh={handleRefresh}
                sites={sites}
                assignments={assignments}
              />
            </TabsContent>

          <TabsContent value="sites" className="mt-6">
            <SiteManagement 
              sites={sites} 
              profiles={profiles}
              assignments={assignments}
              onRefresh={handleRefresh} 
            />
          </TabsContent>

          <TabsContent value="assignments" className="mt-6">
            <SiteAssignment 
              profiles={profiles} 
              sites={sites} 
              assignments={assignments}
              onRefresh={handleRefresh} 
            />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <EnhancedReports 
              entries={entries} 
              profiles={profiles} 
              sites={sites}
            />
          </TabsContent>

          <TabsContent value="alerts" className="mt-6">
            <VarianceAlerts 
              alerts={alerts}
              profiles={profiles}
              sites={sites}
              onRefresh={handleRefresh}
            />
          </TabsContent>

          <TabsContent value="live" className="mt-6">
            <LiveActivityMap 
              entries={entries} 
              profiles={profiles} 
              sites={sites}
            />
          </TabsContent>

          <TabsContent value="map" className="mt-6">
            <div className="bg-white rounded-xl p-4 shadow-lg">
              <h2 className="text-lg font-semibold mb-4">All Work Sites</h2>
              <SiteMap
                sites={sites}
                height="500px"
                showGeofence={true}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}