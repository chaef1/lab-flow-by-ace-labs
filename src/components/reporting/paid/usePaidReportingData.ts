
import { useState, useEffect } from 'react';
import { getSavedMetaToken, hasMetaToken, getSavedTikTokToken, hasTikTokToken } from '@/lib/ads-api';

export const usePaidReportingData = (timeRange: string, platform: 'meta' | 'tiktok') => {
  const [data, setData] = useState({
    metrics: {
      spend: '$0',
      spendChange: '0%',
      impressions: '0',
      impressionsChange: '0%',
      clicks: '0',
      clicksChange: '0%',
      ctr: '0%',
      ctrChange: '0%',
      costPerClick: '$0',
      costPerClickChange: '0%'
    },
    performanceData: [],
    adSpendData: [],
    campaigns: [],
    adSets: [],
    ads: []
  });
  
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkConnection = () => {
      if (platform === 'meta') {
        return hasMetaToken();
      } else if (platform === 'tiktok') {
        return hasTikTokToken();
      }
      return false;
    };
    
    setIsConnected(checkConnection());

    const fetchPaidData = async () => {
      // Reset error state
      setError(null);
      
      try {
        if (!checkConnection()) {
          setError(`${platform.charAt(0).toUpperCase() + platform.slice(1)} API not connected. Please connect your ${platform} advertising account first.`);
          return;
        }
        
        // Make actual API call to fetch paid reporting data
        const response = await fetch(`/api/${platform}/reporting`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ timeRange }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch ${platform} reporting data: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setData(data);
      } catch (err: any) {
        console.error(`Error fetching ${platform} paid reporting data:`, err);
        setError(err.message || `Failed to fetch ${platform} reporting data. Please check your API connection and permissions.`);
        
        // Set empty data instead of mock data
        setData({
          metrics: {
            spend: '$0',
            spendChange: '0%',
            impressions: '0',
            impressionsChange: '0%',
            clicks: '0',
            clicksChange: '0%',
            ctr: '0%',
            ctrChange: '0%',
            costPerClick: '$0',
            costPerClickChange: '0%'
          },
          performanceData: [],
          adSpendData: [],
          campaigns: [],
          adSets: [],
          ads: []
        });
      }
    };

    fetchPaidData();
  }, [platform, timeRange]);

  return { data, error, isConnected };
};
