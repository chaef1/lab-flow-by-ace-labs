
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateUserDialogProps {
  onUserCreated?: () => void;
}

const AVAILABLE_MODULES = [
  { id: 'dashboard', label: 'Dashboard', description: 'Access to main dashboard' },
  { id: 'projects', label: 'Projects', description: 'Manage projects and campaigns' },
  { id: 'content', label: 'Content', description: 'Content management and approval' },
  { id: 'influencers', label: 'Influencers', description: 'Influencer search and management' },
  { id: 'reporting', label: 'Reporting', description: 'Analytics and reports' },
  { id: 'advertising', label: 'Advertising', description: 'Ad campaign management' },
  { id: 'wallet', label: 'Wallet', description: 'Financial management' },
  { id: 'user_management', label: 'User Management', description: 'Manage users and permissions' },
  { id: 'campaigns', label: 'Campaigns', description: 'Campaign participation' },
  { id: 'submit_content', label: 'Submit Content', description: 'Content submission' }
];

const DEFAULT_PERMISSIONS = {
  admin: ['dashboard', 'projects', 'content', 'influencers', 'reporting', 'advertising', 'wallet', 'user_management'],
  brand: ['dashboard', 'projects', 'content', 'influencers', 'reporting', 'advertising', 'wallet'],
  creator: ['dashboard', 'projects', 'content', 'wallet'],
  agency: ['dashboard', 'projects', 'content', 'influencers', 'reporting', 'advertising', 'wallet'],
  influencer: ['dashboard', 'campaigns', 'submit_content', 'wallet']
};

const CreateUserDialog = ({ onUserCreated }: CreateUserDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'brand' as 'admin' | 'creator' | 'brand' | 'agency' | 'influencer'
  });
  const [selectedModules, setSelectedModules] = useState<string[]>(['dashboard']);

  const handleRoleChange = (role: string) => {
    const newRole = role as 'admin' | 'creator' | 'brand' | 'agency' | 'influencer';
    setFormData(prev => ({ ...prev, role: newRole }));
    // Update selected modules based on role defaults
    setSelectedModules(DEFAULT_PERMISSIONS[newRole]);
  };

  const handleModuleToggle = (moduleId: string, checked: boolean) => {
    setSelectedModules(prev => {
      if (checked) {
        return [...prev, moduleId];
      } else {
        // Don't allow unchecking dashboard as it's required
        if (moduleId === 'dashboard') {
          toast.error('Dashboard access is required for all users');
          return prev;
        }
        return prev.filter(id => id !== moduleId);
      }
    });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Creating user with data:', { 
        email: formData.email, 
        role: formData.role, 
        modules: selectedModules 
      });

      // First check if the database is ready by testing a simple query
      try {
        const { data: testQuery } = await supabase.from('profiles').select('id').limit(1);
        console.log('Database connection test:', testQuery ? 'success' : 'no data');
      } catch (dbError) {
        console.error('Database connection test failed:', dbError);
        toast.error('Database connection issue. Please try again.');
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: formData.role
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        toast.error(`Authentication error: ${authError.message}`);
        throw authError;
      }

      console.log('User signup response:', authData);

      if (!authData.user?.id) {
        console.error('No user ID returned from signup');
        toast.error('User creation failed - no user ID returned');
        return;
      }

      console.log('User created successfully:', authData.user.id);

      // Wait a moment for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if profile was created by the trigger
      const { data: profileCheck, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', authData.user.id)
        .single();

      if (profileCheckError) {
        console.error('Profile check error:', profileCheckError);
        // Profile wasn't created by trigger, let's create it manually
        console.log('Creating profile manually...');
        
        const { error: manualProfileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: formData.role
          });

        if (manualProfileError) {
          console.error('Manual profile creation error:', manualProfileError);
          toast.error(`Profile creation failed: ${manualProfileError.message}`);
          return;
        }
      } else {
        console.log('Profile exists:', profileCheck);
      }

      // Set up custom permissions if needed
      if (selectedModules.length > 0) {
        // Get current user ID first
        const { data: currentUser } = await supabase.auth.getUser();
        const currentUserId = currentUser.user?.id;

        // Delete existing permissions for this user (in case of role change)
        const { error: deleteError } = await supabase
          .from('user_permissions')
          .delete()
          .eq('user_id', authData.user.id);

        if (deleteError) {
          console.error('Delete permissions error:', deleteError);
        }

        // Add selected permissions with proper typing
        const permissionsToInsert = selectedModules.map(module => ({
          user_id: authData.user.id,
          module: module as any, // Type assertion for the enum
          granted_by: currentUserId
        }));

        console.log('Inserting permissions:', permissionsToInsert);

        const { error: permissionsError } = await supabase
          .from('user_permissions')
          .insert(permissionsToInsert);

        if (permissionsError) {
          console.error('Permissions error:', permissionsError);
          toast.error(`User created but failed to set permissions: ${permissionsError.message}`);
        } else {
          console.log('Permissions set successfully');
        }
      }

      toast.success('User created successfully!');
      setOpen(false);
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'brand'
      });
      setSelectedModules(['dashboard']);
      onUserCreated?.();
    } catch (error: any) {
      console.error('Create user error:', error);
      toast.error(`Failed to create user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add New User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              required
              minLength={6}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="creator">Creator</SelectItem>
                <SelectItem value="brand">Brand</SelectItem>
                <SelectItem value="agency">Agency</SelectItem>
                <SelectItem value="influencer">Influencer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Module Permissions</Label>
            <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto border rounded-md p-3">
              {AVAILABLE_MODULES.map((module) => (
                <div key={module.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={module.id}
                    checked={selectedModules.includes(module.id)}
                    onCheckedChange={(checked) => handleModuleToggle(module.id, checked as boolean)}
                    disabled={module.id === 'dashboard'} // Dashboard is always required
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor={module.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {module.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {module.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create User'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;
