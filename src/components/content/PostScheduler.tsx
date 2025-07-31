import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Clock, Send, Image, Link, Instagram, Youtube, Linkedin, Twitter, Facebook, Upload, AlertTriangle, Settings, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AyrshareAuth } from './AyrshareAuth';

interface ConnectedProfile {
  platform: string;
  username: string;
  profileKey: string;
  status: string;
}

interface PostSchedulerProps {
  onPostScheduled?: () => void;
}

export function PostScheduler({ onPostScheduled }: PostSchedulerProps) {
  const [postContent, setPostContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram']);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [shortenLinks, setShortenLinks] = useState(true);
  const [isScheduling, setIsScheduling] = useState(false);
  const [showAuthSetup, setShowAuthSetup] = useState(false);
  const [connectedProfiles, setConnectedProfiles] = useState<ConnectedProfile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setIsLoadingProfiles(true);
    try {
      const { data, error } = await supabase.functions.invoke('ayrshare-auth', {
        body: { action: 'get_profiles' }
      });

      if (error) throw error;

      if (data.success) {
        setConnectedProfiles(data.profiles || []);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  const isAnyPlatformConnected = () => {
    return connectedProfiles.length > 0;
  };

  const isPlatformConnected = (platformId: string) => {
    return connectedProfiles.some(profile => 
      profile.platform.toLowerCase() === platformId.toLowerCase() && 
      profile.status === 'active'
    );
  };

  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: Instagram, gradient: 'from-purple-500 to-pink-500' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, gradient: 'from-blue-500 to-blue-600' },
    { id: 'twitter', name: 'Twitter', icon: Twitter, gradient: 'from-sky-400 to-blue-500' },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, gradient: 'from-blue-600 to-blue-700' },
    { id: 'youtube', name: 'YouTube', icon: Youtube, gradient: 'from-red-500 to-red-600' },
    { id: 'tiktok', name: 'TikTok', icon: () => <div className="text-sm font-bold">♪</div>, gradient: 'from-black to-gray-800' }
  ];

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setMediaFiles(Array.from(e.target.files));
    }
  };

  const schedulePost = async () => {
    if (!postContent.trim()) {
      toast({
        title: "Content required",
        description: "Please enter post content",
        variant: "destructive"
      });
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast({
        title: "Platform required",
        description: "Please select at least one platform",
        variant: "destructive"
      });
      return;
    }

    // Check if selected platforms are connected
    const unconnectedPlatforms = selectedPlatforms.filter(platform => !isPlatformConnected(platform));
    if (unconnectedPlatforms.length > 0) {
      toast({
        title: "Platforms not connected",
        description: `Please connect: ${unconnectedPlatforms.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    setIsScheduling(true);

    try {
      let mediaUrls: string[] = [];

      // Upload media files if any
      if (mediaFiles.length > 0) {
        for (const file of mediaFiles) {
          const fileName = `${Date.now()}-${file.name}`;
          const { data, error } = await supabase.storage
            .from('project-files')
            .upload(fileName, file);

          if (error) throw error;

          const { data: { publicUrl } } = supabase.storage
            .from('project-files')
            .getPublicUrl(fileName);

          mediaUrls.push(publicUrl);
        }
      }

      // Prepare schedule date/time
      let scheduleDatetime = null;
      if (scheduleDate && scheduleTime) {
        scheduleDatetime = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      }

      // Call Ayrshare API
      const { data, error } = await supabase.functions.invoke('ayrshare-post-schedule', {
        body: {
          action: 'schedule_post',
          post: postContent,
          platforms: selectedPlatforms,
          scheduleDate: scheduleDatetime,
          mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
          shortenLinks
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to schedule post');
      }

      toast({
        title: "Post scheduled successfully!",
        description: scheduleDatetime 
          ? `Post will be published on ${new Date(scheduleDatetime).toLocaleString()}`
          : "Post has been published immediately"
      });

      // Reset form
      setPostContent('');
      setSelectedPlatforms(['instagram']);
      setScheduleDate('');
      setScheduleTime('');
      setMediaFiles([]);

      onPostScheduled?.();

    } catch (error: any) {
      console.error('Error scheduling post:', error);
      
      // Check if it's an authentication error from Ayrshare
      if (error.message.includes('authentication') || error.message.includes('connect')) {
        toast({
          title: "Social Media Authentication Required",
          description: "Please connect your social media accounts in Ayrshare dashboard first",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Failed to schedule post",
          description: error.message || "An unexpected error occurred",
          variant: "destructive"
        });
      }
    } finally {
      setIsScheduling(false);
    }
  };

  const getCharacterCount = () => {
    const maxLengths: Record<string, number> = {
      twitter: 280,
      instagram: 2200,
      facebook: 63206,
      linkedin: 1300,
      youtube: 5000,
      tiktok: 300
    };

    return selectedPlatforms.map(platform => ({
      platform,
      count: postContent.length,
      max: maxLengths[platform] || 1000,
      isOver: postContent.length > (maxLengths[platform] || 1000)
    }));
  };

  return (
    <Card className="w-full border-0 shadow-lg bg-gradient-to-br from-background to-muted/50">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-lg">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Schedule Social Media Post
        </CardTitle>
        <CardDescription>
          Create and schedule posts across multiple social media platforms
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Connected Accounts Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Connected Accounts</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadProfiles}
                disabled={isLoadingProfiles}
                className="h-8"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingProfiles ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <Settings className="h-3 w-3 mr-1" />
                    Manage
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Manage Social Media Accounts</DialogTitle>
                    <DialogDescription>
                      Connect and manage your social media accounts for posting
                    </DialogDescription>
                  </DialogHeader>
                  <AyrshareAuth onAuthChange={loadProfiles} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {isLoadingProfiles ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading connected accounts...
            </div>
          ) : connectedProfiles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {connectedProfiles.map((profile, index) => (
                <div key={index} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                  {profile.status === 'active' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm font-medium">{profile.platform}</span>
                  <span className="text-xs text-muted-foreground">@{profile.username}</span>
                </div>
              ))}
            </div>
          ) : (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No connected accounts found. Use the "Manage" button above to connect your social media accounts.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Platform Selection */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Select Platforms</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              const isSelected = selectedPlatforms.includes(platform.id);
              const isConnected = isPlatformConnected(platform.id);
              
              return (
                <Button
                  key={platform.id}
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => togglePlatform(platform.id)}
                  className={`relative flex flex-col items-center gap-2 p-4 h-auto ${
                    isSelected 
                      ? `bg-gradient-to-r ${platform.gradient} text-white border-0` 
                      : 'hover:bg-muted'
                  } ${!isConnected ? 'opacity-60' : ''}`}
                >
                  <div className="relative">
                    <Icon className="h-5 w-5" />
                    {isConnected ? (
                      <CheckCircle className="absolute -top-1 -right-1 h-3 w-3 text-green-500 bg-white rounded-full" />
                    ) : (
                      <XCircle className="absolute -top-1 -right-1 h-3 w-3 text-red-500 bg-white rounded-full" />
                    )}
                  </div>
                  <span className="text-xs font-medium">{platform.name}</span>
                  {!isConnected && (
                    <span className="text-xs opacity-75">Not connected</span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Post Content */}
        <div className="space-y-3">
          <Label htmlFor="content" className="text-base font-semibold">Post Content</Label>
          <Textarea
            id="content"
            placeholder="What do you want to share?"
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            className="min-h-32 text-base"
          />
          
          {/* Character Count */}
          {postContent && (
            <div className="flex flex-wrap gap-2">
              {getCharacterCount().map(({ platform, count, max, isOver }) => (
                <Badge 
                  key={platform} 
                  variant={isOver ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {platform}: {count}/{max}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Media Upload */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Media (Optional)</Label>
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleMediaUpload}
              className="hidden"
              id="media-upload"
            />
            <Label htmlFor="media-upload" className="cursor-pointer">
              <Button variant="outline" className="flex items-center gap-2" asChild>
                <span>
                  <Upload className="h-4 w-4" />
                  Upload Media
                </span>
              </Button>
            </Label>
            {mediaFiles.length > 0 && (
              <Badge variant="secondary">
                {mediaFiles.length} file{mediaFiles.length > 1 ? 's' : ''} selected
              </Badge>
            )}
          </div>
        </div>

        {/* Schedule Options */}
        <Tabs defaultValue="now" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="now">Post Now</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>
          
          <TabsContent value="schedule" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Additional Options */}
        <div className="flex items-center space-x-2">
          <Switch
            id="shorten-links"
            checked={shortenLinks}
            onCheckedChange={setShortenLinks}
          />
          <Label htmlFor="shorten-links" className="text-sm">
            Automatically shorten links
          </Label>
        </div>

        {/* Schedule Button */}
        <Button 
          onClick={schedulePost} 
          disabled={isScheduling || !postContent.trim() || selectedPlatforms.length === 0}
          className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white py-3 text-lg"
        >
          {isScheduling ? (
            <>
              <Clock className="mr-2 h-5 w-5 animate-spin" />
              Scheduling...
            </>
          ) : scheduleDate && scheduleTime ? (
            <>
              <Calendar className="mr-2 h-5 w-5" />
              Schedule Post
            </>
          ) : (
            <>
              <Send className="mr-2 h-5 w-5" />
              Post Now
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}