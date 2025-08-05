import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useInviteUser } from "@/hooks/useUsers";

export const InviteUserDialog = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("");
  
  const inviteUserMutation = useInviteUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !role) {
      return;
    }

    await inviteUserMutation.mutateAsync({
      email,
      role,
      firstName,
      lastName
    });

    // Reset form
    setEmail("");
    setFirstName("");
    setLastName("");
    setRole("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Invite User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select value={role} onValueChange={setRole} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="brand">Brand</SelectItem>
                <SelectItem value="creator">Creator</SelectItem>
                <SelectItem value="agency">Agency</SelectItem>
                <SelectItem value="influencer">Influencer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={inviteUserMutation.isPending}>
              {inviteUserMutation.isPending ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};