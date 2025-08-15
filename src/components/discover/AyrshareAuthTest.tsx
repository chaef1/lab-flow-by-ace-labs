import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthTestResult {
  success: boolean;
  action?: string;
  data?: any;
  error?: string;
  details?: string;
}

export const AyrshareAuthTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<AuthTestResult | null>(null);
  const { toast } = useToast();

  const testGetProfiles = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      console.log('Testing Ayrshare auth - get profiles...');
      
      const { data, error } = await supabase.functions.invoke('ayrshare-auth', {
        body: {
          action: 'get_profiles'
        }
      });

      if (error) {
        console.error('Auth function error:', error);
        setTestResult({
          success: false,
          action: 'get_profiles',
          error: 'Auth function failed',
          details: error.message
        });
        toast({
          title: "Auth Test Failed",
          description: "Function error: " + error.message,
          variant: "destructive",
        });
        return;
      }

      console.log('Auth test result:', data);
      setTestResult({
        success: data.success,
        action: 'get_profiles',
        data: data.data,
        error: data.error,
        details: data.error
      });

      if (data.success) {
        toast({
          title: "Auth Test Successful",
          description: "Ayrshare auth is working properly",
        });
      } else {
        toast({
          title: "Auth Test Failed",
          description: data.error || "Auth test failed",
          variant: "destructive",
        });
      }

    } catch (err) {
      console.error('Auth test error:', err);
      const errorResult = {
        success: false,
        action: 'get_profiles',
        error: 'Test failed',
        details: err instanceof Error ? err.message : 'Unknown error'
      };
      setTestResult(errorResult);
      
      toast({
        title: "Test Failed",
        description: errorResult.details,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Ayrshare Auth Test
          {testResult && (
            testResult.success ? 
            <CheckCircle className="h-5 w-5 text-green-500" /> : 
            <XCircle className="h-5 w-5 text-red-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testGetProfiles} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing Auth...
            </>
          ) : (
            'Test Auth & Get Profiles'
          )}
        </Button>

        {testResult && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={testResult.success ? "default" : "destructive"}>
                {testResult.success ? "Auth Working" : "Auth Failed"}
              </Badge>
              {testResult.action && (
                <Badge variant="outline">
                  {testResult.action}
                </Badge>
              )}
            </div>

            {testResult.error && (
              <p className="text-sm text-red-600 dark:text-red-400">
                <strong>Error:</strong> {testResult.error}
              </p>
            )}

            {testResult.details && (
              <p className="text-xs text-muted-foreground">
                <strong>Details:</strong> {testResult.details}
              </p>
            )}

            {testResult.data && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Auth Response:</h4>
                <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-40">
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};