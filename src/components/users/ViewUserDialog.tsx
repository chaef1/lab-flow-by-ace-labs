import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User } from "@/hooks/useUsers";

interface ViewUserDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roleBadgeColors = {
  'admin': 'bg-ace-500/10 text-ace-500',
  'brand': 'bg-blue-500/10 text-blue-500',
  'creator': 'bg-purple-500/10 text-purple-500',
  'agency': 'bg-orange-500/10 text-orange-500',
  'influencer': 'bg-pink-500/10 text-pink-500',
};

export const ViewUserDialog = ({ user, open, onOpenChange }: ViewUserDialogProps) => {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.first_name?.[0] || 'U'}${user.last_name?.[0] || 'U'}`} />
              <AvatarFallback>{user.first_name?.[0] || 'U'}{user.last_name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">
                {`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User'}
              </h3>
              <p className="text-muted-foreground">{user.email || 'No email'}</p>
              <Badge className={`${roleBadgeColors[user.role]} capitalize mt-1`}>
                {user.role}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">First Name</label>
              <p className="mt-1">{user.first_name || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Last Name</label>
              <p className="mt-1">{user.last_name || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="mt-1">{user.email || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Role</label>
              <p className="mt-1 capitalize">{user.role}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Projects</label>
              <p className="mt-1">{user.project_count || 0}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Joined</label>
              <p className="mt-1">{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};