
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
          return;
        }
        
        // In a real implementation, this would call the Meta or TikTok API
        // For now, we'll use mock data
        
        // Simulating different data for different platforms
        if (platform === 'meta') {
          // Get actual token if available
          const { accessToken, accountId } = getSavedMetaToken();
          
          // In a real implementation, use the token to fetch data
          console.log(`Using Meta account: ${accountId} with token: ${accessToken?.substring(0, 10)}...`);
          
          setData({
            metrics: {
              spend: '$2,450.78',
              spendChange: '+15.2%',
              impressions: '324,567',
              impressionsChange: '+18.7%',
              clicks: '12,345',
              clicksChange: '+8.4%',
              ctr: '3.8%',
              ctrChange: '-0.3%',
              costPerClick: '$0.20',
              costPerClickChange: '+5.2%'
            },
            performanceData: [
              { date: 'May 1', impressions: 12000, clicks: 450 },
              { date: 'May 5', impressions: 18000, clicks: 620 },
              { date: 'May 10', impressions: 22000, clicks: 780 },
              { date: 'May 15', impressions: 34000, clicks: 1200 },
              { date: 'May 20', impressions: 42000, clicks: 1500 },
              { date: 'May 25', impressions: 38000, clicks: 1300 },
              { date: 'May 30', impressions: 46000, clicks: 1650 },
            ],
            adSpendData: [
              { date: 'May 1', spend: 120 },
              { date: 'May 5', spend: 180 },
              { date: 'May 10', spend: 240 },
              { date: 'May 15', spend: 360 },
              { date: 'May 20', spend: 420 },
              { date: 'May 25', spend: 380 },
              { date: 'May 30', spend: 450 },
            ],
            campaigns: [
              {
                id: '123456789',
                name: 'Summer Collection Launch',
                status: 'ACTIVE',
                objective: 'REACH',
                budget: 50,
                spend: '$350.45',
                impressions: '45,678',
                clicks: '1,234',
                ctr: '2.7%',
                startDate: '2023-05-01',
                endDate: '2023-05-31'
              },
              {
                id: '987654321',
                name: 'New Product Awareness',
                status: 'PAUSED',
                objective: 'AWARENESS',
                budget: 30,
                spend: '$125.67',
                impressions: '23,456',
                clicks: '876',
                ctr: '3.7%',
                startDate: '2023-05-10',
                endDate: '2023-05-20'
              },
              {
                id: '456789123',
                name: 'Website Traffic Campaign',
                status: 'ACTIVE',
                objective: 'TRAFFIC',
                budget: 75,
                spend: '$540.23',
                impressions: '65,432',
                clicks: '2,345',
                ctr: '3.6%',
                startDate: '2023-05-15',
                endDate: '2023-06-15'
              }
            ],
            adSets: [],
            ads: []
          });
        } else if (platform === 'tiktok') {
          // Get actual token if available
          const tikTokToken = getSavedTikTokToken();
          
          // In a real implementation, use the token to fetch data
          console.log(`Using TikTok token: ${tikTokToken?.access_token?.substring(0, 10)}...`);
          
          setData({
            metrics: {
              spend: '$1,780.45',
              spendChange: '+24.3%',
              impressions: '542,123',
              impressionsChange: '+32.1%',
              clicks: '18,765',
              clicksChange: '+15.7%',
              ctr: '3.5%',
              ctrChange: '+0.6%',
              costPerClick: '$0.09',
              costPerClickChange: '-3.4%'
            },
            performanceData: [
              { date: 'May 1', impressions: 20000, clicks: 720 },
              { date: 'May 5', impressions: 30000, clicks: 1050 },
              { date: 'May 10', impressions: 38000, clicks: 1350 },
              { date: 'May 15', impressions: 54000, clicks: 1890 },
              { date: 'May 20', impressions: 68000, clicks: 2380 },
              { date: 'May 25', impressions: 76000, clicks: 2650 },
              { date: 'May 30', impressions: 85000, clicks: 2980 },
            ],
            adSpendData: [
              { date: 'May 1', spend: 90 },
              { date: 'May 5', spend: 150 },
              { date: 'May 10', spend: 210 },
              { date: 'May 15', spend: 280 },
              { date: 'May 20', spend: 330 },
              { date: 'May 25', spend: 370 },
              { date: 'May 30', spend: 420 },
            ],
            campaigns: [
              {
                id: 'tik123456789',
                name: 'TikTok Dance Challenge',
                status: 'ACTIVE',
                objective: 'VIDEO_VIEWS',
                budget: 40,
                spend: '$320.45',
                impressions: '78,912',
                clicks: '3,456',
                ctr: '4.4%',
                startDate: '2023-05-05',
                endDate: '2023-05-25'
              },
              {
                id: 'tik987654321',
                name: 'UGC Campaign',
                status: 'ACTIVE',
                objective: 'CONVERSION',
                budget: 60,
                spend: '$450.78',
                impressions: '92,345',
                clicks: '4,123',
                ctr: '4.5%',
                startDate: '2023-05-12',
                endDate: '2023-06-02'
              }
            ],
            adSets: [],
            ads: []
          });
        }
      } catch (err: any) {
        console.error(`Error fetching ${platform} paid reporting data:`, err);
        setError(err.message || `Failed to fetch ${platform} reporting data`);
      }
    };

    fetchPaidData();
  }, [platform, timeRange]);

  return { data, error, isConnected };
};
