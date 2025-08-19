import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DictionaryEntry {
  id: string;
  name: string;
  type?: string;
}

export const useModashDiscovery = () => {
  const [searchKeyword, setSearchKeyword] = useState('');

  // Fetch dictionaries with caching
  const useDictionary = (kind: 'location' | 'interest' | 'brand' | 'language', query: string = '') => {
    return useQuery({
      queryKey: ['modash-dictionary', kind, query],
      queryFn: async () => {
        const { data, error } = await supabase.functions.invoke('modash-dictionaries', {
          body: { 
            kind,
            query: query || searchKeyword, 
            limit: 50 
          }
        });
        if (error) throw error;
        return data as DictionaryEntry[];
      },
      enabled: (query || searchKeyword).length >= 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Fetch lists
  const { data: lists, refetch: refetchLists } = useQuery({
    queryKey: ['creator-lists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
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
      refetchLists();
    },
  });

  // Add to list mutation
  const addToListMutation = useMutation({
    mutationFn: async ({ listId, creator }: { listId: string; creator: any }) => {
      const { data, error } = await supabase
        .from('list_items')
        .insert({
          list_id: listId,
          platform: creator.platform,
          user_id: creator.userId,
          username: creator.username,
          snapshot_json: creator,
        });
      if (error) throw error;
      return data;
    },
  });

  return {
    searchKeyword,
    setSearchKeyword,
    useDictionary,
    lists,
    createList: createListMutation.mutate,
    addToList: addToListMutation.mutate,
    isCreatingList: createListMutation.isPending,
    isAddingToList: addToListMutation.isPending,
  };
};