
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders, formatResponse } from "../_shared/utils.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, contentUrl, accessToken, contentType } = await req.json();
    console.log(`Processing ${action} with contentType: ${contentType}, url: ${contentUrl.substring(0, 30)}...`);

    // Create authenticated Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    if (action === 'fetch_content_data') {
      // Get access token from the current user's Meta connection if not provided
      let metaAccessToken = accessToken;
      
      if (!metaAccessToken) {
        // Try to retrieve the saved access token
        const { data: savedTokenData, error: tokenError } = await supabase
          .from('meta_tokens')
          .select('access_token')
          .eq('valid', true)
          .limit(1)
          .single();
          
        if (tokenError) {
          return formatResponse({ error: 'No valid Meta access token found' }, 400);
        }
        
        metaAccessToken = savedTokenData.access_token;
      }
      
      console.log('Making request to Facebook Graph API with token:', metaAccessToken?.substring(0, 5) + '...');
      
      // Extract content ID from URL
      const contentId = extractContentIdFromUrl(contentUrl, contentType);
      
      if (!contentId) {
        return formatResponse({ 
          error: 'Could not extract content ID from the provided URL',
          url: contentUrl,
          type: contentType
        }, 400);
      }
      
      try {
        // Determine fields to fetch based on content type
        let fields = 'id,permalink_url,message,created_time';
        
        if (contentType === 'post') {
          fields += ',attachments,comments.limit(0).summary(true),reactions.limit(0).summary(true),shares';
        } else if (contentType === 'reel') {
          fields += ',comments.limit(0).summary(true),reactions.limit(0).summary(true),video_views';
        } else if (contentType === 'story') {
          fields += ',attachments,story_card_info';
        }
        
        // Fetch content data from Facebook Graph API
        const apiUrl = `https://graph.facebook.com/v19.0/${contentId}?fields=${fields}&access_token=${metaAccessToken}`;
        const contentResponse = await fetch(apiUrl);
        const contentData = await contentResponse.json();
        
        // If the content has an error, handle it
        if (contentData.error) {
          console.error('Facebook Graph API Error:', contentData.error);
          
          // If the error is due to permissions, try another approach
          if (contentData.error.code === 100) {
            // Try to get the content from Instagram Business Account if the content is from Instagram
            if (contentType === 'reel' || contentUrl.includes('instagram.com')) {
              const igResult = await fetchInstagramBusinessContent(metaAccessToken, contentUrl);
              if (igResult.success) {
                return formatResponse(igResult);
              }
            }
            
            // Generate mock data for demonstration
            return formatResponse({
              success: false,
              error: contentData.error.message,
              note: "This content may require additional permissions. Please ensure your Facebook app has the necessary permissions for this content type."
            }, 400);
          }
          
          return formatResponse({
            error: contentData.error.message || 'Error fetching content data'
          }, 400);
        }
        
        // Get user/page info to enrich the content data
        let userInfo = {};
        try {
          const userApiUrl = `https://graph.facebook.com/v19.0/${contentData.from?.id || contentId.split('_')[0]}?fields=name,username,profile_picture,fan_count,followers_count&access_token=${metaAccessToken}`;
          const userResponse = await fetch(userApiUrl);
          userInfo = await userResponse.json();
        } catch (userErr) {
          console.log('Error fetching user data, continuing with content only:', userErr);
        }
        
        // Prepare the report data
        const reportData = {
          content_id: contentId,
          content_url: contentData.permalink_url || contentUrl,
          content_type: contentType,
          profile_data: userInfo || {},
          message: contentData.message || '',
          created_time: contentData.created_time,
          engagement_data: {
            comments: contentData.comments?.summary?.total_count || 0,
            reactions: contentData.reactions?.summary?.total_count || 0,
            shares: contentData.shares?.count || 0,
            views: contentData.video_views || 0
          },
          raw_data: contentData,
          fetched_at: new Date().toISOString()
        };
        
        // Save report to database
        const { data: savedReport, error: saveError } = await supabase
          .from('facebook_content_reports')
          .insert(reportData)
          .select('id')
          .single();
          
        if (saveError) {
          console.error('Error saving report to database:', saveError);
          // Continue and return the data even if saving fails
        }
        
        return formatResponse({
          success: true,
          data: reportData,
          report_id: savedReport?.id || null
        });
        
      } catch (apiError) {
        console.error('Error calling Facebook API:', apiError);
        
        return formatResponse({
          error: apiError.message || 'Error fetching content data'
        }, 500);
      }
    }
    
    return formatResponse({
      error: 'Unknown action'
    }, 400);
  } catch (error) {
    console.error('Error:', error);
    return formatResponse({
      error: error.message || 'Unknown error occurred'
    }, 500);
  }
});

// Helper function to extract content ID from Facebook/Instagram URL
function extractContentIdFromUrl(url: string, contentType: string): string | null {
  // Try to match Facebook post ID patterns
  if (url.includes('facebook.com')) {
    // Posts like: https://www.facebook.com/username/posts/12345
    const postMatch = url.match(/\/posts\/(\d+)/);
    if (postMatch) return postMatch[1];
    
    // Photos like: https://www.facebook.com/photo.php?fbid=12345
    const photoMatch = url.match(/fbid=(\d+)/);
    if (photoMatch) return photoMatch[1];
    
    // Videos like: https://www.facebook.com/watch/?v=12345
    const videoMatch = url.match(/watch\/\?v=(\d+)/);
    if (videoMatch) return videoMatch[1];
    
    // Page posts like: https://www.facebook.com/pagename/photos/a.123/456
    const pagePostMatch = url.match(/\/([^\/]+)\/(?:photos|videos)\/(?:a\.\d+\/)?(\d+)/);
    if (pagePostMatch) {
      const pageId = pagePostMatch[1];
      const contentId = pagePostMatch[2];
      return `${pageId}_${contentId}`;
    }
  }
  
  // Instagram content requires a different approach - typically uses Instagram Graph API
  if (url.includes('instagram.com')) {
    // For Instagram content, we can extract the shortcode
    const match = url.match(/\/p\/([^\/]+)\/|\/reel\/([^\/]+)\//);
    return match ? (match[1] || match[2]) : null;
  }
  
  return null;
}

// Helper function to try fetching content from Instagram Business Account
async function fetchInstagramBusinessContent(accessToken: string, contentUrl: string) {
  try {
    // First get the Instagram Business Account ID
    const accountsUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=instagram_business_account&access_token=${accessToken}`;
    const accountsResponse = await fetch(accountsUrl);
    const accountsData = await accountsResponse.json();
    
    if (accountsData.error || !accountsData.data || !accountsData.data[0]?.instagram_business_account?.id) {
      return { success: false, error: 'No Instagram Business Account found' };
    }
    
    const igBusinessId = accountsData.data[0].instagram_business_account.id;
    
    // Get media from the IG Business Account
    const mediaUrl = `https://graph.facebook.com/v19.0/${igBusinessId}/media?fields=id,caption,media_type,permalink,thumbnail_url,media_url,like_count,comments_count&access_token=${accessToken}`;
    const mediaResponse = await fetch(mediaUrl);
    const mediaData = await mediaResponse.json();
    
    if (mediaData.error || !mediaData.data) {
      return { success: false, error: 'Could not fetch Instagram Business media' };
    }
    
    // Find the media that matches the content URL
    const igContent = mediaData.data.find((media: any) => 
      contentUrl.includes(media.permalink) || 
      media.permalink.includes(extractContentIdFromUrl(contentUrl, 'reel'))
    );
    
    if (!igContent) {
      return { success: false, error: 'Content not found in Instagram Business Account' };
    }
    
    return { 
      success: true,
      data: {
        content_id: igContent.id,
        content_url: igContent.permalink,
        content_type: igContent.media_type.toLowerCase(),
        profile_data: {
          username: 'instagram_business_account'
        },
        message: igContent.caption || '',
        created_time: igContent.timestamp,
        engagement_data: {
          comments: igContent.comments_count || 0,
          reactions: igContent.like_count || 0,
          shares: 0,
          views: 0
        },
        raw_data: igContent,
        fetched_at: new Date().toISOString()
      }
    };
    
  } catch (err) {
    console.error('Error fetching Instagram Business content:', err);
    return { success: false, error: 'Error fetching Instagram Business content' };
  }
}
