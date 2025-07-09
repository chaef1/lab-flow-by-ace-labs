import { useState } from 'react';
import { Search, User, Users, Heart, MessageCircle, Share, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

const ProfileVetting = () => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!username.trim()) {
      toast({
        title: "Please enter a username",
        description: "Enter an Instagram username to analyze their profile.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    // Mock profile data - will be replaced with actual Meta API calls
    setTimeout(() => {
      const mockProfile = {
        username: username,
        displayName: "Sample Creator",
        followers: 125430,
        following: 847,
        posts: 342,
        verified: false,
        bio: "Content creator | Lifestyle & Fashion | Collaboration: email@example.com",
        avatar: "https://randomuser.me/api/portraits/women/45.jpg",
        engagement: {
          rate: 8.5,
          avgLikes: 2340,
          avgComments: 156,
          avgShares: 23
        },
        demographics: {
          ageGroups: {
            "18-24": 35,
            "25-34": 45,
            "35-44": 15,
            "45+": 5
          },
          genders: {
            female: 68,
            male: 32
          },
          topCountries: ["South Africa", "United States", "United Kingdom"]
        },
        authenticity: {
          score: 85,
          fakeFollowers: 12,
          botComments: 5,
          suspicious: false
        },
        recentPosts: [
          { likes: 2850, comments: 189, date: "2024-01-15" },
          { likes: 1920, comments: 134, date: "2024-01-14" },
          { likes: 3240, comments: 201, date: "2024-01-13" }
        ]
      };
      
      setProfileData(mockProfile);
      setIsLoading(false);
      
      toast({
        title: "Profile analysis complete",
        description: `Analysis completed for @${username}`,
      });
    }, 2500);
  };

  const getAuthenticityColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getAuthenticityIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (score >= 60) return <Clock className="h-4 w-4 text-yellow-500" />;
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Vetting & Analysis
          </CardTitle>
          <CardDescription>
            Analyze Instagram profiles to assess authenticity, engagement, and audience demographics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter Instagram username (without @)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? 'Analyzing...' : 'Analyze Profile'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {profileData && (
        <div className="space-y-6">
          {/* Profile Overview */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profileData.avatar} />
                  <AvatarFallback>{profileData.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold">@{profileData.username}</h3>
                    {profileData.verified && <Badge variant="default">Verified</Badge>}
                  </div>
                  <p className="text-lg text-muted-foreground">{profileData.displayName}</p>
                  <p className="text-sm mt-2">{profileData.bio}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">{profileData.followers.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{profileData.following.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Following</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{profileData.posts}</p>
                  <p className="text-sm text-muted-foreground">Posts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Engagement Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Engagement Rate</p>
                    <p className="text-2xl font-bold">{profileData.engagement.rate}%</p>
                  </div>
                  <Heart className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Likes</p>
                    <p className="text-2xl font-bold">{profileData.engagement.avgLikes.toLocaleString()}</p>
                  </div>
                  <Heart className="h-8 w-8 text-pink-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Comments</p>
                    <p className="text-2xl font-bold">{profileData.engagement.avgComments}</p>
                  </div>
                  <MessageCircle className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Shares</p>
                    <p className="text-2xl font-bold">{profileData.engagement.avgShares}</p>
                  </div>
                  <Share className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Authenticity Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getAuthenticityIcon(profileData.authenticity.score)}
                Authenticity Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Authenticity Score</span>
                    <span className={`text-sm font-bold ${getAuthenticityColor(profileData.authenticity.score)}`}>
                      {profileData.authenticity.score}/100
                    </span>
                  </div>
                  <Progress value={profileData.authenticity.score} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Fake Followers</p>
                    <p className="text-lg font-semibold text-red-500">{profileData.authenticity.fakeFollowers}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bot Comments</p>
                    <p className="text-lg font-semibold text-yellow-500">{profileData.authenticity.botComments}%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Demographics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Age Demographics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(profileData.demographics.ageGroups).map(([age, percentage]: [string, number]) => (
                    <div key={age}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">{age}</span>
                        <span className="text-sm font-medium">{percentage}%</span>
                      </div>
                      <Progress value={percentage as number} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gender Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">Female</span>
                      <span className="text-sm font-medium">{profileData.demographics.genders.female}%</span>
                    </div>
                    <Progress value={profileData.demographics.genders.female} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">Male</span>
                      <span className="text-sm font-medium">{profileData.demographics.genders.male}%</span>
                    </div>
                    <Progress value={profileData.demographics.genders.male} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileVetting;