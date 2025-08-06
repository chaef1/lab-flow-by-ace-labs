import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ImportResult {
  success: boolean;
  totalUsers: number;
  successCount: number;
  errorCount: number;
  summary: Record<string, { success: number; error: number; updated: number }>;
  results: Array<{
    email: string;
    status: string;
    role: string;
    tags?: string[];
    error?: any;
  }>;
}

export const useImportExistingUsers = () => {
  const { toast } = useToast();

  return useMutation<ImportResult, Error>({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('import-existing-users');
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Import Completed",
        description: `Successfully imported ${data.successCount} users to Mailchimp. ${data.errorCount} errors.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};