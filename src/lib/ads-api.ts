
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
  createMetaAdCreative,
  getMetaPages,
  getMetaUserPermissions,
  hasMetaToken,
  getSavedMetaToken,
  removeMetaToken,
  saveMetaToken,
  refreshMetaTokenStatus,
  updateMetaCampaignStatus
} from './api/meta-api';

// TikTok advertising functionality removed - use Meta ads API only for advertising
