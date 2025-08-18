import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, Briefcase } from 'lucide-react';

const CampaignWorkspace = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Campaign Workspace</h1>
            <p className="text-muted-foreground">Manage creator campaigns and collaborations</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 text-center">
            <Briefcase className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Campaign Management</h3>
            <p className="text-sm text-muted-foreground">Organize and track your influencer campaigns</p>
          </Card>
          
          <Card className="p-6 text-center">
            <Users className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Creator Pipeline</h3>
            <p className="text-sm text-muted-foreground">Manage creator relationships and outreach</p>
          </Card>
          
          <Card className="p-6 text-center">
            <Plus className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
            <p className="text-sm text-muted-foreground">Full workspace features launching soon</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CampaignWorkspace;