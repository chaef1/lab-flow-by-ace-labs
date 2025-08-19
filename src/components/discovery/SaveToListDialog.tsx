import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useModashDiscovery } from '@/hooks/useModashDiscovery';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

interface SaveToListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creator: any;
}

export const SaveToListDialog = ({ open, onOpenChange, creator }: SaveToListDialogProps) => {
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [newListName, setNewListName] = useState('');
  const [showNewList, setShowNewList] = useState(false);
  
  const { lists, addToWatchlist, isAddingToWatchlist } = useModashDiscovery();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create list mutation
  const createListMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('lists')
        .insert({ name, created_by: (await supabase.auth.getUser()).data.user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-lists'] });
    }
  });

  const handleSave = async () => {
    try {
      let listId = selectedListId;
      
      if (showNewList && newListName.trim()) {
        // Create new list first
        const newList = await createListMutation.mutateAsync(newListName.trim());
        listId = newList.id;
      }

      if (!listId) {
        toast({
          title: "Error",
          description: "Please select a list or create a new one",
          variant: "destructive",
        });
        return;
      }

      await addToWatchlist({ watchlistId: listId, creator });
      
      toast({
        title: "Success",
        description: `${creator.username} added to list successfully`,
      });
      
      onOpenChange(false);
      setSelectedListId('');
      setNewListName('');
      setShowNewList(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save creator to list",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby="save-to-list-description">
        <DialogHeader>
          <DialogTitle>Save to List</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4" id="save-to-list-description">
          <div className="text-sm text-muted-foreground">
            Save @{creator?.username} to one of your lists for campaign planning or client approval
          </div>

          {!showNewList && (
            <>
              <div className="space-y-3">
                <Label>Select a list</Label>
                {lists && lists.length > 0 ? (
                  <RadioGroup value={selectedListId} onValueChange={setSelectedListId}>
                    {lists.map((list) => (
                      <div key={list.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={list.id} id={list.id} />
                        <Label htmlFor={list.id} className="flex-1 cursor-pointer">
                          {list.name}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <p className="text-sm text-muted-foreground">No lists found. Create your first list below.</p>
                )}
              </div>

              <Button
                variant="outline"
                onClick={() => setShowNewList(true)}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New List
              </Button>
            </>
          )}

          {showNewList && (
            <div className="space-y-3">
              <Label htmlFor="newListName">New List Name</Label>
              <Input
                id="newListName"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="e.g., Fashion Campaign 2024, Client Approval Queue"
              />
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewList(false);
                  setNewListName('');
                }}
                className="w-full"
              >
                Use Existing List Instead
              </Button>
            </div>
          )}

          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                (!selectedListId && !newListName.trim()) ||
                createListMutation.isPending ||
                isAddingToWatchlist
              }
              className="flex-1"
            >
              {createListMutation.isPending || isAddingToWatchlist ? 'Saving...' : 'Save to List'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};