
import React, { useState } from 'react';
import Dashboard from "@/components/layout/Dashboard";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import SocialMediaSearch from '@/components/influencers/SocialMediaSearch';
import { InfluencerList } from '@/components/influencers/InfluencerList';

const Influencers = () => {
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);

  const handleAddInfluencer = () => {
    setIsSearchDialogOpen(false);
  };

  return (
    <Dashboard title="Influencer Directory" subtitle="Find and connect with influencers" showSearch={true}>
      <div className="space-y-6">
        <div className="flex justify-end">
          <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Influencer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Influencer</DialogTitle>
                <DialogDescription>
                  Search for influencers on social media and add them to your database.
                </DialogDescription>
              </DialogHeader>
              <SocialMediaSearch onAddInfluencer={handleAddInfluencer} />
            </DialogContent>
          </Dialog>
        </div>

        <InfluencerList 
          onAddInfluencer={() => setIsSearchDialogOpen(true)}
        />
      </div>
    </Dashboard>
  );
};

export default Influencers;
