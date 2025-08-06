import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useTestMailchimp = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('test-mailchimp');
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Mailchimp Connection Test Successful",
          description: `Connected to list: ${data.listInfo.name} (${data.listInfo.memberCount} members)`,
        });
      } else {
        toast({
          title: "Mailchimp Connection Failed",
          description: data.error || "Unknown error",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};