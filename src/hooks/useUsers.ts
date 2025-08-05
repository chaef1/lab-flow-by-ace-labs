import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export interface User extends Profile {
  email?: string;
  project_count?: number;
  name?: string;
  avatar?: string;
  status?: string;
  projects?: number;
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

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, firstName, lastName, role }: {
      userId: string;
      firstName?: string;
      lastName?: string;
      role: string;
    }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          role: role as any
        })
        .eq('id', userId);
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      toast.success('User updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to update user: ${error.message}`);
    }
  });
};

export const useDeactivateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, deactivate }: {
      userId: string;
      deactivate: boolean;
    }) => {
      // Note: This would typically update a status field in profiles table
      // For now, we'll use the admin API to disable/enable the user
      const { data, error } = deactivate 
        ? await supabase.auth.admin.updateUserById(userId, { ban_duration: 'none' })
        : await supabase.auth.admin.updateUserById(userId, { ban_duration: '24h' });
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    onSuccess: (_, { deactivate }) => {
      toast.success(`User ${deactivate ? 'deactivated' : 'activated'} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to update user status: ${error.message}`);
    }
  });
};

export const useEmailUser = () => {
  return useMutation({
    mutationFn: async ({ email, subject, message, name }: {
      email: string;
      subject: string;
      message: string;
      name: string;
    }) => {
      // This will call your email edge function
      const { data, error } = await supabase.functions.invoke('send-user-email', {
        body: { email, subject, message, name }
      });
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      toast.success('Email sent successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to send email: ${error.message}`);
    }
  });
};