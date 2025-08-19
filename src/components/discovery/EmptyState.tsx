import React from 'react';
import { Button } from '@/components/ui/button';
import { Search, Users, Filter } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: 'search' | 'users' | 'filter';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon = 'search',
}) => {
  const getIcon = () => {
    switch (icon) {
      case 'users':
        return <Users className="w-12 h-12 text-muted-foreground" />;
      case 'filter':
        return <Filter className="w-12 h-12 text-muted-foreground" />;
      default:
        return <Search className="w-12 h-12 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-6">
        {getIcon()}
      </div>
      
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>
      
      <p className="text-muted-foreground mb-6 max-w-md">
        {description}
      </p>

      {action && (
        <div>{action}</div>
      )}
    </div>
  );
};