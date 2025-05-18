
import Dashboard from "@/components/layout/Dashboard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ApprovalCard from "@/components/content/ApprovalCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useState } from "react";

// Sample content approval data
const contentData = [
  {
    id: "c1",
    title: "Homepage Banner",
    type: "image",
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
    type: "video",
    thumbnail: "https://images.unsplash.com/photo-1626544827763-d516dce335e2?auto=format&fit=crop&w=500",
    creator: {
      name: "Jamie Lee",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=JL"
    },
    project: "Product Launch",
    status: "pending" as const,
    dateSubmitted: "2025-05-17",
    commentsCount: 1
  },
  {
    id: "c3",
    title: "Brand Guidelines PDF",
    type: "document",
    thumbnail: "",
    creator: {
      name: "Taylor Kim",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=TK"
    },
    project: "Brand Redesign",
    status: "approved" as const,
    dateSubmitted: "2025-05-10",
    commentsCount: 5
  },
  {
    id: "c4",
    title: "Social Media Ad Set",
    type: "image",
    thumbnail: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=500",
    creator: {
      name: "Robin Banks",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=RB"
    },
    project: "Summer Campaign",
    status: "needs-revisions" as const,
    dateSubmitted: "2025-05-12",
    commentsCount: 8
  },
  {
    id: "c5",
    title: "Email Newsletter Template",
    type: "document",
    thumbnail: "",
    creator: {
      name: "Jordan Patel",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=JP"
    },
    project: "Email Campaign",
    status: "rejected" as const,
    dateSubmitted: "2025-05-08",
    commentsCount: 2
  },
  {
    id: "c6",
    title: "Product Lifestyle Photos",
    type: "image",
    thumbnail: "https://images.unsplash.com/photo-1612011213729-063c92731dea?auto=format&fit=crop&w=500",
    creator: {
      name: "Alex Smith",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=AS"
    },
    project: "Product Launch",
    status: "approved" as const,
    dateSubmitted: "2025-05-05",
    commentsCount: 0
  },
];

const Content = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const filteredContent = contentData.filter((item) => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.project.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    const matchesType = filterType === "all" || item.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Group content by status
  const pendingContent = filteredContent.filter(item => item.status === 'pending');
  const approvedContent = filteredContent.filter(item => item.status === 'approved');
  const revisionsContent = filteredContent.filter(item => item.status === 'needs-revisions');
  const rejectedContent = filteredContent.filter(item => item.status === 'rejected');

  return (
    <Dashboard title="Content Approval" subtitle="Review and manage content submissions">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search content..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="needs-revisions">Needs Revisions</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Content Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button className="sm:w-auto">Upload Content</Button>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">
              All <span className="ml-1 text-xs bg-muted px-2 py-0.5 rounded-full">
                {filteredContent.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending <span className="ml-1 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                {pendingContent.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved <span className="ml-1 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                {approvedContent.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="revisions">
              Needs Revisions <span className="ml-1 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                {revisionsContent.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected <span className="ml-1 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                {rejectedContent.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {filteredContent.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No content found matching your filters.</p>
              </div>
            ) : (
              <div className="content-grid">
                {filteredContent.map((content) => (
                  <ApprovalCard key={content.id} content={content} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="pending">
            {pendingContent.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No pending content found matching your filters.</p>
              </div>
            ) : (
              <div className="content-grid">
                {pendingContent.map((content) => (
                  <ApprovalCard key={content.id} content={content} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="approved">
            {approvedContent.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No approved content found matching your filters.</p>
              </div>
            ) : (
              <div className="content-grid">
                {approvedContent.map((content) => (
                  <ApprovalCard key={content.id} content={content} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="revisions">
            {revisionsContent.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No content needing revisions found matching your filters.</p>
              </div>
            ) : (
              <div className="content-grid">
                {revisionsContent.map((content) => (
                  <ApprovalCard key={content.id} content={content} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="rejected">
            {rejectedContent.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No rejected content found matching your filters.</p>
              </div>
            ) : (
              <div className="content-grid">
                {rejectedContent.map((content) => (
                  <ApprovalCard key={content.id} content={content} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Dashboard>
  );
};

export default Content;
