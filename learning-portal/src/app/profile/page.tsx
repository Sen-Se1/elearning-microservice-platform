'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/shared/Navbar';
import { useAuth } from '@/components/shared/AuthProvider';
import { userApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  User, Mail, Phone, MapPin, Lock, Loader2,
  Shield, Edit3, CheckCircle2, Camera
} from 'lucide-react';

const profileSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  password: z.string().min(8, 'At least 8 characters'),
  passwordConfirm: z.string().min(8),
}).refine(d => d.password === d.passwordConfirm, {
  message: "Passwords don't match", path: ['passwordConfirm'],
});

const emailUpdateSchema = z.object({
  newEmail: z.string().email('Invalid email'),
  currentPassword: z.string().min(1, 'Password is required'),
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;
type EmailUpdateForm = z.infer<typeof emailUpdateSchema>;

type Tab = 'profile' | 'security' | 'email';

export default function ProfilePage() {
  const { user, logout, login, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [profileData, setProfileData] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);

  const profileForm = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });
  const emailForm = useForm<EmailUpdateForm>({ resolver: zodResolver(emailUpdateSchema) });

  useEffect(() => {
    if (!loading && !user) { 
      router.push('/login'); 
      return; 
    }
    
    if (user) {
      const fetchProfile = async () => {
        try {
          const res = await userApi.get('/me');
          const d = res.data.data || res.data;
          setProfileData(d);
          profileForm.reset({
            firstName: d.profile?.firstName || d.firstName || '',
            lastName: d.profile?.lastName || d.lastName || '',
            phone: d.profile?.phone || d.phone || '',
            dateOfBirth: d.profile?.dateOfBirth?.split('T')[0] || d.dateOfBirth?.split('T')[0] || '',
            street: d.address?.street || d.street || '',
            city: d.address?.city || d.city || '',
            state: d.address?.state || d.state || '',
            country: d.address?.country || d.country || '',
            zipCode: d.address?.zipCode || d.zipCode || '',
          });
        } catch {
          toast.error('Failed to load profile');
        } finally {
          setLoadingProfile(false);
        }
      };
      fetchProfile();
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <User className="w-8 h-8 text-indigo-500 absolute inset-0 m-auto" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const onSaveProfile = async (data: ProfileForm) => {
    setSaving(true);
    try {
      await userApi.put('/update-me', data);
      toast.success('Profile updated successfully!');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async (data: PasswordForm) => {
    setSaving(true);
    try {
      const response = await userApi.put('/update-my-password', data);
      const { token, data: userData } = response.data;
      
      // Update token and state without redirecting or showing the default login toast
      login(token, userData, { 
        redirect: null, 
        message: 'Password updated successfully and session refreshed!' 
      });
      
      passwordForm.reset();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Password change failed');
    } finally {
      setSaving(false);
    }
  };

  const onRequestEmailUpdate = async (data: EmailUpdateForm) => {
    setSaving(true);
    try {
      await userApi.post('/request-email-update', data);
      toast.success('Verification link sent to your new email!');
      emailForm.reset();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Email update request failed');
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Profile Info', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'email', label: 'Change Email', icon: Mail },
  ];

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="border-b border-white/5 bg-black/20 py-10">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold font-outfit mb-1">My Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and account security.</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-4 gap-10">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Avatar Card */}
            <div className="glass rounded-3xl border border-white/5 p-8 text-center mb-6">
              {loadingProfile ? (
                <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
              ) : (
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData?.email}`}
                    alt="Avatar"
                    className="w-full h-full rounded-full border-2 border-indigo-500/30"
                  />
                  <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center border-2 border-background">
                    <Camera className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              )}
              <h2 className="font-bold font-outfit text-lg">
                {profileData?.firstName} {profileData?.lastName}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">{profileData?.email}</p>
              <Badge className="mt-3 bg-indigo-600/20 text-indigo-400 border-indigo-500/20 capitalize">
                {profileData?.role || 'learner'}
              </Badge>
            </div>

            {/* Tab Navigation */}
            <nav className="glass rounded-2xl border border-white/5 p-2 space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                    activeTab === tab.id
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                      : 'text-muted-foreground hover:bg-white/5'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >

              {/* Profile Info Tab */}
              {activeTab === 'profile' && (
                <div className="glass rounded-3xl border border-white/5 p-8">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30">
                      <Edit3 className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold font-outfit">Personal Information</h2>
                      <p className="text-sm text-muted-foreground">Update your profile details</p>
                    </div>
                  </div>

                  <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">First Name</label>
                        <Input {...profileForm.register('firstName')} className="bg-white/5 border-white/10 h-11" />
                        {profileForm.formState.errors.firstName && (
                          <p className="text-xs text-destructive">{profileForm.formState.errors.firstName.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Last Name</label>
                        <Input {...profileForm.register('lastName')} className="bg-white/5 border-white/10 h-11" />
                        {profileForm.formState.errors.lastName && (
                          <p className="text-xs text-destructive">{profileForm.formState.errors.lastName.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> Phone</label>
                        <Input {...profileForm.register('phone')} placeholder="+1234567890" className="bg-white/5 border-white/10 h-11" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Date of Birth</label>
                        <Input {...profileForm.register('dateOfBirth')} type="date" className="bg-white/5 border-white/10 h-11" />
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-6">
                      <p className="text-sm font-medium flex items-center gap-2 mb-4"><MapPin className="w-4 h-4 text-indigo-400" /> Address</p>
                      <div className="space-y-4">
                        <Input {...profileForm.register('street')} placeholder="Street address" className="bg-white/5 border-white/10 h-11" />
                        <div className="grid md:grid-cols-2 gap-4">
                          <Input {...profileForm.register('city')} placeholder="City" className="bg-white/5 border-white/10 h-11" />
                          <Input {...profileForm.register('state')} placeholder="State" className="bg-white/5 border-white/10 h-11" />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <Input {...profileForm.register('country')} placeholder="Country" className="bg-white/5 border-white/10 h-11" />
                          <Input {...profileForm.register('zipCode')} placeholder="ZIP Code" className="bg-white/5 border-white/10 h-11" />
                        </div>
                      </div>
                    </div>

                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 h-11 px-8" disabled={saving}>
                      {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><CheckCircle2 className="mr-2 h-4 w-4" /> Save Changes</>}
                    </Button>
                  </form>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="glass rounded-3xl border border-white/5 p-8">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30">
                      <Lock className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold font-outfit">Change Password</h2>
                      <p className="text-sm text-muted-foreground">Keep your account secure</p>
                    </div>
                  </div>

                  <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Current Password</label>
                      <Input {...passwordForm.register('currentPassword')} type="password" placeholder="••••••••" className="bg-white/5 border-white/10 h-11" />
                      {passwordForm.formState.errors.currentPassword && (
                        <p className="text-xs text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">New Password</label>
                      <Input {...passwordForm.register('password')} type="password" placeholder="Min. 8 characters" className="bg-white/5 border-white/10 h-11" />
                      {passwordForm.formState.errors.password && (
                        <p className="text-xs text-destructive">{passwordForm.formState.errors.password.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Confirm New Password</label>
                      <Input {...passwordForm.register('passwordConfirm')} type="password" placeholder="••••••••" className="bg-white/5 border-white/10 h-11" />
                      {passwordForm.formState.errors.passwordConfirm && (
                        <p className="text-xs text-destructive">{passwordForm.formState.errors.passwordConfirm.message}</p>
                      )}
                    </div>

                    <div className="pt-2">
                      <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 h-11 px-8" disabled={saving}>
                        {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</> : 'Update Password'}
                      </Button>
                    </div>
                  </form>

                  <div className="mt-10 pt-8 border-t border-white/5">
                    <h3 className="font-bold text-red-400 mb-2">Danger Zone</h3>
                    <p className="text-sm text-muted-foreground mb-4">Once you log out, you'll need your credentials to sign back in.</p>
                    <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={logout}>
                      Sign Out of Account
                    </Button>
                  </div>
                </div>
              )}

              {/* Email Update Tab */}
              {activeTab === 'email' && (
                <div className="glass rounded-3xl border border-white/5 p-8">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30">
                      <Mail className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold font-outfit">Change Email Address</h2>
                      <p className="text-sm text-muted-foreground">A verification link will be sent to your new email</p>
                    </div>
                  </div>

                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 mb-6 text-sm">
                    <p className="text-indigo-300"><span className="font-bold">Current email:</span> {profileData?.email}</p>
                  </div>

                  <form onSubmit={emailForm.handleSubmit(onRequestEmailUpdate)} className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">New Email Address</label>
                      <Input {...emailForm.register('newEmail')} type="email" placeholder="newemail@example.com" className="bg-white/5 border-white/10 h-11" />
                      {emailForm.formState.errors.newEmail && (
                        <p className="text-xs text-destructive">{emailForm.formState.errors.newEmail.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Current Password (to confirm)</label>
                      <Input {...emailForm.register('currentPassword')} type="password" placeholder="••••••••" className="bg-white/5 border-white/10 h-11" />
                      {emailForm.formState.errors.currentPassword && (
                        <p className="text-xs text-destructive">{emailForm.formState.errors.currentPassword.message}</p>
                      )}
                    </div>
                    <div className="pt-2">
                      <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 h-11 px-8" disabled={saving}>
                        {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : 'Request Email Change'}
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}
