import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { modashClient, ModashCreator } from '@/lib/modash-client';

export interface CreatorProfileData {
  creator: ModashCreator;
  report?: any;
  performance?: any;
  collaborations?: any;
  posts?: any;
}

export const useCreatorProfile = () => {
  const [selectedCreator, setSelectedCreator] = useState<ModashCreator | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch detailed creator data when a creator is selected
  const { data: profileData, isLoading, error } = useQuery({
    queryKey: ['creator-profile', selectedCreator?.platform, selectedCreator?.userId],
    queryFn: async () => {
      if (!selectedCreator) return null;

      const [report, performance, collaborations] = await Promise.allSettled([
        modashClient.getCreatorReport(selectedCreator.platform, selectedCreator.userId),
        modashClient.getPerformanceData(selectedCreator.platform, selectedCreator.userId, {
          period: 30,
          postCount: 20
        }),
        modashClient.getCollaborationSummary({
          platform: selectedCreator.platform,
          userId: selectedCreator.userId,
          period: 90
        })
      ]);

      return {
        creator: selectedCreator,
        report: report.status === 'fulfilled' ? report.value : null,
        performance: performance.status === 'fulfilled' ? performance.value : null,
        collaborations: collaborations.status === 'fulfilled' ? collaborations.value : null,
      } as CreatorProfileData;
    },
    enabled: !!selectedCreator,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const openProfile = useCallback((creator: ModashCreator) => {
    setSelectedCreator(creator);
    setIsOpen(true);
  }, []);

  const closeProfile = useCallback(() => {
    setIsOpen(false);
    // Keep selectedCreator for a smooth close animation
    setTimeout(() => setSelectedCreator(null), 300);
  }, []);

  return {
    profileData,
    isLoading,
    error,
    isOpen,
    openProfile,
    closeProfile,
  };
};
