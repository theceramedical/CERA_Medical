import { ServiceSchema, type Service } from '@cera/contracts';
import {
  PublicProductSchema,
  toPublicService,
  type PublicProduct,
  type PublicService,
} from '@cera/contracts/projections';

import type { VendureProduct } from './types.ts';

export const PHYSICAL_PRODUCTS_COLLECTION_SLUG = 'physical-products';

/**
 * Maps a Vendure Shop API product onto `ServiceSchema`.
 *
 * `internalNotes` is dropped here even if a future schema leak returned it:
 * the public projection must never carry staff context. `displayPrice` stays a
 * string. `enabled: false` becomes `inactive`.
 */
export function mapVendureProduct(product: VendureProduct): Service {
  const collection = product.collections?.[0];
  const variant = product.variants?.[0];
  const listPriceMinor = variant !== undefined && variant.price > 0 ? variant.price : null;

  return ServiceSchema.parse({
    id: product.id,
    slug: product.slug,
    category:
      collection === undefined
        ? null
        : { id: collection.id, slug: collection.slug, title: collection.name },
    title: product.name,
    summary: product.customFields?.shortSummary ?? '',
    description: product.description,
    displayPrice: product.customFields?.displayPriceText ?? null,
    availabilityText: product.customFields?.availabilityText ?? null,
    enquiryEnabled: product.customFields?.enquiryEnabled ?? true,
    checkoutEnabled: product.customFields?.checkoutEnabled ?? true,
    listPriceMinor,
    mediaId: product.featuredAsset?.id ?? null,
    status: product.enabled === false ? 'inactive' : 'active',
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  });
}

export function toListablePublicService(service: Service): PublicService | null {
  if (service.status !== 'active') return null;
  if (service.category?.slug === PHYSICAL_PRODUCTS_COLLECTION_SLUG) return null;
  return toPublicService(service);
}

export function mapVendurePublicProduct(product: VendureProduct): PublicProduct | null {
  const service = mapVendureProduct(product);
  if (service.status !== 'active') return null;
  if (service.category?.slug !== PHYSICAL_PRODUCTS_COLLECTION_SLUG) return null;
  const sku = product.variants?.[0]?.sku ?? service.slug.toUpperCase();
  return PublicProductSchema.parse({
    sku,
    title: service.title,
    summary: service.summary,
    description: service.description,
    displayPrice: service.displayPrice,
    availabilityText: service.availabilityText,
    listPriceMinor: service.listPriceMinor,
    checkoutEnabled: service.checkoutEnabled,
    enquiryEnabled: service.enquiryEnabled,
  });
}

export function productSlugForSku(sku: string): string {
  return sku.trim().toLowerCase();
}
