
import Dashboard from "@/components/layout/Dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectCard from "@/components/projects/ProjectCard";
import WalletCard from "@/components/wallet/WalletCard";
import ApprovalCard from "@/components/content/ApprovalCard";
import { Activity, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Database } from "@/integrations/supabase/types";

type Project = Database['public']['Tables']['projects']['Row'];

// Sample projects data that matches the database schema
const recentProjects: Project[] = [
  {
    id: "1",
    title: "Summer Campaign",
    description: "Social media campaign for summer products",
    client: "Beachside Co.",
    due_date: "2025-06-15",
    shoot_date: null,
    status: "production",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    user_id: null,
    brand_id: null,
    campaign_id: null,
    client_id: null,
    members: null
  },
  {
    id: "2",
    title: "Product Launch Video",
    description: "Promotional video for new tech gadget",
    client: "TechGadgets Inc.",
    due_date: "2025-07-01",
    shoot_date: null,
    status: "conceptualisation",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    user_id: null,
    brand_id: null,
    campaign_id: null,
    client_id: null,
    members: null
  },
];

// Sample wallet data
const walletData = {
  balance: 14250.75,
  transactions: [
    {
      id: "t1",
      type: "payment" as const,
      description: "Website Redesign Payment",
      amount: 2500,
      status: "completed" as const,
      date: "2025-05-16"
    },
    {
      id: "t2",
      type: "invoice" as const,
      description: "Q2 Marketing Campaign",
      amount: 4500,
      status: "pending" as const,
      date: "2025-05-10"
    },
    {
      id: "t3",
      type: "withdrawal" as const,
      description: "Withdrawal to Bank Account",
      amount: 3000,
      status: "completed" as const,
      date: "2025-05-05"
    },
  ]
};

// Sample content approval data
const approvalContent = [
  {
    id: "c1",
    title: "Homepage Banner",
    type: "image" as const,
    thumbnail: "https://images.unsplash.com/photo-1661956602868-6ae368943878?auto=format&fit=crop&w=500",
    creator: {
      name: "Alex Smith",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=AS"
    },
    project: "Summer Campaign",
    status: "pending" as const,
    dateSubmitted: "2025-05-15",
    commentsCount: 3
  },
  {
    id: "c2",
    title: "Product Demo Video",
    type: "video" as const,
    thumbnail: "https://images.unsplash.com/photo-1626544827763-d516dce335e2?auto=format&fit=crop&w=500",
    creator: {
      name: "Jamie Lee",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=JL"
    },
    project: "Product Launch",
    status: "pending" as const,
    dateSubmitted: "2025-05-17",
    commentsCount: 1
  }
];

const DashboardOverview = () => {
  // Get user info from localStorage
  const userInfo = JSON.parse(localStorage.getItem('agencyDashboardUser') || '{}');
  const userName = userInfo.name || 'User';
  const currentHour = new Date().getHours();
  let greeting = "Good morning";
  if (currentHour >= 12 && currentHour < 17) greeting = "Good afternoon";
  if (currentHour >= 17) greeting = "Good evening";

  return (
    <Dashboard title="Dashboard" subtitle="Overview of your agency activities">
      <div className="space-y-8">
        <h2 className="text-2xl font-medium">
          {greeting}, {userName}!
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Active Projects</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-agency-100 flex items-center justify-center text-agency-700">
                  <Activity size={20} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Pending Approvals</p>
                  <p className="text-2xl font-bold">7</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                  <Clock size={20} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Completed</p>
                  <p className="text-2xl font-bold">24</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                  <CheckCircle size={20} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Overdue</p>
                  <p className="text-2xl font-bold">2</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-700">
                  <AlertCircle size={20} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="finances">Finances</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Projects</CardTitle>
                  <CardDescription>Your latest active projects</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentProjects.map(project => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </CardContent>
              </Card>
                
              <Card>
                <CardHeader>
                  <CardTitle>Content Requiring Approval</CardTitle>
                  <CardDescription>Items pending your review</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {approvalContent.map(content => (
                    <ApprovalCard key={content.id} content={content} />
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="projects" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Progress</CardTitle>
                  <CardDescription>Current status of active projects</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Summer Campaign</span>
                        <span>45%</span>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Product Launch Video</span>
                        <span>20%</span>
                      </div>
                      <Progress value={20} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Brand Redesign</span>
                        <span>80%</span>
                      </div>
                      <Progress value={80} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Email Campaign</span>
                        <span>60%</span>
                      </div>
                      <Progress value={60} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Project Status</CardTitle>
                  <CardDescription>Distribution of project states</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between mb-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Planning</span>
                      <span className="text-lg font-semibold">3</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">In Progress</span>
                      <span className="text-lg font-semibold">5</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">In Review</span>
                      <span className="text-lg font-semibold">4</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Completed</span>
                      <span className="text-lg font-semibold">24</span>
                    </div>
                  </div>
                  
                  <div className="flex h-4 rounded-md overflow-hidden">
                    <div className="bg-blue-500 w-[20%]" />
                    <div className="bg-amber-500 w-[30%]" />
                    <div className="bg-purple-500 w-[20%]" />
                    <div className="bg-green-500 w-[30%]" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="finances" className="space-y-4">
            <WalletCard balance={walletData.balance} transactions={walletData.transactions} />
          </TabsContent>
        </Tabs>
      </div>
    </Dashboard>
  );
};

export default DashboardOverview;
