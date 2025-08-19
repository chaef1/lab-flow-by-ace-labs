import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Heart, 
  Eye, 
  MessageCircle, 
  TrendingUp,
  Calendar,
  Mail,
  ExternalLink,
  CheckCircle,
  Briefcase
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { CreatorProfileData } from '@/hooks/useCreatorProfile';
import { LoadingSpinner } from './LoadingSpinner';

interface CreatorProfileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  profileData?: CreatorProfileData | null;
  isLoading: boolean;
  error?: any;
}

export const CreatorProfileSheet: React.FC<CreatorProfileSheetProps> = ({
  isOpen,
  onClose,
  profileData,
  isLoading,
  error,
}) => {
  if (!profileData && !isLoading) return null;

  const creator = profileData?.creator;

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'instagram': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'youtube': return 'bg-red-600';
      case 'tiktok': return 'bg-black';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Failed to load profile data</p>
          </div>
        ) : creator ? (
          <>
            <SheetHeader className="pb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={creator.profilePicUrl} alt={creator.username} />
                    <AvatarFallback>
                      {creator.username?.slice(1, 3).toUpperCase() || 'CR'}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${getPlatformColor(creator.platform)} flex items-center justify-center`}>
                    <span className="text-white text-xs font-bold">
                      {creator.platform[0]?.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <SheetTitle className="text-xl">{creator.username}</SheetTitle>
                    {creator.isVerified && (
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                    )}
                    {creator.hasContactDetails && (
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  
                  {creator.fullName && (
                    <SheetDescription className="text-base">
                      {creator.fullName}
                    </SheetDescription>
                  )}
                  
                  <Badge variant="outline" className="mt-2 capitalize">
                    {creator.platform}
                  </Badge>
                </div>
              </div>
            </SheetHeader>

            <div className="space-y-6">
              {/* Key Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Key Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                      <div className="text-2xl font-bold">{formatNumber(creator.followers || 0)}</div>
                      <div className="text-sm text-muted-foreground">Followers</div>
                    </div>
                    
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <Heart className="w-6 h-6 mx-auto mb-2 text-red-500" />
                      <div className="text-2xl font-bold text-red-500">
                        {creator.engagementRate ? `${(creator.engagementRate * 100).toFixed(1)}%` : 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground">Engagement Rate</div>
                    </div>
                    
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <Heart className="w-6 h-6 mx-auto mb-2 text-pink-500" />
                      <div className="text-2xl font-bold">{formatNumber(creator.avgLikes || 0)}</div>
                      <div className="text-sm text-muted-foreground">Avg Likes</div>
                    </div>
                    
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <Eye className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                      <div className="text-2xl font-bold">{formatNumber(creator.avgViews || 0)}</div>
                      <div className="text-sm text-muted-foreground">Avg Views</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Report Data */}
              {profileData?.report && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Profile Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {profileData.report.profile?.following && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Following:</span>
                        <span className="font-semibold">{formatNumber(profileData.report.profile.following)}</span>
                      </div>
                    )}
                    
                    {profileData.report.profile?.posts && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Posts:</span>
                        <span className="font-semibold">{formatNumber(profileData.report.profile.posts)}</span>
                      </div>
                    )}
                    
                    {profileData.report.profile?.engagements && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Engagements:</span>
                        <span className="font-semibold">{formatNumber(profileData.report.profile.engagements)}</span>
                      </div>
                    )}

                    {profileData.report.audience?.countries && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-semibold mb-2">Top Audience Locations</h4>
                          <div className="space-y-2">
                            {profileData.report.audience.countries.slice(0, 3).map((country: any, index: number) => (
                              <div key={index} className="flex justify-between items-center">
                                <span className="text-sm">{country.name || country.code}</span>
                                <span className="text-sm font-medium">{(country.weight * 100).toFixed(1)}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Performance Data */}
              {profileData?.performance && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Recent Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {profileData.performance.summary && (
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-lg font-bold">{formatNumber(profileData.performance.summary.avgLikes || 0)}</div>
                          <div className="text-xs text-muted-foreground">Avg Likes (30d)</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-lg font-bold">{formatNumber(profileData.performance.summary.avgComments || 0)}</div>
                          <div className="text-xs text-muted-foreground">Avg Comments (30d)</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-lg font-bold">{formatNumber(profileData.performance.summary.avgViews || 0)}</div>
                          <div className="text-xs text-muted-foreground">Avg Views (30d)</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-lg font-bold text-primary">
                            {profileData.performance.summary.avgEngagementRate ? 
                              `${(profileData.performance.summary.avgEngagementRate * 100).toFixed(2)}%` : 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground">Avg ER (30d)</div>
                        </div>
                      </div>
                    )}
                    
                    {profileData.performance.summary?.recentTrend && (
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <div className="text-sm font-medium mb-1">Trend</div>
                        <div className={`text-sm ${
                          profileData.performance.summary.recentTrend === 'increasing' ? 'text-green-600' : 
                          profileData.performance.summary.recentTrend === 'decreasing' ? 'text-red-600' : 
                          'text-muted-foreground'
                        }`}>
                          {profileData.performance.summary.recentTrend === 'increasing' && '↗ Engagement is increasing'}
                          {profileData.performance.summary.recentTrend === 'decreasing' && '↘ Engagement is decreasing'}
                          {profileData.performance.summary.recentTrend === 'stable' && '→ Engagement is stable'}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Brand Collaborations */}
              {profileData?.collaborations && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      Brand Collaborations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {profileData.collaborations.summary ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Total Brands:</span>
                          <span className="font-semibold">{profileData.collaborations.summary.totalBrands || 0}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Collaboration Posts:</span>
                          <span className="font-semibold">{profileData.collaborations.summary.totalPosts || 0}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Avg Performance:</span>
                          <span className="font-semibold">
                            {profileData.collaborations.summary.avgPerformance ? 
                              `${(profileData.collaborations.summary.avgPerformance * 100).toFixed(1)}%` : 'N/A'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        No collaboration data available
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* External Links */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-2">
                    <button 
                      className="flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      onClick={() => window.open(`https://${creator.platform}.com/${creator.username}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on {creator.platform}
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
};