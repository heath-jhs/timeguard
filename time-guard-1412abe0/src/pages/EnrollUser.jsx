import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Phone, Loader2, CheckCircle2, AlertCircle, MapPin, User } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function EnrollUser() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageState, setPageState] = useState('loading');
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

    base44.functions.invoke('validateInvitation', {
      token: token,
      email: decodeURIComponent(email)
    }).then(response => {
      const data = response.data;
      
      if (!data.valid) {
        setErrorMessage(data.error || 'Invalid invitation');
        setPageState('error');
        return;
      }

      setInviteData({
        token: token,
        email: decodeURIComponent(email),
        role: data.role
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
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (!formData.firstName || !formData.lastName) {
      toast.error('First and last name are required');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await base44.functions.invoke('submitEnrollment', {
        token: inviteData.token,
        email: inviteData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone_number: formData.phone,
        mailing_address: formData.address,
        password: formData.password,
        role: inviteData.role
      });

      if (response.data.error) {
        toast.error(response.data.error);
        setIsSubmitting(false);
        return;
      }

      toast.success('Enrollment submitted! Awaiting admin approval.');
      setPageState('success');
      
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
              onClick={() => window.location.href = createPageUrl('Home')}
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pageState === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 bg-green-50 rounded-full mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">Enrollment Submitted!</h2>
            <p className="text-slate-600 text-center mb-6">
              Your enrollment request has been sent to the administrator for approval.
              <br />
              You'll receive an email once your account is approved.
            </p>
            <p className="text-sm text-slate-500 text-center">
              You can close this page now.
            </p>
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
            <User className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Complete Your Enrollment</CardTitle>
          <CardDescription>
            Fill in your details for {inviteData?.email}
            <br />
            <span className="text-amber-600 font-medium">Pending admin approval</span>
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  className="pl-10"
                  value={formData.phone}
                  onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Home Address *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="address"
                  placeholder="123 Main St, City, State ZIP"
                  className="pl-10"
                  value={formData.address}
                  onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                minLength={8}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 text-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Submit Enrollment
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}