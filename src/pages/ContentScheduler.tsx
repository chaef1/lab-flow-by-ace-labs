import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostScheduler } from "@/components/content/PostScheduler";
import { ScheduledPosts } from "@/components/content/ScheduledPosts";
import { Calendar, Send } from "lucide-react";
import Dashboard from "@/components/layout/Dashboard";

export default function ContentScheduler() {
  const [activeTab, setActiveTab] = useState("create");
  const [refreshPosts, setRefreshPosts] = useState(0);

  const handlePostScheduled = () => {
    setRefreshPosts(prev => prev + 1);
    setActiveTab("scheduled");
  };

  return (
    <Dashboard 
      title="Content Scheduler" 
      subtitle="Create, schedule, and manage your social media posts across all platforms"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-8 bg-muted/50 p-1">
          <TabsTrigger value="create" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Send className="h-4 w-4" />
            Create Post
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Calendar className="h-4 w-4" />
            Scheduled Posts
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="create">
          <PostScheduler onPostScheduled={handlePostScheduled} />
        </TabsContent>
        
        <TabsContent value="scheduled" key={refreshPosts}>
          <ScheduledPosts />
        </TabsContent>
      </Tabs>
    </Dashboard>
  );
}