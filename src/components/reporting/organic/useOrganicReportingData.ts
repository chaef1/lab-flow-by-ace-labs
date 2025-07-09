
import { useState, useEffect } from 'react';

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
        const response = await fetch('/api/organic/reporting', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ timeRange, platform }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch organic reporting data: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
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
