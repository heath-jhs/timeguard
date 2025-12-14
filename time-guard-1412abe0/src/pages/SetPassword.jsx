import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Phone, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function SetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageState, setPageState] = useState('loading'); // loading, form, error
  const [errorMessage, setErrorMessage] = useState('');
  const [inviteData, setInviteData] = useState(null);
  
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const email = params.get('email');
    
    if (!token || !email) {
      setErrorMessage('Invalid invitation link - missing token or email');
      setPageState('error');
      return;
    }

    base44.entities.Invitation.filter({ 
      token: token,
      email: decodeURIComponent(email)
    }).then(invitations => {
      if (invitations.length === 0) {
        setErrorMessage('Invalid or expired invitation link');
        setPageState('error');
        return;
      }

      const inv = invitations[0];
      
      if (inv.status === 'accepted') {
        setErrorMessage('This invitation has already been used');
        setPageState('error');
        return;
      }

      if (inv.status === 'expired' || new Date(inv.expires_at) < new Date()) {
        setErrorMessage('This invitation has expired');
        setPageState('error');
        return;
      }

      setInviteData({
        token: token,
        email: decodeURIComponent(email),
        invitation: inv
      });
      setPageState('form');
    }).catch(err => {
      console.error('Validation error:', err);
      setErrorMessage('Failed to validate invitation');
      setPageState('error');
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await base44.functions.invoke('completeRegistration', {
        token: inviteData.token,
        email: inviteData.email,
        password: password,
        phone_number: phoneNumber
      });

      if (response.data.error) {
        toast.error(response.data.error);
        setIsSubmitting(false);
        return;
      }

      toast.success('Registration complete!');
      
      setTimeout(() => {
        window.location.href = createPageUrl('Login');
      }, 1500);
      
    } catch (err) {
      toast.error('Failed: ' + err.message);
      setIsSubmitting(false);
    }
  };

  if (pageState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-4 text-slate-600">Validating invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pageState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 bg-red-50 rounded-full mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Invalid Link</h2>
            <p className="text-slate-600 text-center">{errorMessage}</p>
            <Button 
              className="mt-6"
              onClick={() => window.location.href = createPageUrl('Login')}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto p-3 bg-blue-50 rounded-full w-fit mb-4">
            <Lock className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Set Up Your Account</CardTitle>
          <CardDescription>
            Complete your registration for {inviteData?.email}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  className="pl-10"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 text-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Complete Setup
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}