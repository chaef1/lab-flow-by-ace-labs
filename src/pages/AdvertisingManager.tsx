
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Dashboard from "@/components/layout/Dashboard";
import AdAccountSelector from "@/components/advertising/AdAccountSelector";
import CampaignCreator from "@/components/advertising/CampaignCreator";
import MediaUploader from "@/components/advertising/MediaUploader";
import AdPerformance from "@/components/advertising/AdPerformance";
import { PlusCircle, TrendingUp } from "lucide-react";

const AdvertisingManager = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<'tiktok' | 'meta'>('tiktok');
  const [activeTab, setActiveTab] = useState('campaigns');

  return (
    <Dashboard 
      title="Advertising Manager" 
      subtitle="Create and manage your advertising campaigns"
      showSearch={false}
    >
      <div className="flex flex-col space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Advertising Platform</CardTitle>
                <CardDescription>Select the platform to create and manage your ads</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant={selectedPlatform === 'tiktok' ? 'default' : 'outline'} 
                  onClick={() => setSelectedPlatform('tiktok')}
                  className="flex-1 md:flex-auto"
                >
                  TikTok Ads
                </Button>
                <Button 
                  variant={selectedPlatform === 'meta' ? 'default' : 'outline'} 
                  onClick={() => setSelectedPlatform('meta')}
                  className="flex-1 md:flex-auto"
                  disabled
                >
                  Meta Ads (Coming Soon)
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <AdAccountSelector platform={selectedPlatform} />
          </CardContent>
        </Card>
        
        <Tabs defaultValue="campaigns" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="creatives">Creative Assets</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="campaigns" className="mt-0">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Your Campaigns</h3>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Create Campaign
              </Button>
            </div>
            <CampaignCreator platform={selectedPlatform} />
          </TabsContent>
          
          <TabsContent value="creatives" className="mt-0">
            <MediaUploader platform={selectedPlatform} />
          </TabsContent>
          
          <TabsContent value="performance" className="mt-0">
            <AdPerformance platform={selectedPlatform} />
          </TabsContent>
        </Tabs>
      </div>
    </Dashboard>
  );
};

export default AdvertisingManager;
