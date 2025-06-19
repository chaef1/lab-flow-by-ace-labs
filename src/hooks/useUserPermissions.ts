
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useUserPermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchUserPermissions();
    } else {
      setPermissions([]);
      setLoading(false);
    }
  }, [user?.id]);

  const fetchUserPermissions = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('module')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching user permissions:', error);
        return;
      }

      const userModules = data.map(p => p.module);
      setPermissions(userModules);
    } catch (error) {
      console.error('Error fetching user permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (module: string) => {
    return permissions.includes(module);
  };

  const hasAnyPermission = (modules: string[]) => {
    return modules.some(module => permissions.includes(module));
  };

  return {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    refetch: fetchUserPermissions
  };
};
