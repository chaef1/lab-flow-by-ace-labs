
/**
 * Main entry point for advertising API functions
 * This file re-exports all functions from the platform-specific modules
 */

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
  refreshMetaTokenStatus,
  updateMetaCampaignStatus
} from './api/meta-api';

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
  saveTikTokToken,
  removeTikTokToken
} from './api/tiktok-api';
