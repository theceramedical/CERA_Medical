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
      name: 'contactLocations',
      type: 'array',
      label: 'Contact locations',
      maxRows: 8,
      fields: [
        { name: 'label', type: 'text', required: true, maxLength: 80 },
        { name: 'value', type: 'textarea', required: true, maxLength: 500 },
        { name: 'href', type: 'text', maxLength: 300 },
        {
          name: 'icon',
          type: 'select',
          defaultValue: 'mapPin',
          options: [
            { label: 'Email', value: 'mail' },
            { label: 'Location', value: 'mapPin' },
            { label: 'Phone', value: 'phone' },
          ],
        },
      ],
    },
    {
      name: 'contactEnquiry',
      type: 'group',
      label: 'Contact page enquiry panel',
      fields: [
        { name: 'heading', type: 'text', maxLength: 120 },
        { name: 'body', type: 'textarea', maxLength: 600 },
        { name: 'buttonLabel', type: 'text', maxLength: 80 },
        { name: 'buttonHref', type: 'text', maxLength: 300 },
        {
          name: 'formSectionTitle',
          type: 'text',
          defaultValue: 'Service request form',
          maxLength: 120,
        },
        {
          name: 'showInlineForm',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'When enabled, the full enquiry form appears on the Contact page.',
          },
        },
      ],
    },
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
        {
          name: 'fieldLabels',
          type: 'group',
          fields: [
            { name: 'name', type: 'text', defaultValue: 'Name', maxLength: 80 },
            { name: 'email', type: 'text', defaultValue: 'Email address', maxLength: 80 },
            { name: 'phone', type: 'text', defaultValue: 'Phone', maxLength: 80 },
            { name: 'institution', type: 'text', defaultValue: 'Institution', maxLength: 80 },
            { name: 'country', type: 'text', defaultValue: 'Country', maxLength: 80 },
            { name: 'serviceId', type: 'text', defaultValue: 'Service required', maxLength: 80 },
            { name: 'message', type: 'text', defaultValue: 'Project description', maxLength: 80 },
            { name: 'submit', type: 'text', defaultValue: 'Submit enquiry', maxLength: 80 },
          ],
        },
        {
          name: 'fieldHints',
          type: 'group',
          fields: [
            {
              name: 'email',
              type: 'text',
              defaultValue: 'We use this address to reply to your request.',
              maxLength: 200,
            },
            {
              name: 'serviceLocked',
              type: 'text',
              defaultValue: 'This enquiry is for the service you were reading about.',
              maxLength: 200,
            },
            {
              name: 'message',
              type: 'textarea',
              defaultValue:
                'Describe your samples, compounds or data, timeline and what you need. Do not include patient names or other identifying details.',
              maxLength: 400,
            },
          ],
        },
        {
          name: 'retentionFooter',
          type: 'textarea',
          defaultValue: 'See the Data Retention Policy for how long they are kept.',
          maxLength: 300,
        },
        {
          name: 'extraServices',
          type: 'array',
          admin: { description: 'Additional enquiry dropdown options (non-catalogue).' },
          maxRows: 10,
          fields: [
            { name: 'slug', type: 'text', required: true, maxLength: 80 },
            { name: 'title', type: 'text', required: true, maxLength: 160 },
          ],
        },
      ],
    },
  ],
};
