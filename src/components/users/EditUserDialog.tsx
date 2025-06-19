
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: 'admin' | 'creator' | 'brand' | 'agency' | 'influencer';
}

interface EditUserDialogProps {
  user: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated?: () => void;
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

const EditUserDialog = ({ user, open, onOpenChange, onUserUpdated }: EditUserDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    role: user.role
  });
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  useEffect(() => {
    setFormData({
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      role: user.role
    });
    
    // Fetch current permissions for this user
    if (open && user.id) {
      fetchUserPermissions();
    }
  }, [user, open]);

  const fetchUserPermissions = async () => {
    setLoadingPermissions(true);
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('module')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching permissions:', error);
        toast.error('Failed to load user permissions');
        return;
      }

      const modules = data.map(p => p.module);
      setSelectedModules(modules);
      console.log('Loaded permissions for user:', user.id, modules);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setLoadingPermissions(false);
    }
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

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Updating user:', user.id, formData, selectedModules);

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: formData.role,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }

      // Update permissions
      // First, delete existing permissions
      const { error: deleteError } = await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Delete permissions error:', deleteError);
        throw deleteError;
      }

      // Then, insert new permissions
      if (selectedModules.length > 0) {
        // Get current user ID first
        const { data: currentUser } = await supabase.auth.getUser();
        const currentUserId = currentUser.user?.id;

        const permissionsToInsert = selectedModules.map(module => ({
          user_id: user.id,
          module: module as any, // Type assertion for the enum
          granted_by: currentUserId
        }));

        console.log('Inserting new permissions:', permissionsToInsert);

        const { error: permissionsError } = await supabase
          .from('user_permissions')
          .insert(permissionsToInsert);

        if (permissionsError) {
          console.error('Permissions insert error:', permissionsError);
          throw permissionsError;
        }
      }

      toast.success('User updated successfully!');
      onOpenChange(false);
      onUserUpdated?.();
    } catch (error: any) {
      console.error('Update user error:', error);
      toast.error(`Failed to update user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleUpdateUser} className="space-y-4">
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
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(value: any) => setFormData(prev => ({ ...prev, role: value }))}>
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
            {loadingPermissions ? (
              <div className="text-sm text-muted-foreground">Loading permissions...</div>
            ) : (
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
            )}
          </div>
          
          <Button type="submit" className="w-full" disabled={loading || loadingPermissions}>
            {loading ? 'Updating...' : 'Update User'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;
