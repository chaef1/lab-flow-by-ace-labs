import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, index) => (
          <div key={index} className="bg-card border rounded-lg p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3 flex-1">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="w-8 h-8 rounded-md" />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="text-center space-y-2">
                  <Skeleton className="h-5 w-16 mx-auto" />
                  <Skeleton className="h-3 w-12 mx-auto" />
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-16 rounded-full" />
              ))}
            </div>

            <div className="flex gap-2">
              <Skeleton className="h-8 flex-1 rounded-md" />
              <Skeleton className="h-8 flex-1 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};