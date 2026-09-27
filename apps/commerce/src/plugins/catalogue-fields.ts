import { LanguageCode, type CustomFieldConfig } from '@vendure/core';

/**
 * Custom fields on Product. A service is not a purchasable SKU.
 *
 * `displayPriceText` is a string so nothing downstream can treat a service as
 * chargeable (data-contracts.md 2.1). `internalNotes` is `internal: true`,
 * which hides it from both the Shop API and the Admin API public projection.
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
