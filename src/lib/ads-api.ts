
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
  removeTikTokToken
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
  uploadMetaCreative,
  hasMetaToken,
  getSavedMetaToken,
  removeMetaToken,
  saveMetaToken
} from './api/meta-api';
