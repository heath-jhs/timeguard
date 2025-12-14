import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Loader2, Clock } from 'lucide-react';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        
        if (!isAuth) {
          window.location.href = createPageUrl('Login');
          return;
        }

        const user = await base44.auth.me();
        const profiles = await base44.entities.Profile.filter({ email: user.email });
        
        if (profiles.length > 0) {
          const profile = profiles[0];
          
          if (!profile.has_password) {
            // User needs to complete setup
            window.location.href = createPageUrl('Login');
            return;
          }
          
          // Use preferred dashboard if set, otherwise default by role
          if (profile.preferred_dashboard) {
            window.location.href = createPageUrl(profile.preferred_dashboard);
          } else if (profile.role === 'admin') {
            window.location.href = createPageUrl('AdminDashboard');
          } else if (profile.role === 'manager') {
            window.location.href = createPageUrl('ManagerDashboard');
          } else {
            window.location.href = createPageUrl('EmployeeDashboard');
          }
        } else {
          // No profile found, redirect to login
          window.location.href = createPageUrl('Login');
        }
      } catch (error) {
        // Not authenticated, redirect to login
        window.location.href = createPageUrl('Login');
      }
    };

    checkAuthAndRedirect();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="p-4 bg-blue-600 rounded-2xl mb-6">
        <Clock className="h-12 w-12 text-white" />
      </div>
      <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
      <p className="text-slate-400">Loading your dashboard...</p>
    </div>
  );
}