import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TestResult {
  success: boolean;
  message?: string;
  status?: number;
  data?: any;
  error?: string;
  details?: string;
}

export const AyrshareConnectionTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const { toast } = useToast();

  const testConnection = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      console.log('Testing Ayrshare API connection...');
      
      const { data, error } = await supabase.functions.invoke('test-ayrshare', {
        body: {}
      });

      if (error) {
        console.error('Edge function error:', error);
        setTestResult({
          success: false,
          error: 'Edge function failed',
          details: error.message
        });
        toast({
          title: "Connection Test Failed",
          description: "Edge function error: " + error.message,
          variant: "destructive",
        });
        return;
      }

      console.log('Test result:', data);
      setTestResult(data);

      if (data.success) {
        toast({
          title: "Connection Successful",
          description: "Ayrshare API is connected and working properly",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: data.error || "API connection test failed",
          variant: "destructive",
        });
      }

    } catch (err) {
      console.error('Test error:', err);
      const errorResult = {
        success: false,
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
          Ayrshare API Connection Test
          {testResult && (
            testResult.success ? 
            <CheckCircle className="h-5 w-5 text-green-500" /> : 
            <XCircle className="h-5 w-5 text-red-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testConnection} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing Connection...
            </>
          ) : (
            'Test API Connection'
          )}
        </Button>

        {testResult && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={testResult.success ? "default" : "destructive"}>
                {testResult.success ? "Connected" : "Failed"}
              </Badge>
              {testResult.status && (
                <Badge variant="outline">
                  HTTP {testResult.status}
                </Badge>
              )}
            </div>

            {testResult.message && (
              <p className="text-sm text-green-600 dark:text-green-400">
                {testResult.message}
              </p>
            )}

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
                <h4 className="text-sm font-medium mb-2">API Response:</h4>
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