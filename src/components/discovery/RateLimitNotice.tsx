import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, AlertTriangle } from 'lucide-react';

interface RateLimitNoticeProps {
  show: boolean;
}

export const RateLimitNotice: React.FC<RateLimitNoticeProps> = ({ show }) => {
  if (!show) return null;

  return (
    <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-800 dark:text-orange-200">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>
            Search is temporarily rate limited. Try searching for a different creator or wait a moment before trying again.
          </span>
        </div>
      </AlertDescription>
    </Alert>
  );
};