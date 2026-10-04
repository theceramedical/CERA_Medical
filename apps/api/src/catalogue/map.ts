import { ServiceSchema, type Service } from '@cera/contracts';
import { toPublicService, type PublicService } from '@cera/contracts/projections';

import type { VendureProduct } from './types.ts';

/**
 * Maps a Vendure Shop API product onto `ServiceSchema`.
 *
 * `internalNotes` is dropped here even if a future schema leak returned it:
 * the public projection must never carry staff context. `displayPrice` stays a
 * string. `enabled: false` becomes `inactive`.
 */
export function mapVendureProduct(product: VendureProduct): Service {
  const collection = product.collections?.[0];
  const variant = product.variants?.items[0];
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
  return toPublicService(service);
}
