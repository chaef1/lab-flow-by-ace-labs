
import { useState } from 'react';

export const useReportingData = () => {
  // Mock data for demonstrations - this would be replaced with API calls in a real application
  const contentPerformanceData = [
    { date: 'May 1', instagram: 2400, tiktok: 1800 },
    { date: 'May 5', instagram: 3200, tiktok: 4800 },
    { date: 'May 10', instagram: 5000, tiktok: 7200 },
    { date: 'May 15', instagram: 4780, tiktok: 8900 },
    { date: 'May 20', instagram: 5890, tiktok: 9100 },
    { date: 'May 25', instagram: 6390, tiktok: 9800 },
    { date: 'May 30', instagram: 7490, tiktok: 12000 },
  ];

  const engagementData = [
    { name: 'Instagram', likes: 4300, comments: 980, shares: 1500 },
    { name: 'TikTok', likes: 9800, comments: 2300, shares: 5400 }
  ];

  const topPerformingContent = [
    {
      id: '1',
      platform: 'Instagram',
      title: 'Product Launch Video',
      creator: 'Sarah Johnson',
      reach: '45.2K',
      engagement: '8.7%',
      date: 'May 15, 2025',
      link: 'https://instagram.com/p/example1'
    },
    {
      id: '2',
      platform: 'TikTok',
      title: 'Brand Challenge',
      creator: 'Mike Chen',
      reach: '120K',
      engagement: '12.3%',
      date: 'May 12, 2025',
      link: 'https://tiktok.com/@example/video2'
    },
    {
      id: '3',
      platform: 'Instagram',
      title: 'Customer Story',
      creator: 'Emma Wilson',
      reach: '38.9K',
      engagement: '7.2%',
      date: 'May 18, 2025',
      link: 'https://instagram.com/p/example3'
    },
    {
      id: '4',
      platform: 'TikTok',
      title: 'Product Tutorial',
      creator: 'Alex Davis',
      reach: '87.5K',
      engagement: '9.8%',
      date: 'May 20, 2025',
      link: 'https://tiktok.com/@example/video4'
    },
    {
      id: '5',
      platform: 'Instagram',
      title: 'Behind the Scenes',
      creator: 'Jordan Smith',
      reach: '29.4K',
      engagement: '6.5%',
      date: 'May 22, 2025',
      link: 'https://instagram.com/p/example5'
    },
  ];

  const creatorStats = [
    {
      id: '1',
      name: 'Sarah Johnson',
      instagram: '@sarahjcreates',
      tiktok: '@sarahj',
      followers: '524K',
      engagement: '8.2%',
      posts: 12,
      performance: 'High'
    },
    {
      id: '2',
      name: 'Mike Chen',
      instagram: '@mikechentech',
      tiktok: '@mikechen',
      followers: '1.2M',
      engagement: '7.8%',
      posts: 9,
      performance: 'High'
    },
    {
      id: '3',
      name: 'Emma Wilson',
      instagram: '@emmawilson',
      tiktok: '@emmadesigns',
      followers: '342K',
      engagement: '5.6%',
      posts: 14,
      performance: 'Medium'
    },
    {
      id: '4',
      name: 'Alex Davis',
      instagram: '@alex.davis',
      tiktok: '@alexd',
      followers: '895K',
      engagement: '9.1%',
      posts: 8,
      performance: 'High'
    },
    {
      id: '5',
      name: 'Jordan Smith',
      instagram: '@jordansmith',
      tiktok: '@jordancreates',
      followers: '267K',
      engagement: '4.9%',
      posts: 11,
      performance: 'Medium'
    },
  ];

  return {
    metrics: {
      reach: '1.42M',
      reachChange: '+12.5%',
      engagement: '8.7%',
      engagementChange: '+2.1%',
      contentCount: 54
    },
    contentPerformanceData,
    engagementData,
    topPerformingContent,
    creatorStats
  };
};
