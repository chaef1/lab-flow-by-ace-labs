
import { useState } from "react";
import Dashboard from "@/components/layout/Dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MoreHorizontal, Plus, Mail } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

// Sample users data
const usersData = [
  {
    id: "1",
    name: "Alex Smith",
    email: "alex@agency.com",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=AS",
    role: "admin",
    status: "active",
    projects: 5,
  },
  {
    id: "2",
    name: "Jamie Lee",
    email: "jamie@agency.com",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=JL",
    role: "admin",
    status: "active",
    projects: 3,
  },
  {
    id: "3",
    name: "Robin Banks",
    email: "robin@agency.com",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=RB",
    role: "creator",
    status: "active",
    projects: 2,
  },
  {
    id: "4",
    name: "Sam Jordan",
    email: "sam@agency.com",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=SJ",
    role: "creator",
    status: "inactive",
    projects: 0,
  },
  {
    id: "5",
    name: "Taylor Kim",
    email: "taylor@agency.com",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=TK",
    role: "creator",
    status: "active",
    projects: 4,
  },
  {
    id: "6",
    name: "Jordan Patel",
    email: "jordan@agency.com",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=JP",
    role: "creator",
    status: "active",
    projects: 1,
  },
  {
    id: "7",
    name: "Morgan Liu",
    email: "morgan@beachside.com",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=ML",
    role: "client",
    status: "active",
    projects: 1,
  },
  {
    id: "8",
    name: "Casey Wong",
    email: "casey@techgadgets.com",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=CW",
    role: "client",
    status: "active",
    projects: 1,
  },
  {
    id: "9",
    name: "Riley Parker",
    email: "riley@morningbrew.com",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=RP",
    role: "client",
    status: "inactive",
    projects: 1,
  },
  {
    id: "10",
    name: "Avery Johnson",
    email: "avery@hometownbakery.com",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=AJ",
    role: "client",
    status: "active",
    projects: 1,
  },
];

const roleBadgeColors = {
  'admin': 'bg-agency-100 text-agency-800',
  'creator': 'bg-purple-100 text-purple-800',
  'client': 'bg-blue-100 text-blue-800',
};

const Users = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Filter users based on search term, role, and status
  const filteredUsers = usersData.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Group users by role
  const admins = filteredUsers.filter(user => user.role === 'admin');
  const creators = filteredUsers.filter(user => user.role === 'creator');
  const clients = filteredUsers.filter(user => user.role === 'client');

  const handleInviteUser = () => {
    toast.success("Invitation sent successfully!");
  };

  const UsersTable = ({ users }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Projects</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
              No users found matching your filters.
            </TableCell>
          </TableRow>
        ) : (
          users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={user.status === 'active' ? 'default' : 'outline'} className="capitalize">
                  {user.status}
                </Badge>
              </TableCell>
              <TableCell>{user.projects}</TableCell>
              <TableCell>
                <Badge className={`${roleBadgeColors[user.role]} capitalize`}>
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Profile</DropdownMenuItem>
                    <DropdownMenuItem>Edit User</DropdownMenuItem>
                    <DropdownMenuItem>
                      <Mail className="mr-2 h-4 w-4" /> Email User
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      {user.status === 'active' ? 'Deactivate' : 'Activate'} User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <Dashboard title="User Management" subtitle="Manage agency staff, clients, and creators">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
                <SelectItem value="creator">Creators</SelectItem>
                <SelectItem value="client">Clients</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="sm:w-auto" onClick={handleInviteUser}>
            <Plus className="mr-2 h-4 w-4" /> Invite User
          </Button>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">
              All <span className="ml-1 text-xs bg-muted px-2 py-0.5 rounded-full">
                {filteredUsers.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="admins">
              Admins <span className="ml-1 text-xs bg-agency-100 text-agency-800 px-2 py-0.5 rounded-full">
                {admins.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="creators">
              Creators <span className="ml-1 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                {creators.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="clients">
              Clients <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                {clients.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <UsersTable users={filteredUsers} />
          </TabsContent>
          
          <TabsContent value="admins">
            <UsersTable users={admins} />
          </TabsContent>
          
          <TabsContent value="creators">
            <UsersTable users={creators} />
          </TabsContent>
          
          <TabsContent value="clients">
            <UsersTable users={clients} />
          </TabsContent>
        </Tabs>
      </div>
    </Dashboard>
  );
};

export default Users;
