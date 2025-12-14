
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  Clock, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  X, 
  User,
  Settings,
  ChevronDown
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import DashboardPreference from '@/components/admin/DashboardPreference';

export default function Layout({ children, currentPageName }) {
  const [profile, setProfile] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Pages that don't need the layout
  const noLayoutPages = ['Login', 'SetPassword', 'EnrollUser', 'Home'];
  const showLayout = !noLayoutPages.includes(currentPageName);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const user = await base44.auth.me();
          const profiles = await base44.entities.Profile.filter({ email: user.email });
          if (profiles.length > 0) {
            setProfile(profiles[0]);
          }
        }
      } catch (e) {
        // Not logged in
      }
      setIsLoading(false);
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await base44.auth.logout(createPageUrl('Home'));
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (profile?.email) {
      return profile.email[0].toUpperCase();
    }
    return 'U';
  };

  if (!showLayout) {
    return children;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link 
              to={createPageUrl('Home')}
              className="flex items-center gap-2 text-slate-900 hover:text-slate-700 transition-colors"
            >
              <div className="p-2 bg-blue-600 rounded-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg hidden sm:block">Time Clock</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {(profile?.role === 'admin' || profile?.role === 'manager') ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                      <ChevronDown className="h-3 w-3 text-slate-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('AdminDashboard')} className="w-full cursor-pointer">
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('ManagerDashboard')} className="w-full cursor-pointer">
                        Manager Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('EmployeeDashboard')} className="w-full cursor-pointer">
                        Employee Dashboard
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to={createPageUrl('EmployeeDashboard')}>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
              )}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-sm">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm font-medium max-w-32 truncate">
                      {profile?.full_name || profile?.email || 'User'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{profile?.full_name || 'User'}</p>
                    <p className="text-xs text-slate-500">{profile?.email}</p>
                    <p className="text-xs text-blue-600 capitalize mt-1">{profile?.role}</p>
                    </div>
                    <DropdownMenuSeparator />
                    {(profile?.role === 'admin' || profile?.role === 'manager') && (
                    <>
                      <div className="px-2 py-1">
                        <DashboardPreference 
                          profile={profile} 
                          onUpdate={() => window.location.reload()} 
                        />
                      </div>
                      <DropdownMenuSeparator />
                    </>
                    )}
                  <DropdownMenuItem 
                    className="text-red-600 cursor-pointer"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Button */}
              <Button 
                variant="ghost" 
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-white px-4 py-3 space-y-1">
            {profile?.role === 'admin' ? (
              <Link 
                to={createPageUrl('AdminDashboard')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Button variant="ghost" className="w-full justify-start">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            ) : profile?.role === 'manager' ? (
              <Link 
                to={createPageUrl('ManagerDashboard')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Button variant="ghost" className="w-full justify-start">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link 
                to={createPageUrl('EmployeeDashboard')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Button variant="ghost" className="w-full justify-start">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            )}
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-600"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  );
}
