import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  
  const { lists, createList, addToList, isCreatingList, isAddingToList } = useModashDiscovery();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSave = async () => {
    try {
      let listId = selectedListId;
      
      if (showNewList && newListName.trim()) {
        // Create new list first
        await createList(newListName.trim());
        // Get the newly created list ID from the cache
        await queryClient.invalidateQueries({ queryKey: ['creator-lists'] });
        const updatedLists = queryClient.getQueryData(['creator-lists']) as any[];
        const newList = updatedLists?.find(list => list.name === newListName.trim());
        listId = newList?.id;
      }

      if (!listId) {
        toast({
          title: "Error",
          description: "Please select a list or create a new one",
          variant: "destructive",
        });
        return;
      }

      await addToList({ listId, creator });
      
      toast({
        title: "Success",
        description: `${creator.username} added to list`,
      });
      
      onOpenChange(false);
      setSelectedListId('');
      setNewListName('');
      setShowNewList(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save creator to list",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save to List</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Save @{creator?.username} to one of your lists
          </div>

          {!showNewList && (
            <>
              <div className="space-y-3">
                <Label>Select a list</Label>
                <RadioGroup value={selectedListId} onValueChange={setSelectedListId}>
                  {lists?.map((list) => (
                    <div key={list.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={list.id} id={list.id} />
                      <Label htmlFor={list.id} className="flex-1 cursor-pointer">
                        {list.name}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
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
                placeholder="Enter list name"
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
                isCreatingList ||
                isAddingToList
              }
              className="flex-1"
            >
              {isCreatingList || isAddingToList ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};