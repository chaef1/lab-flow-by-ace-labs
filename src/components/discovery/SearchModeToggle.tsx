import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Globe, Zap } from 'lucide-react';

interface SearchModeToggleProps {
  searchMode: 'database' | 'api';
  onModeChange: (mode: 'database' | 'api') => void;
  isDatabaseFirst?: boolean;
  resultsCount?: number;
  fromDatabase?: boolean;
}

export const SearchModeToggle: React.FC<SearchModeToggleProps> = ({
  searchMode,
  onModeChange,
  isDatabaseFirst = true,
  resultsCount = 0,
  fromDatabase
}) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
        <Button
          variant={searchMode === 'database' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onModeChange('database')}
          className="flex items-center gap-2"
        >
          <Database className="h-4 w-4" />
          Database
          {isDatabaseFirst && (
            <Badge variant="secondary" className="ml-1 text-xs">
              Fast
            </Badge>
          )}
        </Button>
        
        <Button
          variant={searchMode === 'api' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onModeChange('api')}
          className="flex items-center gap-2"
        >
          <Globe className="h-4 w-4" />
          Live API
          <Badge variant="outline" className="ml-1 text-xs">
            Credits
          </Badge>
        </Button>
      </div>

      {resultsCount > 0 && fromDatabase !== undefined && (
        <div className="flex items-center gap-2">
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            {fromDatabase ? (
              <>
                <Database className="h-3 w-3" />
                <span>Local results</span>
              </>
            ) : (
              <>
                <Zap className="h-3 w-3" />
                <span>Live results</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};