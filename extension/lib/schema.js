/** @typedef {"low" | "medium" | "high"} FieldConfidence */

/**
 * @typedef {Object} CapturedCompConfidence
 * @property {FieldConfidence} [title]
 * @property {FieldConfidence} [price]
 * @property {FieldConfidence} [listingType]
 * @property {FieldConfidence} [platform]
 * @property {FieldConfidence} [condition]
 */

/**
 * @typedef {Object} CapturedComp
 * @property {string} title
 * @property {number} price
 * @property {string} platform
 * @property {"sold" | "listed"} listingType
 * @property {string} [condition]
 * @property {string} [url]
 * @property {string} [imageUrl]
 * @property {string} [capturedAt]
 * @property {string} [rawText]
 * @property {CapturedCompConfidence} [confidence]
 */

/**
 * @typedef {Object} CompCaptureBatch
 * @property {string} schemaVersion
 * @property {"extension"} source
 * @property {string} [platform]
 * @property {string} [searchQuery]
 * @property {string} [capturedAt]
 * @property {string} [pageUrl]
 * @property {CapturedComp[]} comps
 */

export const COMP_CAPTURE_SCHEMA_VERSION = "1.0";

export const PLATFORM_EBAY = "eBay";
