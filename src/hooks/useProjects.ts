
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];

export const useProjects = () => {
  const fetchProjects = async (): Promise<Project[]> => {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id, 
        title, 
        description, 
        status, 
        client, 
        client_id,
        campaign_id,
        due_date, 
        members, 
        created_at, 
        updated_at,
        shoot_date,
        user_id,
        brand_id
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
    meta: {
      // In v5, we put the error handling in meta
      onError: (error: any) => {
        toast.error(`Error fetching projects: ${error.message}`);
      }
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
          client_id,
          campaign_id,
          due_date, 
          members, 
          created_at, 
          updated_at,
          shoot_date,
          user_id,
          brand_id
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    enabled: !!id,
    meta: {
      // In v5, we put the error handling in meta
      onError: (error: any) => {
        toast.error(`Error fetching project: ${error.message}`);
      }
    }
  });
};
