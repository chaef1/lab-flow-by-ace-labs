
/**
 * Token storage utilities for TikTok and Meta advertising platforms
 * Handles saving, retrieving, and managing authentication tokens
 */

// TikTok Token Handling Functions

// Save TikTok access token to localStorage with expiration handling
export const saveTikTokToken = (token: string, advertiserId: string = '') => {
  try {
    if (!token) {
      console.error('Cannot save empty token');
      return false;
    }
    
    // Current timestamp plus 30 days (in milliseconds) - extended for better persistence
    const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000);
    
    const tokenData = {
      token,
      advertiserId,
      expiresAt,
      lastUsed: Date.now()
    };
    
    console.log('Saving TikTok token data:', { 
      tokenPreview: token.substring(0, 5) + '...', 
      advertiserId, 
      expiresAt,
      lastUsed: new Date().toISOString()
    });
    
    // Use a more consistent key name
    localStorage.setItem('tiktok_auth_data', JSON.stringify(tokenData));
    return true;
  } catch (error) {
    console.error('Error saving TikTok token:', error);
    return false;
  }
};

// Get saved TikTok access token
export const getSavedTikTokToken = () => {
  try {
    // Use the consistent key name
    const tokenDataStr = localStorage.getItem('tiktok_auth_data');
    console.log('Retrieved token data string exists:', !!tokenDataStr);
    
    if (!tokenDataStr) {
      return { accessToken: null, advertiserId: null };
    }
    
    const tokenData = JSON.parse(tokenDataStr);
    
    // Handle malformed token data
    if (!tokenData || typeof tokenData !== 'object') {
      console.error('Malformed token data in localStorage');
      localStorage.removeItem('tiktok_auth_data');
      return { accessToken: null, advertiserId: null };
    }
    
    console.log('Parsed token data:', { 
      hasToken: !!tokenData.token, 
      hasAdvertiserId: !!tokenData.advertiserId,
      expiresAt: tokenData.expiresAt ? new Date(tokenData.expiresAt).toISOString() : 'not set',
      isExpired: tokenData.expiresAt && tokenData.expiresAt < Date.now()
    });
    
    // Check if token has expired
    if (tokenData.expiresAt && tokenData.expiresAt < Date.now()) {
      // Token expired, remove it
      console.log('Token expired, removing');
      removeTikTokToken();
      return { accessToken: null, advertiserId: null };
    }
    
    // Update the last used timestamp
    if (tokenData.token) {
      tokenData.lastUsed = Date.now();
      localStorage.setItem('tiktok_auth_data', JSON.stringify(tokenData));
    }
    
    return { 
      accessToken: tokenData.token,
      advertiserId: tokenData.advertiserId
    };
  } catch (err) {
    console.error('Error parsing TikTok token data:', err);
    return { accessToken: null, advertiserId: null };
  }
};

// Check if the TikTok token is saved and valid
export const hasTikTokToken = () => {
  const { accessToken } = getSavedTikTokToken();
  return !!accessToken;
};

// Remove TikTok token from storage
export const removeTikTokToken = () => {
  try {
    // Use the consistent key name
    localStorage.removeItem('tiktok_auth_data');
    // Also remove any legacy keys
    localStorage.removeItem('tiktok_auth');
    localStorage.removeItem('tiktok_auth_code');
    console.log('TikTok token removed from storage');
    return true;
  } catch (error) {
    console.error('Error removing TikTok token:', error);
    return false;
  }
};

// Meta Token Handling Functions

// Save Meta access token to localStorage with expiration handling
export const saveMetaToken = (token: string, accountId: string = '') => {
  try {
    if (!token) {
      console.error('Cannot save empty Meta token');
      return false;
    }
    
    // Current timestamp plus 60 days (in milliseconds) - Meta tokens have longer validity
    const expiresAt = Date.now() + (60 * 24 * 60 * 60 * 1000);
    
    const tokenData = {
      token,
      accountId,
      expiresAt,
      lastUsed: Date.now()
    };
    
    console.log('Saving Meta token data:', { 
      tokenPreview: token.substring(0, 5) + '...', 
      accountId, 
      expiresAt: new Date(expiresAt).toISOString(),
      lastUsed: new Date().toISOString()
    });
    
    localStorage.setItem('meta_auth_data', JSON.stringify(tokenData));
    
    // Also trigger event for listeners to pick up the token change
    window.dispatchEvent(new Event('meta_auth_changed'));
    
    return true;
  } catch (error) {
    console.error('Error saving Meta token:', error);
    return false;
  }
};

// Get saved Meta access token
export const getSavedMetaToken = () => {
  try {
    const tokenDataStr = localStorage.getItem('meta_auth_data');
    console.log('Retrieved Meta token data string exists:', !!tokenDataStr);
    
    if (!tokenDataStr) {
      return { accessToken: null, accountId: null };
    }
    
    const tokenData = JSON.parse(tokenDataStr);
    
    // Handle malformed token data
    if (!tokenData || typeof tokenData !== 'object') {
      console.error('Malformed Meta token data in localStorage');
      localStorage.removeItem('meta_auth_data');
      return { accessToken: null, accountId: null };
    }
    
    console.log('Parsed Meta token data:', { 
      hasToken: !!tokenData.token, 
      hasAccountId: !!tokenData.accountId,
      expiresAt: tokenData.expiresAt ? new Date(tokenData.expiresAt).toISOString() : 'not set',
      isExpired: tokenData.expiresAt && tokenData.expiresAt < Date.now()
    });
    
    // Check if token has expired
    if (tokenData.expiresAt && tokenData.expiresAt < Date.now()) {
      // Token expired, remove it
      console.log('Meta token expired, removing');
      removeMetaToken();
      return { accessToken: null, accountId: null };
    }
    
    // Update the last used timestamp
    if (tokenData.token) {
      tokenData.lastUsed = Date.now();
      localStorage.setItem('meta_auth_data', JSON.stringify(tokenData));
    }
    
    return { 
      accessToken: tokenData.token,
      accountId: tokenData.accountId
    };
  } catch (err) {
    console.error('Error parsing Meta token data:', err);
    return { accessToken: null, accountId: null };
  }
};

// Check if Meta token is saved and valid
export const hasMetaToken = () => {
  const { accessToken } = getSavedMetaToken();
  console.log('Checking Meta token availability:', !!accessToken);
  return !!accessToken;
};

// Remove Meta token from storage
export const removeMetaToken = () => {
  try {
    localStorage.removeItem('meta_auth_data');
    console.log('Meta token removed from storage');
    
    // Trigger event for listeners
    window.dispatchEvent(new Event('meta_auth_changed'));
    
    return true;
  } catch (error) {
    console.error('Error removing Meta token:', error);
    return false;
  }
};

// Function to force token refresh check
export const refreshMetaTokenStatus = () => {
  const { accessToken } = getSavedMetaToken();
  console.log('Force refreshing Meta token status, token exists:', !!accessToken);
  
  // Dispatch event to notify listeners of potential token change
  window.dispatchEvent(new Event('meta_auth_changed'));
  
  return !!accessToken;
};
