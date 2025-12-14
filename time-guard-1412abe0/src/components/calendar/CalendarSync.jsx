import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function CalendarSync({ profile }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    
    try {
      const response = await base44.functions.invoke('syncToCalendar');
      
      if (response.data.needsAuth) {
        toast.error('Please connect your Google Calendar first');
        setSyncResult({ error: 'Not connected' });
      } else if (response.data.success) {
        toast.success(response.data.message);
        setSyncResult(response.data);
      } else {
        toast.error(response.data.error || 'Sync failed');
        setSyncResult({ error: response.data.error });
      }
    } catch (err) {
      toast.error('Failed to sync calendar: ' + err.message);
      setSyncResult({ error: err.message });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnect = () => {
    const connectUrl = base44.connectors?.getConnectURL?.('googlecalendar');
    if (connectUrl) {
      window.open(connectUrl, '_blank');
    } else {
      toast.error('Calendar connection not available');
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          Calendar Sync
        </CardTitle>
        <p className="text-sm text-slate-600 mt-2">
          Sync your work assignments to Google Calendar
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {syncResult && (
          <div className={`p-3 rounded-lg border ${
            syncResult.error 
              ? 'bg-red-50 border-red-200' 
              : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-start gap-2">
              {syncResult.error ? (
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              )}
              <div className="flex-1">
                {syncResult.error ? (
                  <p className="text-sm text-red-800">{syncResult.error}</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-green-800">
                      {syncResult.message}
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Created: {syncResult.created} | Skipped: {syncResult.skipped}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Button 
            onClick={handleSync}
            disabled={isSyncing}
            className="w-full"
          >
            {isSyncing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                Sync to Google Calendar
              </>
            )}
          </Button>

          <p className="text-xs text-slate-500 text-center">
            First sync? You may need to{' '}
            <button 
              onClick={handleConnect}
              className="text-blue-600 hover:underline"
            >
              connect Google Calendar
            </button>
          </p>
        </div>

        <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-800">
          <strong>Note:</strong> This will create calendar events for all your current site assignments.
          {profile?.role === 'admin' || profile?.role === 'manager' 
            ? ' Great for tracking appointments and on-site visits.' 
            : ' Events will show your work schedule.'}
        </div>
      </CardContent>
    </Card>
  );
}