import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, UserPlus, Trash2, Shield, Loader2, Search, Edit, Settings, Copy, Mail } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import EmployeeEditDialog from './EmployeeEditDialog';
import EmployeeScheduleSettings from './EmployeeScheduleSettings';
import EmployeeAssignmentDetail from './EmployeeAssignmentDetail';

export default function UserManagement({ profiles, onRefresh, sites = [], assignments = [] }) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [scheduleEmployee, setScheduleEmployee] = useState(null);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [copyingLink, setCopyingLink] = useState({});
  const [resendingEmail, setResendingEmail] = useState({});
  const [newUser, setNewUser] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    mailing_address: '',
    role: 'employee'
  });

  const filteredProfiles = profiles.filter(p => 
    p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInviteUser = async () => {
    if (!newUser.email || !newUser.first_name || !newUser.last_name) {
      toast.error('Email, first name, and last name are required');
      return;
    }

    setIsInviting(true);
    try {
      // Generate invitation token
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create invitation
      await base44.entities.Invitation.create({
        email: newUser.email,
        role: newUser.role,
        token: token,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      });

      // Don't create profile yet - let them self-enroll with their details

      // Generate invite URL
      const inviteUrl = `${window.location.origin}/EnrollUser?token=${token}&email=${encodeURIComponent(newUser.email)}`;
      
      // Create email draft
      const subject = 'Time Clock App - Complete Your Registration';
      const body = `Hi ${newUser.first_name},

You've been invited to join Time Clock App as ${newUser.role}.

Complete your registration here:
${inviteUrl}

This link expires in 7 days.

Welcome to the team!`;
      
      const mailtoLink = `mailto:${newUser.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoLink;
      
      toast.success('Email draft created - send it to complete the invitation');

      setIsAddOpen(false);
      setNewUser({ email: '', first_name: '', last_name: '', phone_number: '', mailing_address: '', role: 'employee' });
      onRefresh?.();
    } catch (err) {
      console.error('Invite user error:', err);
      toast.error('Failed to invite user: ' + err.message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleCopySetupLink = async (profile) => {
    setCopyingLink(prev => ({ ...prev, [profile.id]: true }));
    
    try {
      const existingInvites = await base44.entities.Invitation.filter({
        email: profile.email,
        status: 'pending'
      });

      let token;
      if (existingInvites.length > 0) {
        token = existingInvites[0].token;
      } else {
        token = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await base44.entities.Invitation.create({
          email: profile.email,
          role: profile.role,
          token: token,
          expires_at: expiresAt.toISOString(),
          status: 'pending'
        });
      }

      const inviteUrl = `${window.location.origin}/EnrollUser?token=${token}&email=${encodeURIComponent(profile.email)}`;
      
      try {
        await navigator.clipboard.writeText(inviteUrl);
        toast.success('Setup link copied to clipboard!');
      } catch (clipErr) {
        // Clipboard API failed, show URL in prompt
        prompt('Copy this setup link:', inviteUrl);
        toast.info('Please copy the link from the dialog');
      }
    } catch (err) {
      console.error('Copy link error:', err);
      toast.error('Failed: ' + err.message);
    } finally {
      setCopyingLink(prev => ({ ...prev, [profile.id]: false }));
    }
  };

  const handleResendInvite = async (profile) => {
    setResendingEmail(prev => ({ ...prev, [profile.id]: true }));
    
    try {
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await base44.entities.Invitation.create({
        email: profile.email,
        role: profile.role,
        token: token,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      });

      const inviteUrl = `${window.location.origin}/EnrollUser?token=${token}&email=${encodeURIComponent(profile.email)}`;

      try {
        await base44.integrations.Core.SendEmail({
          to: profile.email,
          subject: 'Time Clock App - Complete Your Registration',
          body: `Hi ${profile.full_name || profile.email},

This is a reminder to complete your Time Clock App registration.

Complete your registration here:
${inviteUrl}

This link expires in 7 days.`
        });
        
        toast.success(`Email sent to ${profile.email}!`);
      } catch (emailErr) {
        prompt('Email delivery failed. Share this setup link manually:', inviteUrl);
        toast.warning('Email blocked - please share the link manually');
      }
    } catch (err) {
      console.error('Resend error:', err);
      toast.error('Failed: ' + err.message);
    } finally {
      setResendingEmail(prev => ({ ...prev, [profile.id]: false }));
    }
  };

  const handleDeleteUser = async (profile) => {
    try {
      await base44.entities.Profile.delete(profile.id);
      toast.success('User deleted successfully');
      onRefresh?.();
    } catch (err) {
      toast.error('Failed to delete user: ' + err.message);
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-slate-600" />
          User Management
        </CardTitle>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={newUser.email}
                  onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={newUser.first_name}
                    onChange={e => setNewUser(prev => ({ ...prev, first_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={newUser.last_name}
                    onChange={e => setNewUser(prev => ({ ...prev, last_name: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={newUser.phone_number}
                  onChange={e => setNewUser(prev => ({ ...prev, phone_number: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Home Address</Label>
                <Input
                  id="address"
                  placeholder="123 Main St, City, State 12345"
                  value={newUser.mailing_address}
                  onChange={e => setNewUser(prev => ({ ...prev, mailing_address: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select 
                  value={newUser.role}
                  onValueChange={value => setNewUser(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleInviteUser} disabled={isInviting}>
                {isInviting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Inviting...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invitation
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
            placeholder="Search users..."
            className="pl-10"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfiles.map(profile => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">
                    <button
                      onClick={() => setViewingEmployee(profile)}
                      className="hover:text-blue-600 hover:underline underline-offset-4 text-left"
                    >
                      {profile.full_name || '-'}
                    </button>
                  </TableCell>
                  <TableCell>{profile.email}</TableCell>
                  <TableCell>
                    <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
                      {profile.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                      {profile.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {profile.has_password ? (
                      <Badge className="bg-green-100 text-green-700">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-300">
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {!profile.has_password && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopySetupLink(profile)}
                            title="Copy setup link"
                            disabled={copyingLink[profile.id]}
                          >
                            {copyingLink[profile.id] ? (
                              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                            ) : (
                              <Copy className="h-4 w-4 text-blue-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleResendInvite(profile)}
                            title="Send invitation email"
                            disabled={resendingEmail[profile.id]}
                          >
                            {resendingEmail[profile.id] ? (
                              <Loader2 className="h-4 w-4 animate-spin text-green-500" />
                            ) : (
                              <Mail className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingEmployee(profile)}
                      >
                        <Edit className="h-4 w-4 text-slate-500" />
                      </Button>
                      {profile.role === 'employee' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setScheduleEmployee(profile)}
                        >
                          <Settings className="h-4 w-4 text-slate-500" />
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete User</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {profile.full_name || profile.email}? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => handleDeleteUser(profile)}
                          >
                            Delete
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

        {filteredProfiles.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            {searchTerm ? 'No users found matching your search' : 'No users yet'}
          </div>
        )}
      </CardContent>

      {editingEmployee && (
        <EmployeeEditDialog
          employee={editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onSave={onRefresh}
        />
      )}

      {scheduleEmployee && (
        <EmployeeScheduleSettings
          employee={scheduleEmployee}
          onClose={() => setScheduleEmployee(null)}
          onSave={onRefresh}
        />
      )}

      {viewingEmployee && (
        <EmployeeAssignmentDetail
          employee={viewingEmployee}
          assignments={assignments.filter(a => a.employee_id === viewingEmployee.id)}
          sites={sites}
          onClose={() => setViewingEmployee(null)}
          onRefresh={onRefresh}
        />
      )}
    </Card>
  );
}