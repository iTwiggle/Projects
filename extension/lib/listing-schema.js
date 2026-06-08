/** @typedef {"low" | "medium" | "high"} FieldConfidence */

/**
 * @typedef {Object} MarketplaceListingCaptureConfidence
 * @property {FieldConfidence} [title]
 * @property {FieldConfidence} [askingPrice]
 * @property {FieldConfidence} [description]
 * @property {FieldConfidence} [imageUrl]
 * @property {FieldConfidence} [listingUrl]
 */

/**
 * @typedef {Object} CapturedMarketplaceListing
 * @property {string} [title]
 * @property {number | null} [askingPrice]
 * @property {string} [description]
 * @property {string} [imageUrl]
 * @property {string} listingUrl
 * @property {string} rawText
 * @property {string} capturedAt
 * @property {MarketplaceListingCaptureConfidence} confidence
 */

/**
 * @typedef {Object} MarketplaceListingCaptureBatch
 * @property {string} schemaVersion
 * @property {"extension"} source
 * @property {string} platform
 * @property {string} capturedAt
 * @property {string} pageUrl
 * @property {CapturedMarketplaceListing} listing
 * @property {boolean} [selectorFallback]
 */

export const MARKETPLACE_LISTING_CAPTURE_SCHEMA_VERSION = "1.0";
export const PLATFORM_FACEBOOK = "Facebook Marketplace";
