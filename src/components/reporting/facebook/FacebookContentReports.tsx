
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader, ExternalLink } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getSavedMetaToken } from "@/lib/storage/token-storage";

type ContentType = 'post' | 'reel' | 'story';

interface ReportData {
  content_id: string;
  content_url: string;
  content_type: string;
  profile_data: {
    name?: string;
    username?: string;
    profile_picture?: string;
    fan_count?: number;
    followers_count?: number;
  };
  message: string;
  created_time: string;
  engagement_data: {
    comments: number;
    reactions: number;
    shares: number;
    views: number;
  };
  raw_data: any;
  fetched_at: string;
}

const FacebookContentReports = () => {
  const [contentUrl, setContentUrl] = useState('');
  const [contentType, setContentType] = useState<ContentType>('post');
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const { toast } = useToast();

  const fetchContentReport = async () => {
    if (!contentUrl) {
      toast({
        title: "URL Required",
        description: "Please enter a Facebook or Instagram content URL",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setReport(null);

    try {
      // Get the Meta access token
      const { accessToken } = getSavedMetaToken();

      if (!accessToken) {
        toast({
          title: "Authentication Required",
          description: "Please connect to Meta in the Advertising section first",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Call the edge function to fetch content data
      const { data, error } = await supabase.functions.invoke('facebook-content', {
        body: {
          action: 'fetch_content_data',
          contentUrl,
          contentType,
          accessToken
        }
      });

      if (error || !data.success) {
        throw new Error(error?.message || data?.error || 'Failed to fetch content data');
      }

      console.log('Report data:', data);
      
      // Set the report data
      setReport(data.data);

      toast({
        title: "Report Generated",
        description: "Content report has been successfully generated and saved",
      });
    } catch (error: any) {
      console.error('Error fetching content report:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to fetch content data',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Facebook Content Report</CardTitle>
          <CardDescription>
            Generate a one-time report for specific Facebook or Instagram content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="content-url">Content URL</Label>
              <Input 
                id="content-url"
                placeholder="Paste Facebook or Instagram URL here" 
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Example: https://www.facebook.com/username/posts/123456789
              </p>
            </div>
            
            <div>
              <Label>Content Type</Label>
              <RadioGroup 
                value={contentType} 
                onValueChange={(value) => setContentType(value as ContentType)}
                className="flex space-x-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="post" id="post" />
                  <Label htmlFor="post" className="cursor-pointer">Post</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="reel" id="reel" />
                  <Label htmlFor="reel" className="cursor-pointer">Reel</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="story" id="story" />
                  <Label htmlFor="story" className="cursor-pointer">Story</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={fetchContentReport} 
            disabled={isLoading || !contentUrl}
            className="w-full sm:w-auto"
          >
            {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
            Generate Report
          </Button>
        </CardFooter>
      </Card>

      {report && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Content Report</span>
              <Button variant="outline" size="sm" asChild>
                <a href={report.content_url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                  View Original <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardTitle>
            <CardDescription>
              Report generated on {new Date(report.fetched_at).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Profile Information */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-lg mb-2">Profile Information</h3>
                <div className="flex flex-col md:flex-row gap-4">
                  {report.profile_data.profile_picture && (
                    <img 
                      src={report.profile_data.profile_picture} 
                      alt={report.profile_data.name || 'Profile'} 
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <p className="font-bold">{report.profile_data.name || 'Unknown'}</p>
                    {report.profile_data.username && (
                      <p className="text-sm text-muted-foreground">@{report.profile_data.username}</p>
                    )}
                    <div className="flex gap-4 mt-2">
                      {report.profile_data.followers_count !== undefined && (
                        <div>
                          <p className="font-semibold">{report.profile_data.followers_count.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Followers</p>
                        </div>
                      )}
                      {report.profile_data.fan_count !== undefined && (
                        <div>
                          <p className="font-semibold">{report.profile_data.fan_count.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Page Likes</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Content Information */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-lg mb-2">Content Information</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="capitalize">{report.content_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Posted on</p>
                    <p>{new Date(report.created_time).toLocaleDateString()}</p>
                  </div>
                </div>
                {report.message && (
                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground">Message</p>
                    <p className="whitespace-pre-wrap">{report.message}</p>
                  </div>
                )}
              </div>
              
              {/* Engagement Metrics */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-lg mb-2">Engagement Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted rounded-md">
                    <p className="font-bold text-lg">{report.engagement_data.reactions.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Reactions</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-md">
                    <p className="font-bold text-lg">{report.engagement_data.comments.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Comments</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-md">
                    <p className="font-bold text-lg">{report.engagement_data.shares.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Shares</p>
                  </div>
                  {report.engagement_data.views > 0 && (
                    <div className="text-center p-3 bg-muted rounded-md">
                      <p className="font-bold text-lg">{report.engagement_data.views.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Views</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FacebookContentReports;
