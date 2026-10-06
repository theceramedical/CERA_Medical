export interface VendureCustomFields {
  readonly availabilityText?: string | null;
  readonly enquiryEnabled?: boolean | null;
  readonly checkoutEnabled?: boolean | null;
  readonly displayPriceText?: string | null;
  readonly shortSummary?: string | null;
  readonly internalNotes?: string | null;
}

export interface VendureVariant {
  readonly id: string;
  readonly sku: string;
  readonly price: number;
  readonly priceWithTax: number;
}

export interface VendureProduct {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly enabled?: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly featuredAsset?: { readonly id: string; readonly preview?: string | null } | null;
  readonly collections?: readonly {
    readonly id: string;
    readonly slug: string;
    readonly name: string;
  }[];
  readonly customFields?: VendureCustomFields | null;
  readonly variants?: readonly VendureVariant[];
}
