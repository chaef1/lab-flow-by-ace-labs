import { useState } from 'react';
import Dashboard from '@/components/layout/Dashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CampaignKanban } from '@/components/campaigns/CampaignKanban';
import { CampaignList } from '@/components/campaigns/CampaignList';
import { CreateCampaignDialog } from '@/components/campaigns/CreateCampaignDialog';

const CampaignCRM = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <Dashboard 
      title="Campaign Management" 
      subtitle="Manage your influencer campaigns from discovery to reporting"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Tabs defaultValue="kanban" className="w-auto">
            <TabsList>
              <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </div>

        <Tabs defaultValue="kanban" className="w-full">
          <TabsContent value="kanban" className="space-y-6">
            <CampaignKanban />
          </TabsContent>
          
          <TabsContent value="list" className="space-y-6">
            <CampaignList />
          </TabsContent>
        </Tabs>

        <CreateCampaignDialog 
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      </div>
    </Dashboard>
  );
};

export default CampaignCRM;