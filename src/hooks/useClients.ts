
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useClients = () => {
  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('status', 'active')
      .order('name');
    
    if (error) {
      throw error;
    }
    
    return data || [];
  };

  return useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
    meta: {
      onError: (error: any) => {
        toast.error(`Error fetching clients: ${error.message}`);
      }
    }
  });
};
