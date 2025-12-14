import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { UserCheck, UserX, Eye, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function PendingEnrollments({ profiles, onRefresh }) {
  const [viewingProfile, setViewingProfile] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const pendingProfiles = profiles.filter(p => p.registration_status === 'pending');

  const handleApprove = async (profile) => {
    setProcessingId(profile.id);
    try {
      // Get the invitation with password
      const invitations = await base44.entities.Invitation.filter({
        email: profile.email,
        status: 'accepted'
      });

      if (invitations.length === 0 || !invitations[0].temporary_password) {
        toast.error('Password not found. User must re-enroll.');
        setProcessingId(null);
        return;
      }

      const invitation = invitations[0];

      // Approve via backend function
      const response = await base44.functions.invoke('approveEnrollment', {
        profile_id: profile.id,
        password: invitation.temporary_password
      });

      if (response.data.error) {
        toast.error(response.data.error);
        setProcessingId(null);
        return;
      }

      // Clear temporary password
      await base44.entities.Invitation.update(invitation.id, {
        temporary_password: ''
      });
      
      toast.success(`${profile.full_name || profile.email} has been approved!`);
      onRefresh?.();
    } catch (err) {
      toast.error('Failed to approve: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (profile) => {
    setProcessingId(profile.id);
    try {
      await base44.entities.Profile.update(profile.id, {
        registration_status: 'rejected'
      });
      
      toast.success(`${profile.full_name || profile.email} has been rejected`);
      onRefresh?.();
    } catch (err) {
      toast.error('Failed to reject: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <>
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            Pending Enrollments
            {pendingProfiles.length > 0 && (
              <Badge className="bg-amber-100 text-amber-700">
                {pendingProfiles.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {pendingProfiles.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Clock className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No pending enrollments</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingProfiles.map(profile => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">
                        {profile.first_name && profile.last_name 
                          ? `${profile.first_name} ${profile.last_name}` 
                          : profile.full_name || '-'}
                      </TableCell>
                      <TableCell>{profile.email}</TableCell>
                      <TableCell>{profile.phone_number || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{profile.role}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewingProfile(profile)}
                          >
                            <Eye className="h-4 w-4 text-slate-500" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                disabled={processingId === profile.id}
                              >
                                {processingId === profile.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-green-500" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Approve Enrollment</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to approve {profile.full_name || profile.email}? 
                                  They will be able to log in immediately.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleApprove(profile)}
                                >
                                  Approve
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                disabled={processingId === profile.id}
                              >
                                {processingId === profile.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Reject Enrollment</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to reject {profile.full_name || profile.email}? 
                                  They will not be able to access the system.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => handleReject(profile)}
                                >
                                  Reject
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
          )}
        </CardContent>
      </Card>

      {viewingProfile && (
        <Dialog open={!!viewingProfile} onOpenChange={() => setViewingProfile(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Enrollment Details</DialogTitle>
              <DialogDescription>Review applicant information</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm text-slate-500">Name</p>
                <p className="font-medium">
                  {viewingProfile.first_name && viewingProfile.last_name
                    ? `${viewingProfile.first_name} ${viewingProfile.last_name}`
                    : viewingProfile.full_name || '-'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-slate-500">Email</p>
                <p className="font-medium">{viewingProfile.email}</p>
              </div>
              
              <div>
                <p className="text-sm text-slate-500">Phone Number</p>
                <p className="font-medium">{viewingProfile.phone_number || 'Not provided'}</p>
              </div>
              
              <div>
                <p className="text-sm text-slate-500">Home Address</p>
                <p className="font-medium">{viewingProfile.mailing_address || 'Not provided'}</p>
              </div>
              
              <div>
                <p className="text-sm text-slate-500">Role</p>
                <Badge variant="secondary">{viewingProfile.role}</Badge>
              </div>
              
              <div>
                <p className="text-sm text-slate-500">Submitted</p>
                <p className="text-sm">{new Date(viewingProfile.created_date).toLocaleString()}</p>
              </div>
            </div>
            
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => {
                  handleReject(viewingProfile);
                  setViewingProfile(null);
                }}
                disabled={processingId === viewingProfile.id}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  handleApprove(viewingProfile);
                  setViewingProfile(null);
                }}
                disabled={processingId === viewingProfile.id}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}