import nodemailer from 'nodemailer';

import type { CrmPort, EmailPort } from '@cera/contracts';

import { erpNextCrm } from './erpnext.ts';
import { fakeCrm, fakeEmail } from './fake.ts';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

export function emailProvider(): EmailPort & { close?: () => void } {
  const driver = process.env.EMAIL_DRIVER;
  if (driver === 'fake') {
    if (process.env.CERA_ENV !== 'local') throw new Error('Fake email is local-only');
    return fakeEmail();
  }
  if (driver === 'smtp') {
    const smtp = nodemailer.createTransport(required('SMTP_URL'), { from: required('EMAIL_FROM') });
    return {
      async send(m) {
        const result = await smtp.sendMail({
          to: m.to,
          subject: m.subject,
          text: m.text,
          html: m.html,
          messageId: `<${m.idempotencyKey.replace(/[^a-zA-Z0-9.-]/g, '-')}@cera.local>`,
        });
        return { id: String(result.messageId) };
      },
      close: () => smtp.close(),
    };
  }
  if (driver !== 'resend') throw new Error('EMAIL_DRIVER must be smtp, resend or fake');
  const key = required('RESEND_API_KEY');
  return {
    async send(m) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${key}`,
          'content-type': 'application/json',
          'idempotency-key': m.idempotencyKey,
        },
        body: JSON.stringify({
          from: required('EMAIL_FROM'),
          to: [m.to],
          subject: m.subject,
          text: m.text,
          html: m.html,
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`email_http_${response.status}`);
      const body = (await response.json()) as { id: string };
      return { id: body.id };
    },
  };
}

export function crmProvider(): CrmPort {
  if (process.env.CRM_DRIVER === 'fake') {
    if (process.env.CERA_ENV !== 'local') throw new Error('Fake CRM is local-only');
    return fakeCrm();
  }
  if (process.env.CRM_DRIVER !== 'erpnext') throw new Error('CRM_DRIVER must be erpnext or fake');
  return erpNextCrm({
    url: required('ERPNEXT_URL'),
    apiKey: required('ERPNEXT_API_KEY'),
    apiSecret: required('ERPNEXT_API_SECRET'),
  });
}
