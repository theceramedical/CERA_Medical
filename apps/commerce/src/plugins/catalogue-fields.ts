import { LanguageCode, type CustomFieldConfig } from '@vendure/core';

/**
 * Custom fields on Product (research service lines in Vendure).
 *
 * `displayPriceText` is presentational; the chargeable amount is the default
 * variant price when checkout is enabled (ADR-011).
 */
export const productCustomFields: CustomFieldConfig[] = [
  {
    name: 'availabilityText',
    type: 'localeString',
    public: true,
    nullable: true,
    label: [{ languageCode: LanguageCode.en, value: 'Availability' }],
  },
  {
    name: 'enquiryEnabled',
    type: 'boolean',
    public: true,
    nullable: false,
    defaultValue: true,
    label: [{ languageCode: LanguageCode.en, value: 'Enquiry enabled' }],
  },
  {
    name: 'checkoutEnabled',
    type: 'boolean',
    public: true,
    nullable: false,
    defaultValue: true,
    label: [{ languageCode: LanguageCode.en, value: 'Checkout enabled (fixed SKU)' }],
  },
  {
    name: 'displayPriceText',
    type: 'localeString',
    public: true,
    nullable: true,
    label: [{ languageCode: LanguageCode.en, value: 'Display price (text only)' }],
  },
  {
    name: 'shortSummary',
    type: 'localeString',
    public: true,
    nullable: true,
    label: [{ languageCode: LanguageCode.en, value: 'Short summary' }],
  },
  {
    name: 'internalNotes',
    type: 'text',
    public: false,
    internal: true,
    nullable: true,
    label: [{ languageCode: LanguageCode.en, value: 'Internal notes' }],
  },
];
