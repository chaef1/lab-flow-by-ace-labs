
/**
 * Main entry point for advertising API functions
 * This file re-exports all functions from the platform-specific modules
 * for backward compatibility
 */

// Re-export all TikTok functions
export {
  getTikTokAuthUrl,
  exchangeTikTokCode,
  processTikTokAuthCallback,
  getTikTokAdAccounts,
  getTikTokCampaigns,
  createTikTokCampaign,
  hasTikTokToken,
  getSavedTikTokToken,
  removeTikTokToken,
  saveTikTokToken
} from './api/tiktok-api';

// Re-export all Meta functions
export {
  getMetaOAuthUrl,
  exchangeMetaCode,
  processMetaAuthCallback,
  getMetaAdAccounts,
  getMetaCampaigns,
  createMetaCampaign,
  getMetaAudiences,
  createMetaAdSet,
  createMetaAd,
  uploadMetaCreative,
  hasMetaToken,
  getSavedMetaToken,
  removeMetaToken,
  saveMetaToken,
  refreshMetaTokenStatus
} from './api/meta-api';
