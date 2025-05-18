
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useProjects = () => {
  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id, 
        title, 
        description, 
        status, 
        client, 
        due_date, 
        members, 
        created_at, 
        updated_at
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  };

  return useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    onError: (error: any) => {
      toast.error(`Error fetching projects: ${error.message}`);
    }
  });
};

export const useProjectById = (id: string | undefined) => {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id, 
          title, 
          description, 
          status, 
          client, 
          due_date, 
          members, 
          created_at, 
          updated_at
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    enabled: !!id,
    onError: (error: any) => {
      toast.error(`Error fetching project: ${error.message}`);
    }
  });
};
