
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useOrganicReportingData = (timeRange: string, platform: string) => {
  const [data, setData] = useState<{
    metrics: {
      reach: string;
      reachChange: string;
      engagement: string;
      engagementChange: string;
      contentCount: number;
    };
    contentPerformanceData: any[];
    engagementData: any[];
    topPerformingContent: any[];
    creatorStats: any[];
    error?: string;
  }>({
    metrics: {
      reach: '0',
      reachChange: '0%',
      engagement: '0%',
      engagementChange: '0%',
      contentCount: 0
    },
    contentPerformanceData: [],
    engagementData: [],
    topPerformingContent: [],
    creatorStats: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use existing Ayrshare analytics function instead of non-existent endpoint
        const { data, error } = await supabase.functions.invoke('ayrshare-analytics', {
          body: { 
            action: 'account_insights',
            timeRange: timeRange.replace('d', ''),
            platform: platform.toLowerCase()
          }
        });

        if (error) {
          throw new Error(error.message || 'Failed to fetch organic reporting data');
        }
        setData(data);
      } catch (error: any) {
        console.error('Organic reporting error:', error);
        setData({
          metrics: {
            reach: '0',
            reachChange: '0%',
            engagement: '0%',
            engagementChange: '0%',
            contentCount: 0
          },
          contentPerformanceData: [],
          engagementData: [],
          topPerformingContent: [],
          creatorStats: [],
          error: error.message || "Unable to fetch organic reporting data. Please check your API connections and permissions."
        });
      }
    };

    fetchData();
  }, [timeRange, platform]);

  return data;
};
