import React from 'react';
import { useToast } from '@/hooks/use-toast';

interface ErrorHandlerProps {
  error: string | null;
  onClear: () => void;
}

export const ToastErrorHandler: React.FC<ErrorHandlerProps> = ({ error, onClear }) => {
  const { toast } = useToast();

  React.useEffect(() => {
    if (error) {
      if (error.includes('rate limit') || error.includes('Rate limit')) {
        toast({
          title: "Rate Limit Reached",
          description: "Too many requests. Please wait a moment before searching again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Search Error",
          description: error,
          variant: "destructive", 
        });
      }
      
      // Clear error after showing toast
      setTimeout(onClear, 100);
    }
  }, [error, toast, onClear]);

  return null;
};