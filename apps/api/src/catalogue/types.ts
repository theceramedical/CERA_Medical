export interface VendureCustomFields {
  readonly availabilityText?: string | null;
  readonly enquiryEnabled?: boolean | null;
  readonly displayPriceText?: string | null;
  readonly shortSummary?: string | null;
  readonly internalNotes?: string | null;
}

export interface VendureProduct {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly enabled?: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly featuredAsset?: { readonly id: string } | null;
  readonly collections?: readonly {
    readonly id: string;
    readonly slug: string;
    readonly name: string;
  }[];
  readonly customFields?: VendureCustomFields | null;
}
