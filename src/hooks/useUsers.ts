import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export interface User extends Profile {
  email?: string;
  project_count?: number;
}

export const useUsers = () => {
  const fetchUsers = async (): Promise<User[]> => {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      throw profilesError;
    }

    // Get user emails from auth.users - for now just return profiles without emails
    // since auth.admin.listUsers() requires admin privileges
    const users: User[] = (profiles || []).map(profile => ({
      ...profile,
      email: undefined, // Will be filled in when we have admin access
      project_count: 0 // Will be calculated when we add projects relation
    }));

    return users;
  };

  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    meta: {
      onError: (error: any) => {
        toast.error(`Error fetching users: ${error.message}`);
      }
    }
  });
};

export const useInviteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ email, role, firstName, lastName }: {
      email: string;
      role: string;
      firstName?: string;
      lastName?: string;
    }) => {
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: role
        }
      });
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      toast.success('User invitation sent successfully!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to invite user: ${error.message}`);
    }
  });
};