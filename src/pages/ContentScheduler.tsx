import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PostScheduler } from "@/components/content/PostScheduler";
import { ScheduledPosts } from "@/components/content/ScheduledPosts";
import { Calendar, Send, X } from "lucide-react";

export default function ContentScheduler() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("create");
  const [refreshPosts, setRefreshPosts] = useState(0);

  const handlePostScheduled = () => {
    setRefreshPosts(prev => prev + 1);
    setActiveTab("scheduled");
  };

  const handleClose = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="absolute top-0 right-0 h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
          Content Scheduler
        </h1>
        <p className="text-muted-foreground text-lg">
          Create, schedule, and manage your social media posts across all platforms
        </p>
      </div>

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
    </div>
  );
}