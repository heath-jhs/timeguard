import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Building2, Calendar, BarChart3, Bell } from 'lucide-react';
import SiteManagement from '../components/admin/SiteManagement';
import SiteAssignment from '../components/admin/SiteAssignment';
import EnhancedReports from '../components/admin/EnhancedReports';
import VarianceAlerts from '../components/manager/VarianceAlerts';
import LiveActivityMap from '../components/admin/LiveActivityMap';
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function ManagerDashboard() {
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('sites');
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchProfile = async () => {
      const user = await base44.auth.me();
      const profiles = await base44.entities.Profile.filter({ email: user.email });
      if (profiles.length > 0) {
        setProfile(profiles[0]);
      }
    };
    fetchProfile();
  }, []);

  const { data: profiles = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => base44.entities.Profile.list()
  });

  const { data: sites = [], isLoading: loadingSites } = useQuery({
    queryKey: ['sites'],
    queryFn: () => base44.entities.Site.list()
  });

  const { data: assignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => base44.entities.EmployeeSite.list()
  });

  const { data: entries = [], isLoading: loadingEntries } = useQuery({
    queryKey: ['timeEntries'],
    queryFn: () => base44.entities.TimeEntry.list()
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['varianceAlerts', profile?.id],
    queryFn: () => base44.entities.VarianceAlert.filter({ manager_id: profile?.id }),
    enabled: !!profile?.id
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['profiles'] });
    queryClient.invalidateQueries({ queryKey: ['sites'] });
    queryClient.invalidateQueries({ queryKey: ['assignments'] });
    queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
    queryClient.invalidateQueries({ queryKey: ['varianceAlerts'] });
  };

  const isLoading = loadingProfiles || loadingSites || loadingAssignments || loadingEntries;

  const mySites = sites.filter(s => s.manager_id === profile?.id);
  const totalEmployees = profiles.filter(p => p.role === 'employee').length;
  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged).length;

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              Manager Dashboard
            </h1>
            <p className="text-slate-500 mt-1">
              Manage your sites and team
            </p>
          </div>
          <Badge className="bg-violet-100 text-violet-700 px-3 py-1">
            Manager
          </Badge>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-md border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">My Sites</p>
                <p className="text-2xl font-bold text-slate-900">{mySites.length}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <Building2 className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </div>
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
                <p className="text-sm text-slate-500">Pending Alerts</p>
                <p className="text-2xl font-bold text-slate-900">{unacknowledgedAlerts}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <Bell className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-white shadow-sm rounded-lg">
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
          </TabsList>

          <TabsContent value="sites" className="mt-6">
            <SiteManagement sites={sites} onRefresh={handleRefresh} />
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
        </Tabs>
      </div>
    </div>
  );
}