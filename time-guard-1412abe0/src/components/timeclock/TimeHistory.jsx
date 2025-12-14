import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { formatDuration, formatTime, formatDate } from './GeofenceUtils';

export default function TimeHistory({ entries, sites, itemsPerPage = 10 }) {
  const [currentPage, setCurrentPage] = useState(0);

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.clock_in_time) - new Date(a.clock_in_time)
  );

  const totalPages = Math.ceil(sortedEntries.length / itemsPerPage);
  const paginatedEntries = sortedEntries.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const getSiteName = (siteId) => {
    const site = sites.find(s => s.id === siteId);
    return site?.name || 'Unknown Site';
  };

  const getStatusBadge = (entry) => {
    if (entry.status === 'active') {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
          Active
        </Badge>
      );
    }
    if (entry.status === 'completed') {
      return <Badge variant="secondary">Completed</Badge>;
    }
    return <Badge variant="destructive">Invalid</Badge>;
  };

  if (entries.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-slate-600" />
            Time History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-500">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No time entries yet</p>
            <p className="text-sm mt-1">Your clock in/out history will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-slate-600" />
          Time History
        </CardTitle>
        <span className="text-sm text-slate-500">
          {entries.length} entries
        </span>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Clock In</TableHead>
                <TableHead>Clock Out</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEntries.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">
                    {formatDate(entry.clock_in_time)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {getSiteName(entry.site_id)}
                    </div>
                  </TableCell>
                  <TableCell>{formatTime(entry.clock_in_time)}</TableCell>
                  <TableCell>{formatTime(entry.clock_out_time)}</TableCell>
                  <TableCell className="font-semibold">
                    {formatDuration(entry.clock_in_time, entry.clock_out_time)}
                  </TableCell>
                  <TableCell>{getStatusBadge(entry)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <span className="text-sm text-slate-500">
              Page {currentPage + 1} of {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}