import { canAuthor } from '../access/roles.ts';
import { revalidateGlobalAfterChange } from '../hooks/revalidate.ts';

import type { GlobalConfig } from 'payload';

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: { group: 'Site' },
  hooks: { afterChange: [revalidateGlobalAfterChange('site-settings')] },
  access: {
    read: () => true,
    update: ({ req }) => canAuthor(req.user),
  },
  fields: [
    { name: 'tagline', type: 'text', defaultValue: 'Biomedical Research and Development' },
    { name: 'email', type: 'email' },
    { name: 'phone', type: 'text' },
    { name: 'address', type: 'textarea' },
    {
      name: 'social',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
      ],
      maxRows: 8,
    },
    { name: 'newsletterHeading', type: 'text', defaultValue: '' },
    {
      name: 'newsletterBody',
      type: 'text',
      defaultValue: '',
    },
    {
      name: 'faqs',
      type: 'array',
      label: 'Frequently asked questions',
      maxRows: 50,
      fields: [
        { name: 'question', type: 'text', required: true, maxLength: 180 },
        { name: 'answer', type: 'textarea', required: true, maxLength: 2000 },
      ],
    },
    {
      name: 'enquiryForm',
      type: 'group',
      fields: [
        {
          name: 'consentVersion',
          type: 'text',
          required: true,
          defaultValue: 'cera-brief-2026-10-03-v1',
          maxLength: 64,
        },
        {
          name: 'generalConsent',
          type: 'textarea',
          required: true,
          defaultValue:
            'I have read the Privacy Terms and I agree that CERA Medical may use the information I provide in this form to respond to my request and to deliver the service I have asked for.',
        },
        {
          name: 'sequencingConsent',
          type: 'array',
          maxRows: 10,
          fields: [{ name: 'statement', type: 'textarea', required: true }],
        },
        {
          name: 'samplesConsent',
          type: 'array',
          maxRows: 10,
          fields: [{ name: 'statement', type: 'textarea', required: true }],
        },
        {
          name: 'healthDataConsent',
          type: 'array',
          maxRows: 10,
          fields: [{ name: 'statement', type: 'textarea', required: true }],
        },
        {
          name: 'updatesOptIn',
          type: 'textarea',
          defaultValue:
            'I would like to receive occasional updates from CERA Medical about its services and products. I can unsubscribe at any time.',
        },
        {
          name: 'contactNotice',
          type: 'textarea',
          defaultValue: 'The details you enter here are used only to answer your enquiry.',
        },
        {
          name: 'successMessage',
          type: 'textarea',
          defaultValue:
            'Thank you. Your request has been received and we will reply within three working days.',
        },
      ],
    },
  ],
};
