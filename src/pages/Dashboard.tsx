
import Dashboard from "@/components/layout/Dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectCard from "@/components/projects/ProjectCard";
import WalletCard from "@/components/wallet/WalletCard";
import ApprovalCard from "@/components/content/ApprovalCard";
import { Activity, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Sample projects data
const recentProjects = [
  {
    id: "1",
    name: "Summer Campaign",
    description: "Social media campaign for summer products",
    client: "Beachside Co.",
    clientAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=Beachside",
    dueDate: "2025-06-15",
    status: "in-progress" as const,
    progress: 45,
    team: [
      { id: "u1", name: "Alex Smith", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=AS" },
      { id: "u2", name: "Jamie Lee", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=JL" },
    ],
  },
  {
    id: "2",
    name: "Product Launch Video",
    description: "Promotional video for new tech gadget",
    client: "TechGadgets Inc.",
    clientAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=TechGadgets",
    dueDate: "2025-07-01",
    status: "planning" as const,
    progress: 20,
    team: [
      { id: "u2", name: "Jamie Lee", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=JL" },
      { id: "u4", name: "Sam Jordan", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=SJ" },
    ],
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
      <div className="min-h-screen bg-background mobile-scroll">
        {/* Welcome Header */}
        <div className="px-4 pt-4 pb-6 md:px-6 md:pt-6">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">
            {greeting}, {userName}!
          </h1>
          <p className="text-muted-foreground">Here's what's happening with your projects today.</p>
        </div>

        {/* Stats Cards */}
        <div className="px-4 md:px-6 mb-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className="modern-card swipe-card p-4 touch-target">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Active Projects</p>
                  <p className="text-xl md:text-2xl font-bold text-foreground">12</p>
                </div>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Activity size={16} className="text-primary md:w-5 md:h-5" />
                </div>
              </div>
            </div>
            
            <div className="modern-card swipe-card p-4 touch-target">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Pending Approvals</p>
                  <p className="text-xl md:text-2xl font-bold text-foreground">7</p>
                </div>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Clock size={16} className="text-accent md:w-5 md:h-5" />
                </div>
              </div>
            </div>
            
            <div className="modern-card swipe-card p-4 touch-target">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Completed</p>
                  <p className="text-xl md:text-2xl font-bold text-foreground">24</p>
                </div>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <CheckCircle size={16} className="text-green-600 md:w-5 md:h-5" />
                </div>
              </div>
            </div>
            
            <div className="modern-card swipe-card p-4 touch-target">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Overdue</p>
                  <p className="text-xl md:text-2xl font-bold text-foreground">2</p>
                </div>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <AlertCircle size={16} className="text-destructive md:w-5 md:h-5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <div className="px-4 md:px-6">
          <Tabs defaultValue="overview" className="space-y-6">
            <div className="overflow-x-auto">
              <TabsList className="w-full justify-start min-w-max">
                <TabsTrigger value="overview" className="touch-target">Overview</TabsTrigger>
                <TabsTrigger value="projects" className="touch-target">Projects</TabsTrigger>
                <TabsTrigger value="finances" className="touch-target">Finances</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <div className="modern-card p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-foreground mb-1">Recent Projects</h3>
                    <p className="text-sm text-muted-foreground">Your latest active projects</p>
                  </div>
                  <div className="space-y-3">
                    {recentProjects.map(project => (
                      <div key={project.id} className="swipe-card">
                        <ProjectCard project={project} />
                      </div>
                    ))}
                  </div>
                </div>
                  
                <div className="modern-card p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-foreground mb-1">Content Requiring Approval</h3>
                    <p className="text-sm text-muted-foreground">Items pending your review</p>
                  </div>
                  <div className="space-y-3">
                    {approvalContent.map(content => (
                      <div key={content.id} className="swipe-card">
                        <ApprovalCard content={content} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="projects" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <div className="modern-card p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-foreground mb-1">Project Progress</h3>
                    <p className="text-sm text-muted-foreground">Current status of active projects</p>
                  </div>
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
                </div>
                
                <div className="modern-card p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-foreground mb-1">Project Status</h3>
                    <p className="text-sm text-muted-foreground">Distribution of project states</p>
                  </div>
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
                  
                  <div className="flex h-3 rounded-lg overflow-hidden bg-muted">
                    <div className="bg-primary w-[20%]" />
                    <div className="bg-accent w-[30%]" />
                    <div className="bg-purple-500 w-[20%]" />
                    <div className="bg-green-500 w-[30%]" />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="finances" className="space-y-6">
              <div className="swipe-card">
                <WalletCard balance={walletData.balance} transactions={walletData.transactions} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Dashboard>
  );
};

export default DashboardOverview;
