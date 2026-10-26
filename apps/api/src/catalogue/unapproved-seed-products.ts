/**
 * Prototype physical SKUs shipped by the original catalogue seed. The client
 * supplied a research-service brief, not product specifications, prices, stock
 * or shipping approval. Keep these exact prototype SKUs off the public API and
 * checkout until real products are entered with approved identifiers in Vendure.
 */
const UNAPPROVED_SEED_SKUS = new Set([
  'CERA-GLIO-01',
  'CR-CEL-3091',
  'CR-CEL-8402',
  'CR-MOL-1021',
  'CR-MOL-2045',
  'CR-MOL-3012',
  'CR-PRE-5510',
  'CR-REG-1180',
]);

const ENQUIRY_ONLY_PHYSICAL_SKUS = new Set([
  ...UNAPPROVED_SEED_SKUS,
  'CR-MOL-1021',
  'CR-MOL-2045',
  'CR-MOL-3012',
  'CR-PRE-5510',
  'CR-REG-1180',
]);

export function isUnapprovedSeedProductSku(sku: string): boolean {
  return UNAPPROVED_SEED_SKUS.has(sku.trim().toUpperCase());
}

export function isHeldGlioblastomaCohort(sku: string, title: string): boolean {
  return isUnapprovedSeedProductSku(sku) || /CERA-GLIO-01/i.test(title);
}

export function isEnquiryOnlyPhysicalSku(sku: string): boolean {
  return ENQUIRY_ONLY_PHYSICAL_SKUS.has(sku.trim().toUpperCase());
}
