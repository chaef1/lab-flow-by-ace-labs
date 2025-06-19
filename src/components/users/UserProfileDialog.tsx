
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, Mail, User, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'creator' | 'brand' | 'agency' | 'influencer';
  created_at: string;
  updated_at: string;
}

interface UserProfileDialogProps {
  user: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MODULE_LABELS = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  content: 'Content',
  influencers: 'Influencers',
  reporting: 'Reporting',
  advertising: 'Advertising',
  wallet: 'Wallet',
  user_management: 'User Management',
  campaigns: 'Campaigns',
  submit_content: 'Submit Content'
};

const UserProfileDialog = ({ user, open, onOpenChange }: UserProfileDialogProps) => {
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  useEffect(() => {
    if (open && user.id) {
      fetchUserPermissions();
    }
  }, [open, user.id]);

  const fetchUserPermissions = async () => {
    setLoadingPermissions(true);
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('module')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching permissions:', error);
        return;
      }

      const modules = data.map(p => p.module);
      setUserPermissions(modules);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setLoadingPermissions(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'creator':
        return 'secondary';
      case 'brand':
        return 'outline';
      case 'agency':
        return 'destructive';
      case 'influencer':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Profile
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              {user.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt="Avatar" 
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <span className="text-lg font-medium">
                  {user.first_name?.[0]}{user.last_name?.[0]}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                {user.first_name} {user.last_name}
              </h3>
              <Badge variant={getRoleBadgeVariant(user.role)}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>User ID: {user.id.substring(0, 8)}...</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Created: {new Date(user.created_at).toLocaleDateString()}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Last Updated: {new Date(user.updated_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Module Permissions</span>
            </div>
            
            {loadingPermissions ? (
              <div className="text-sm text-muted-foreground">Loading permissions...</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {userPermissions.length > 0 ? (
                  userPermissions.map((permission) => (
                    <Badge key={permission} variant="outline" className="text-xs">
                      {MODULE_LABELS[permission as keyof typeof MODULE_LABELS] || permission}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No permissions assigned</span>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileDialog;
