import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, X } from 'lucide-react';

interface InfluencerPoolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  influencer: {
    id: string;
    username?: string;
    full_name?: string;
    pools?: Array<{ id: string; name: string; }>;
  } | null;
  availablePools: Array<{ id: string; name: string; description?: string; }>;
  onAddToPool: (influencerId: string, poolId: string) => Promise<void>;
  onRemoveFromPool: (influencerId: string, poolId: string) => Promise<void>;
  onCreatePool: (name: string, description?: string) => Promise<any>;
}

export function InfluencerPoolDialog({
  open,
  onOpenChange,
  influencer,
  availablePools,
  onAddToPool,
  onRemoveFromPool,
  onCreatePool
}: InfluencerPoolDialogProps) {
  const { toast } = useToast();
  const [selectedPoolId, setSelectedPoolId] = useState<string>('');
  const [isCreatingPool, setIsCreatingPool] = useState(false);
  const [newPoolName, setNewPoolName] = useState('');
  const [newPoolDescription, setNewPoolDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!influencer) return null;

  const displayName = influencer.full_name || influencer.username || 'Unknown';
  const currentPools = influencer.pools || [];
  const availablePoolsForAssignment = availablePools.filter(
    pool => !currentPools.some(cp => cp.id === pool.id)
  );

  const handleAddToPool = async () => {
    if (!selectedPoolId) return;
    
    setIsLoading(true);
    try {
      await onAddToPool(influencer.id, selectedPoolId);
      setSelectedPoolId('');
      toast({
        title: "Added to pool",
        description: "Influencer has been added to the pool successfully."
      });
    } catch (error) {
      console.error('Error adding to pool:', error);
      toast({
        title: "Error",
        description: "Failed to add influencer to pool.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromPool = async (poolId: string) => {
    setIsLoading(true);
    try {
      await onRemoveFromPool(influencer.id, poolId);
      toast({
        title: "Removed from pool",
        description: "Influencer has been removed from the pool."
      });
    } catch (error) {
      console.error('Error removing from pool:', error);
      toast({
        title: "Error",
        description: "Failed to remove influencer from pool.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePool = async () => {
    if (!newPoolName.trim()) return;
    
    setIsLoading(true);
    try {
      const newPool = await onCreatePool(newPoolName.trim(), newPoolDescription.trim());
      setNewPoolName('');
      setNewPoolDescription('');
      setIsCreatingPool(false);
      toast({
        title: "Pool created",
        description: "New pool has been created successfully."
      });
    } catch (error) {
      console.error('Error creating pool:', error);
      toast({
        title: "Error",
        description: "Failed to create pool.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Pool Assignments</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">Influencer: {displayName}</h3>
          </div>

          {/* Current pools */}
          <div>
            <Label className="text-sm font-medium">Current Pools</Label>
            {currentPools.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-2">
                {currentPools.map(pool => (
                  <Badge key={pool.id} variant="default" className="pr-1">
                    {pool.name}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-4 w-4 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleRemoveFromPool(pool.id)}
                      disabled={isLoading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">Not assigned to any pools</p>
            )}
          </div>

          {/* Add to existing pool */}
          <div>
            <Label className="text-sm font-medium">Add to Pool</Label>
            <div className="flex gap-2 mt-2">
              <Select value={selectedPoolId} onValueChange={setSelectedPoolId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a pool" />
                </SelectTrigger>
                <SelectContent>
                  {availablePoolsForAssignment.map(pool => (
                    <SelectItem key={pool.id} value={pool.id}>
                      {pool.name}
                    </SelectItem>
                  ))}
                  {availablePoolsForAssignment.length === 0 && (
                    <SelectItem value="none" disabled>
                      No available pools
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleAddToPool} 
                disabled={!selectedPoolId || isLoading}
                size="sm"
              >
                Add
              </Button>
            </div>
          </div>

          {/* Create new pool */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Create New Pool</Label>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsCreatingPool(!isCreatingPool)}
              >
                <Plus className="h-4 w-4 mr-1" />
                New Pool
              </Button>
            </div>
            
            {isCreatingPool && (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
                <div>
                  <Label htmlFor="poolName" className="text-sm">Pool Name</Label>
                  <Input
                    id="poolName"
                    value={newPoolName}
                    onChange={(e) => setNewPoolName(e.target.value)}
                    placeholder="Enter pool name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="poolDescription" className="text-sm">Description (optional)</Label>
                  <Textarea
                    id="poolDescription"
                    value={newPoolDescription}
                    onChange={(e) => setNewPoolDescription(e.target.value)}
                    placeholder="Enter pool description"
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleCreatePool}
                    disabled={!newPoolName.trim() || isLoading}
                    size="sm"
                    className="flex-1"
                  >
                    Create Pool
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsCreatingPool(false);
                      setNewPoolName('');
                      setNewPoolDescription('');
                    }}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}