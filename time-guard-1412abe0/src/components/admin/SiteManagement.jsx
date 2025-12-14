import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Building2, Plus, Trash2, MapPin, Loader2, Navigation, Search, Edit, Clock, Eye } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import SiteEditDialog from './SiteEditDialog';
import SiteAssignmentsView from './SiteAssignmentsView';
import EmployeeAssignmentDetail from './EmployeeAssignmentDetail';

export default function SiteManagement({ sites, onRefresh, profiles = [], assignments = [] }) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSite, setEditingSite] = useState(null);
  const [viewingSite, setViewingSite] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [deletingState, setDeletingState] = useState({});
  const [newSite, setNewSite] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    geofence_radius: 100,
    allowed_hours_start: '09:00',
    allowed_hours_end: '17:00'
  });

  const filteredSites = sites.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGeocode = async () => {
    if (!newSite.address) {
      toast.error('Please enter an address first');
      return;
    }

    setIsGeocoding(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a geocoding assistant. Find the exact latitude and longitude coordinates for this address: "${newSite.address}". 

Search for this address and return the precise geographic coordinates. If multiple locations match, choose the most likely one based on the address details provided.

Return ONLY a JSON object with exactly this structure:
{
  "lat": <latitude as decimal number>,
  "lon": <longitude as decimal number>
}

Do not include any explanation, just the JSON with the coordinates.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            lat: { type: 'number' },
            lon: { type: 'number' }
          },
          required: ['lat', 'lon']
        }
      });

      if (result.lat && result.lon) {
        setNewSite(prev => ({
          ...prev,
          latitude: result.lat,
          longitude: result.lon
        }));
        toast.success(`Coordinates found: ${result.lat.toFixed(6)}, ${result.lon.toFixed(6)}`);
      } else {
        toast.error('Could not find coordinates for this address');
      }
    } catch (err) {
      toast.error('Geocoding failed: ' + err.message);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleCreateSite = async () => {
    if (!newSite.name || !newSite.address) {
      toast.error('Name and address are required');
      return;
    }

    if (!newSite.allowed_hours_start || !newSite.allowed_hours_end) {
      toast.error('Allowed work hours are required');
      return;
    }

    setIsCreating(true);
    try {
      await base44.entities.Site.create({
        name: newSite.name,
        address: newSite.address,
        latitude: newSite.latitude ? parseFloat(newSite.latitude) : null,
        longitude: newSite.longitude ? parseFloat(newSite.longitude) : null,
        geofence_radius: parseInt(newSite.geofence_radius) || 100,
        allowed_hours_start: newSite.allowed_hours_start,
        allowed_hours_end: newSite.allowed_hours_end,
        is_active: true
      });

      toast.success('Site created successfully!');
      setIsAddOpen(false);
      setNewSite({
        name: '',
        address: '',
        latitude: '',
        longitude: '',
        geofence_radius: 100,
        allowed_hours_start: '09:00',
        allowed_hours_end: '17:00'
      });
      onRefresh?.();
    } catch (err) {
      toast.error('Failed to create site: ' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSite = async (site) => {
    setDeletingState(prev => ({ ...prev, [site.id]: 'checking' }));
    
    try {
      // Check for time entries
      const timeEntries = await base44.entities.TimeEntry.filter({ site_id: site.id });
      if (timeEntries.length > 0) {
        toast.error(`Cannot delete site: ${timeEntries.length} time entries exist for this site`);
        setDeletingState(prev => ({ ...prev, [site.id]: 'blocked' }));
        return false;
      }

      // Check for assignments
      const siteAssignments = await base44.entities.EmployeeSite.filter({ site_id: site.id });
      if (siteAssignments.length > 0) {
        toast.error(`Cannot delete site: ${siteAssignments.length} user assignments exist for this site`);
        setDeletingState(prev => ({ ...prev, [site.id]: 'blocked' }));
        return false;
      }

      // Check for photos
      const photos = await base44.entities.SitePhoto.filter({ site_id: site.id });
      if (photos.length > 0) {
        toast.error(`Cannot delete site: ${photos.length} photos exist for this site`);
        setDeletingState(prev => ({ ...prev, [site.id]: 'blocked' }));
        return false;
      }

      // Check for messages
      const messages = await base44.entities.SiteMessage.filter({ site_id: site.id });
      if (messages.length > 0) {
        toast.error(`Cannot delete site: ${messages.length} messages exist for this site`);
        setDeletingState(prev => ({ ...prev, [site.id]: 'blocked' }));
        return false;
      }

      setDeletingState(prev => ({ ...prev, [site.id]: 'deleting' }));
      await base44.entities.Site.delete(site.id);
      toast.success('Site deleted successfully');
      setDeletingState(prev => ({ ...prev, [site.id]: undefined }));
      onRefresh?.();
      return true;
    } catch (err) {
      toast.error('Failed to delete site: ' + err.message);
      setDeletingState(prev => ({ ...prev, [site.id]: 'error' }));
      return false;
    }
  };

  const openInMaps = (site) => {
    // Use address for more accurate navigation
    const query = encodeURIComponent(site.address);
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${query}`,
      '_blank'
    );
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-slate-600" />
          Work Sites
        </CardTitle>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Site
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Work Site</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  placeholder="Main Office"
                  value={newSite.name}
                  onChange={e => setNewSite(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  placeholder="123 Main St, City, State, ZIP"
                  value={newSite.address}
                  onChange={e => setNewSite(prev => ({ ...prev, address: e.target.value }))}
                  className="flex-1"
                />
                <p className="text-xs text-slate-500">
                  Enter complete address for accurate navigation
                </p>
              </div>
              <div className="space-y-2">
                <Label>Coordinates (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    value={newSite.latitude}
                    onChange={e => setNewSite(prev => ({ ...prev, latitude: e.target.value }))}
                  />
                  <Input
                    type="number"
                    step="any"
                    placeholder="Longitude"
                    value={newSite.longitude}
                    onChange={e => setNewSite(prev => ({ ...prev, longitude: e.target.value }))}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGeocode}
                    disabled={isGeocoding || !newSite.address}
                    title="Auto-fill coordinates"
                  >
                    {isGeocoding ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MapPin className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  For geofencing accuracy. Click map icon to auto-fill from address.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="radius">Geofence Radius (meters)</Label>
                <Input
                  id="radius"
                  type="number"
                  min="10"
                  max="1000"
                  value={newSite.geofence_radius}
                  onChange={e => setNewSite(prev => ({ ...prev, geofence_radius: e.target.value }))}
                />
                <p className="text-xs text-slate-500">
                  Employees must be within this distance to clock in/out
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workStart">Allowed Hours Start *</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="workStart"
                      type="time"
                      value={newSite.allowed_hours_start}
                      onChange={e => setNewSite(prev => ({ ...prev, allowed_hours_start: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workEnd">Allowed Hours End *</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="workEnd"
                      type="time"
                      value={newSite.allowed_hours_end}
                      onChange={e => setNewSite(prev => ({ ...prev, allowed_hours_end: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSite} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Site
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search sites..."
            className="pl-10"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Sites Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Coordinates</TableHead>
                <TableHead>Radius</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSites.map(site => (
                <TableRow key={site.id}>
                  <TableCell className="font-medium">{site.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{site.address}</TableCell>
                  <TableCell>
                    {site.latitude && site.longitude ? (
                      <Badge variant="secondary" className="font-mono text-xs">
                        {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600">
                        Not set
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{site.geofence_radius || 100}m</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewingSite(site)}
                        title="View assignments"
                      >
                        <Eye className="h-4 w-4 text-slate-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingSite(site)}
                        title="Edit site"
                      >
                        <Edit className="h-4 w-4 text-slate-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openInMaps(site)}
                        title="Open in Google Maps"
                      >
                        <Navigation className="h-4 w-4 text-blue-500" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:text-red-700"
                            title="Delete site"
                            disabled={deletingState[site.id] === 'checking' || deletingState[site.id] === 'deleting'}
                          >
                            {deletingState[site.id] === 'checking' || deletingState[site.id] === 'deleting' ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Site</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{site.name}"?
                              <br /><br />
                              <strong>Note:</strong> Sites cannot be deleted if they have time entries, assignments, photos, or messages.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={async (e) => {
                                e.preventDefault();
                                const success = await handleDeleteSite(site);
                                if (success) {
                                  const trigger = e.target.closest('[role="alertdialog"]');
                                  if (trigger) trigger.click();
                                }
                              }}
                            >
                              {deletingState[site.id] === 'deleting' ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                'Delete'
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredSites.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            {searchTerm ? 'No sites found matching your search' : 'No work sites yet'}
          </div>
        )}
      </CardContent>

      {editingSite && (
        <SiteEditDialog
          site={editingSite}
          onClose={() => setEditingSite(null)}
          onSave={onRefresh}
        />
      )}

      {viewingSite && (
        <SiteAssignmentsView
          site={viewingSite}
          assignments={assignments}
          profiles={profiles}
          onClose={() => setViewingSite(null)}
          onViewUser={(user) => {
            setViewingSite(null);
            setViewingUser(user);
          }}
          onRefresh={onRefresh}
        />
      )}

      {viewingUser && (
        <EmployeeAssignmentDetail
          employee={viewingUser}
          assignments={assignments.filter(a => a.employee_id === viewingUser.id)}
          sites={sites}
          onClose={() => setViewingUser(null)}
          onViewSite={(site) => {
            setViewingUser(null);
            setViewingSite(site);
          }}
          onRefresh={onRefresh}
        />
      )}
    </Card>
  );
}