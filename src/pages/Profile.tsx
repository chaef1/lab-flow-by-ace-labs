import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import DocumentUpload from '@/components/profile/DocumentUpload';
import ContractsList from '@/components/profile/ContractsList';
import DashboardLayout from '@/components/layout/Dashboard';
import { Upload, Building, FileCheck, Settings, UserCog } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const Profile = () => {
  const { user, userProfile, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (userProfile) {
      setFirstName(userProfile.first_name || '');
      setLastName(userProfile.last_name || '');
    }
  }, [userProfile]);

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(`Failed to update profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-agency-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user || !userProfile) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full">
          <h2 className="text-2xl font-semibold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">Please sign in to view your profile</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </DashboardLayout>
    );
  }

  const profileInitials = firstName && lastName 
    ? `${firstName[0]}${lastName[0]}` 
    : user.email?.substring(0, 2).toUpperCase() || 'U';

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
            <p className="text-muted-foreground">
              Manage your account settings and documents
            </p>
          </div>
          <Badge variant={
            userProfile.role === 'admin' ? 'default' : 
            userProfile.role === 'brand' ? 'secondary' : 
            userProfile.role === 'influencer' ? 'outline' : 'default'
          }>
            {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}
          </Badge>
        </div>
        
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <TabsTrigger value="general" className="flex gap-2">
              <Settings size={16} /> General
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex gap-2">
              <Upload size={16} /> Documents
            </TabsTrigger>
            <TabsTrigger value="contracts" className="flex gap-2">
              <FileCheck size={16} /> Contracts
            </TabsTrigger>
            {userProfile.role === 'admin' && (
              <TabsTrigger value="admin" className="flex gap-2">
                <UserCog size={16} /> Admin Controls
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Your personal information and account settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex flex-col items-center space-y-2">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={userProfile.avatar_url || ''} />
                      <AvatarFallback className="text-lg">{profileInitials}</AvatarFallback>
                    </Avatar>
                    <Button variant="outline" size="sm">
                      Change Avatar
                    </Button>
                  </div>
                  
                  <div className="flex-1 grid gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          value={user.email || ''} 
                          disabled 
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Email cannot be changed
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="role">Account Role</Label>
                        <Input 
                          id="role" 
                          value={userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)} 
                          disabled 
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Contact admin to change role
                        </p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input 
                          id="firstName" 
                          value={firstName} 
                          onChange={(e) => setFirstName(e.target.value)}
                          disabled={!isEditing}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input 
                          id="lastName" 
                          value={lastName} 
                          onChange={(e) => setLastName(e.target.value)}
                          disabled={!isEditing}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button onClick={handleSaveProfile} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
                    <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                  </>
                )}
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>KYC Documents</CardTitle>
                <CardDescription>
                  Upload your verification documents for Know Your Customer (KYC) requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <DocumentUpload 
                  userId={user.id} 
                  userRole={userProfile.role} 
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="contracts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contract Management</CardTitle>
                <CardDescription>
                  Upload, sign, and manage your contracts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContractsList userId={user.id} userRole={userProfile.role} />
              </CardContent>
            </Card>
          </TabsContent>
          
          {userProfile.role === 'admin' && (
            <TabsContent value="admin" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Admin Controls</CardTitle>
                  <CardDescription>
                    Manage users and system settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      variant="secondary"
                      className="h-24 flex flex-col items-center justify-center"
                      onClick={() => navigate('/users')}
                    >
                      <UserCog size={24} className="mb-2" />
                      <span>Manage Users</span>
                    </Button>
                    <Button 
                      variant="secondary"
                      className="h-24 flex flex-col items-center justify-center"
                      onClick={() => navigate('/invite')}
                    >
                      <Upload size={24} className="mb-2" />
                      <span>Invite New Brand</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
