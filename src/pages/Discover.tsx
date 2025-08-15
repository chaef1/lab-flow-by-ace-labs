import { useState } from 'react';
import Dashboard from '@/components/layout/Dashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InfluencerDiscovery } from '@/components/discover/InfluencerDiscovery';
import { ProductMatcher } from '@/components/discover/ProductMatcher';
import { LookalikeEngine } from '@/components/discover/LookalikeEngine';
import { SimpleTikTokSearch } from '@/components/discover/SimpleTikTokSearch';
import { InfluencerDatabase } from '@/components/discover/InfluencerDatabase';
import { AyrshareConnectionTest } from '@/components/discover/AyrshareConnectionTest';

const Discover = () => {
  return (
    <Dashboard 
      title="Creator Discovery" 
      subtitle="Find and discover the perfect creators for your campaigns"
    >
      <Tabs defaultValue="search" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="search">Advanced Search</TabsTrigger>
          <TabsTrigger value="database">Influencer Database</TabsTrigger>
          <TabsTrigger value="tiktok">TikTok Search</TabsTrigger>
          <TabsTrigger value="product">Product Matcher</TabsTrigger>
          <TabsTrigger value="lookalike">Lookalike Engine</TabsTrigger>
        </TabsList>
        
        <TabsContent value="search" className="space-y-6">
          <AyrshareConnectionTest />
          <InfluencerDiscovery />
        </TabsContent>
        
        <TabsContent value="database" className="space-y-6">
          <InfluencerDatabase />
        </TabsContent>
        
        <TabsContent value="tiktok" className="space-y-6">
          <SimpleTikTokSearch />
        </TabsContent>
        
        <TabsContent value="product" className="space-y-6">
          <ProductMatcher />
        </TabsContent>
        
        <TabsContent value="lookalike" className="space-y-6">
          <LookalikeEngine />
        </TabsContent>
      </Tabs>
    </Dashboard>
  );
};

export default Discover;