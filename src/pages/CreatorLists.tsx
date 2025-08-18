import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Plus, 
  Trash2, 
  Users, 
  Heart, 
  Eye, 
  ExternalLink,
  List
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface List {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
}

interface ListItem {
  id: string;
  list_id: string;
  platform: string;
  user_id: string;
  username: string;
  snapshot_json: any;
  created_at: string;
}

const CreatorLists = () => {
  const [newListName, setNewListName] = useState('');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch lists
  const { data: lists, isLoading: listsLoading } = useQuery({
    queryKey: ['creator-lists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as List[];
    },
  });

  // Fetch list items for selected list
  const { data: listItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['list-items', selectedListId],
    queryFn: async () => {
      if (!selectedListId) return [];
      const { data, error } = await supabase
        .from('list_items')
        .select('*')
        .eq('list_id', selectedListId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ListItem[];
    },
    enabled: !!selectedListId,
  });

  // Create list mutation
  const createListMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('lists')
        .insert({ name, created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-lists'] });
      setNewListName('');
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "List created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create list",
        variant: "destructive",
      });
    },
  });

  // Delete list mutation
  const deleteListMutation = useMutation({
    mutationFn: async (listId: string) => {
      const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', listId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-lists'] });
      if (selectedListId) {
        setSelectedListId(null);
      }
      toast({
        title: "Success",
        description: "List deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete list",
        variant: "destructive",
      });
    },
  });

  // Remove item from list mutation
  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('list_items')
        .delete()
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['list-items', selectedListId] });
      toast({
        title: "Success",
        description: "Creator removed from list",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove creator",
        variant: "destructive",
      });
    },
  });

  const handleCreateList = () => {
    if (!newListName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a list name",
        variant: "destructive",
      });
      return;
    }
    createListMutation.mutate(newListName);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const CreatorCard = ({ item }: { item: ListItem }) => {
    const creator = item.snapshot_json;
    
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={creator.profilePicUrl} alt={creator.username} />
                <AvatarFallback>{creator.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-1">
                  <h3 className="font-semibold">{creator.fullName || creator.username}</h3>
                  {creator.isVerified && (
                    <Badge variant="secondary" className="text-xs">✓</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">@{creator.username}</p>
                <Badge variant="outline" className="text-xs mt-1">
                  {item.platform}
                </Badge>
              </div>
            </div>
            
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => removeItemMutation.mutate(item.id)}
              disabled={removeItemMutation.isPending}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <Users className="w-4 h-4" />
                <span className="font-medium">{formatNumber(creator.followers || 0)}</span>
              </div>
              <div className="text-muted-foreground">Followers</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <Heart className="w-4 h-4" />
                <span className="font-medium">{(creator.engagementRate || 0).toFixed(1)}%</span>
              </div>
              <div className="text-muted-foreground">Engagement</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <Eye className="w-4 h-4" />
                <span className="font-medium">{formatNumber(creator.avgViews || 0)}</span>
              </div>
              <div className="text-muted-foreground">Avg Views</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {creator.topAudience?.country && (
                <span>{creator.topAudience.country}</span>
              )}
            </div>
            
            <Button variant="ghost" size="sm" asChild>
              <a 
                href={`https://instagram.com/${creator.username}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Creator Lists</h1>
          <p className="text-muted-foreground">
            Manage your saved creator lists from Modash Discovery
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create List
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New List</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="List name"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateList}
                  disabled={createListMutation.isPending}
                >
                  {createListMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Lists Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <List className="w-5 h-5" />
                <span>Your Lists</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {listsLoading ? (
                <div className="text-center py-4">Loading...</div>
              ) : lists?.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No lists yet. Create your first list!
                </div>
              ) : (
                lists?.map((list) => (
                  <div
                    key={list.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedListId === list.id 
                        ? 'bg-primary/10 border-primary' 
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedListId(list.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{list.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteListMutation.mutate(list.id);
                        }}
                        disabled={deleteListMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Created {new Date(list.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* List Items */}
        <div className="lg:col-span-3">
          {selectedListId ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                {lists?.find(l => l.id === selectedListId)?.name} Creators
              </h2>
              
              {itemsLoading ? (
                <div className="text-center py-8">Loading creators...</div>
              ) : listItems?.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No creators in this list</h3>
                    <p className="text-muted-foreground">
                      Add creators from Modash Discovery to get started
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {listItems?.map((item) => (
                    <CreatorCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <List className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a list</h3>
                <p className="text-muted-foreground">
                  Choose a list from the sidebar to view its creators
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatorLists;