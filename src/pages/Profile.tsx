
import { useState, useEffect, useRef } from 'react';
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
import { Upload, Building, FileCheck, Settings, UserCog, File, Edit, ArrowLeft, Camera, Share2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const Profile = () => {
  const { user, userProfile, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (userProfile) {
      setFirstName(userProfile.first_name || '');
      setLastName(userProfile.last_name || '');
      setAvatarUrl(userProfile.avatar_url);
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

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should not exceed 2MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG and GIF images are allowed');
      return;
    }

    setUploading(true);
    
    try {
      // Delete old avatar if exists
      if (avatarUrl) {
        const oldAvatarPath = avatarUrl.split('/').pop();
        if (oldAvatarPath) {
          await supabase.storage
            .from('profile_images')
            .remove([`${user.id}/${oldAvatarPath}`]);
        }
      }

      // Upload new avatar
      const fileName = `avatar_${Date.now()}.${file.name.split('.').pop()}`;
      const filePath = `${user.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profile_images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('profile_images')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrlData.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrlData.publicUrl);
      toast.success('Avatar updated successfully');
    } catch (error: any) {
      console.error('Error updating avatar:', error);
      toast.error(`Failed to update avatar: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-primary/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-2xl font-semibold mb-4">Authentication Required</h2>
        <p className="text-muted-foreground mb-4">Please sign in to view your profile</p>
        <Button onClick={() => navigate('/auth')} variant="gradient">Sign In</Button>
      </div>
    );
  }

  const profileInitials = firstName && lastName 
    ? `${firstName[0]}${lastName[0]}` 
    : user.email?.substring(0, 2).toUpperCase() || 'U';

  return (
    <div className="container mx-auto py-6 space-y-8 max-w-6xl">{/* ... keep existing code */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full" 
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
              <p className="text-muted-foreground">
                Manage your account settings and documents
              </p>
            </div>
          </div>
          <Badge variant={
            userProfile.role === 'admin' ? 'default' : 
            userProfile.role === 'brand' ? 'secondary' : 
            userProfile.role === 'influencer' ? 'outline' : 'default'
          } className="py-1 px-3 text-sm">
            {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}
          </Badge>
        </div>
        
        <Tabs 
          defaultValue="general" 
          className="space-y-6" 
          value={activeTab} 
          onValueChange={setActiveTab}
        >
          <div className="bg-card rounded-lg shadow-sm p-1">
            <TabsList className="grid grid-cols-1 md:grid-cols-5 gap-2 p-1">
              <TabsTrigger value="general" className="flex gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Settings className="h-4 w-4" /> General
              </TabsTrigger>
              <TabsTrigger value="social" className="flex gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Share2 className="h-4 w-4" /> Social Media
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Upload className="h-4 w-4" /> Documents
              </TabsTrigger>
              <TabsTrigger value="contracts" className="flex gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <FileCheck className="h-4 w-4" /> Contracts
              </TabsTrigger>
              {userProfile.role === 'admin' && (
                <TabsTrigger value="admin" className="flex gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <UserCog className="h-4 w-4" /> Admin Controls
                </TabsTrigger>
              )}
            </TabsList>
          </div>
          
          <TabsContent value="general" className="space-y-4 animate-fadeIn">
            <Card className="overflow-hidden border-0 shadow-md bg-card">
              <div className="relative h-32 bg-gradient-to-r from-primary/30 to-accent/30">
                {isEditing && (
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="absolute right-4 top-4"
                  >
                    Change Cover
                  </Button>
                )}
              </div>
              <CardHeader className="-mt-12 pt-0">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex flex-col items-center space-y-2 ml-4">
                    <Avatar className="h-24 w-24 border-4 border-card relative group shadow-md">
                      <AvatarImage src={avatarUrl || ''} alt={`${firstName} ${lastName}`} />
                      <AvatarFallback className="text-lg bg-primary/10 text-primary">{profileInitials}</AvatarFallback>
                      
                      {isEditing && (
                        <div 
                          className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Camera className="h-8 w-8 text-white" />
                        </div>
                      )}
                    </Avatar>
                    {isEditing && (
                      <>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleAvatarChange}
                          accept="image/*"
                          className="hidden"
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="mt-2"
                        >
                          {uploading ? 'Uploading...' : 'Change Avatar'}
                        </Button>
                      </>
                    )}
                  </div>
                  
                  <div className="flex-1 pt-4">
                    <CardTitle className="text-2xl mb-1">{firstName} {lastName}</CardTitle>
                    <CardDescription className="text-base">
                      {user.email}
                    </CardDescription>
                  </div>
                  
                  {!isEditing && (
                    <Button 
                      onClick={() => setIsEditing(true)} 
                      variant="outline"
                      size="sm"
                      className="absolute right-6 top-6 flex gap-1"
                    >
                      <Edit className="h-4 w-4" /> Edit Profile
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                      <Input 
                        id="email" 
                        value={user.email || ''} 
                        disabled 
                        className="mt-1.5 bg-muted/30"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Email cannot be changed
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="role" className="text-sm font-medium">Account Role</Label>
                      <Input 
                        id="role" 
                        value={userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)} 
                        disabled 
                        className="mt-1.5 bg-muted/30"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Contact admin to change role
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                      <Input 
                        id="firstName" 
                        value={firstName} 
                        onChange={(e) => setFirstName(e.target.value)}
                        disabled={!isEditing}
                        className={`mt-1.5 ${!isEditing && 'bg-muted/30'}`}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                      <Input 
                        id="lastName" 
                        value={lastName} 
                        onChange={(e) => setLastName(e.target.value)}
                        disabled={!isEditing}
                        className={`mt-1.5 ${!isEditing && 'bg-muted/30'}`}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              {isEditing && (
                <CardFooter className="flex justify-between border-t bg-muted/10 py-4">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button onClick={handleSaveProfile} disabled={saving} variant="gradient">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
          
          <TabsContent value="social" className="space-y-4 animate-fadeIn">
            <div className="text-center py-4 text-muted-foreground">
              Social media integration moved to Modash workflow
            </div>
          </TabsContent>
          
          <TabsContent value="documents" className="space-y-4 animate-fadeIn">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <File className="h-5 w-5 text-primary" />
                  KYC Documents
                </CardTitle>
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
          
          <TabsContent value="contracts" className="space-y-4 animate-fadeIn">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FileCheck className="h-5 w-5 text-primary" />
                  Contract Management
                </CardTitle>
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
            <TabsContent value="admin" className="space-y-4 animate-fadeIn">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <UserCog className="h-5 w-5 text-primary" />
                    Admin Controls
                  </CardTitle>
                  <CardDescription>
                    Manage users and system settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      variant="outline"
                      className="h-24 flex flex-col items-center justify-center hover:bg-primary/5 transition-colors"
                      onClick={() => navigate('/users')}
                    >
                      <UserCog className="h-6 w-6 mb-2 text-primary" />
                      <span className="font-medium">Manage Users</span>
                    </Button>
                    <Button 
                      variant="outline"
                      className="h-24 flex flex-col items-center justify-center hover:bg-primary/5 transition-colors"
                      onClick={() => navigate('/invite')}
                    >
                      <Upload className="h-6 w-6 mb-2 text-primary" />
                      <span className="font-medium">Invite New Brand</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
      </Tabs>
    </div>
  );
};

export default Profile;
