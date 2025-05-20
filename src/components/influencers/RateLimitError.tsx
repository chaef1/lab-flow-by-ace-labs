
import { AlertCircle, RefreshCw, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RateLimitErrorProps {
  message?: string;
  onRetry: () => void;
}

export function RateLimitError({ message, onRetry }: RateLimitErrorProps) {
  return (
    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          <h3 className="font-medium text-amber-800">API Rate Limit Reached</h3>
          <p className="text-amber-700 mt-1">
            {message || "The Instagram API is temporarily unavailable due to rate limiting. Please try again in a few minutes."}
          </p>
          <div className="mt-3 flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
              onClick={onRetry}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <div className="text-sm text-amber-600 flex items-center">
              <Timer className="mr-2 h-4 w-4" />
              Typically resolves within 15 minutes
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
