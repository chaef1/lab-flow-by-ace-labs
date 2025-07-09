import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HashtagSearch from './HashtagSearch';
import ProfileVetting from './ProfileVetting';
import PostAnalytics from './PostAnalytics';
import AccountInsights from './AccountInsights';

interface InstagramAnalyticsProps {
  timeRange: string;
  platform: string;
}

const InstagramAnalytics = ({ timeRange, platform }: InstagramAnalyticsProps) => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="hashtags" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="hashtags">Hashtag Search</TabsTrigger>
          <TabsTrigger value="profiles">Profile Vetting</TabsTrigger>
          <TabsTrigger value="posts">Post Analytics</TabsTrigger>
          <TabsTrigger value="insights">Account Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="hashtags" className="space-y-6">
          <HashtagSearch />
        </TabsContent>
        
        <TabsContent value="profiles" className="space-y-6">
          <ProfileVetting />
        </TabsContent>
        
        <TabsContent value="posts" className="space-y-6">
          <PostAnalytics timeRange={timeRange} />
        </TabsContent>
        
        <TabsContent value="insights" className="space-y-6">
          <AccountInsights timeRange={timeRange} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InstagramAnalytics;