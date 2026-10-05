/* eslint-disable @cera/no-raw-color -- transactional HTML email; clients ignore app design tokens */
export interface EnquiryMailFields {
  readonly reference: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly institution: string | null;
  readonly country: string | null;
  readonly serviceId: string;
  readonly message: string;
  readonly createdAt: string;
  readonly staffPortalUrl?: string;
  readonly claimLink?: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function layout(inner: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#ecf4ff;font-family:'Segoe UI',system-ui,sans-serif;color:#0b1d2b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecf4ff;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #c1c7cf;border-radius:8px;overflow:hidden;">
        <tr><td style="background:linear-gradient(90deg,#003b58,#005b7d);padding:20px 24px;">
          <p style="margin:0;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#8deff9;font-weight:600;">CERA Medical</p>
          <p style="margin:6px 0 0;font-size:20px;font-weight:700;color:#ffffff;">Biomedical research &amp; development</p>
        </td></tr>
        <tr><td style="padding:24px;">${inner}</td></tr>
        <tr><td style="padding:16px 24px;background:#f7f9ff;border-top:1px solid #c1c7cf;font-size:12px;color:#41484e;line-height:1.5;">
          This message was sent by the CERA Medical enquiry system. Do not reply with identifiable patient data.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function enquiryCustomerReceiptText(fields: EnquiryMailFields): string {
  return [
    `Thank you — we received your enquiry ${fields.reference}.`,
    '',
    'Our team aims to respond within three working days with scoping questions or next steps.',
    '',
    `Reference: ${fields.reference}`,
    `Service: ${fields.serviceId.replaceAll('-', ' ')}`,
    '',
    'If you created a CERA account with this email, you can claim the enquiry in your portal once you verify your address.',
  ].join('\n');
}

export function enquiryCustomerReceiptHtml(fields: EnquiryMailFields): string {
  const inner = `
    <p style="margin:0 0 12px;font-size:16px;line-height:1.5;">Thank you — we received your enquiry.</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#41484e;">Our team aims to respond within <strong>three working days</strong> with scoping questions or next steps.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecf4ff;border-radius:6px;padding:12px 16px;margin-bottom:16px;">
      <tr><td style="font-size:13px;color:#41484e;padding:4px 0;">Reference</td><td style="font-size:14px;font-weight:600;text-align:right;">${escapeHtml(fields.reference)}</td></tr>
      <tr><td style="font-size:13px;color:#41484e;padding:4px 0;">Service</td><td style="font-size:14px;text-align:right;">${escapeHtml(fields.serviceId.replaceAll('-', ' '))}</td></tr>
    </table>
    <p style="margin:0;font-size:13px;color:#41484e;">Sign in to your CERA account with this email to follow progress after you verify your address.</p>`;
  return layout(inner);
}

export function enquiryStaffAlertText(fields: EnquiryMailFields): string {
  const lines = [
    `New enquiry ${fields.reference}`,
    '',
    `Name: ${fields.name}`,
    `Email: ${fields.email}`,
    fields.phone ? `Phone: ${fields.phone}` : null,
    fields.institution ? `Institution: ${fields.institution}` : null,
    fields.country ? `Country: ${fields.country}` : null,
    `Service: ${fields.serviceId}`,
    '',
    'Message:',
    fields.message,
    '',
    fields.staffPortalUrl ? `Staff portal: ${fields.staffPortalUrl}` : null,
  ].filter((line): line is string => line !== null);
  return lines.join('\n');
}

export function enquiryStaffAlertHtml(fields: EnquiryMailFields): string {
  const rows = [
    ['Reference', fields.reference],
    ['Name', fields.name],
    ['Email', fields.email],
    ...(fields.phone ? [['Phone', fields.phone]] : []),
    ...(fields.institution ? [['Institution', fields.institution]] : []),
    ...(fields.country ? [['Country', fields.country]] : []),
    ['Service', fields.serviceId.replaceAll('-', ' ')],
    ['Submitted', new Date(fields.createdAt).toUTCString()],
  ] as const;

  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="font-size:13px;color:#41484e;padding:6px 0;vertical-align:top;width:38%;">${escapeHtml(label)}</td><td style="font-size:14px;padding:6px 0;">${escapeHtml(value)}</td></tr>`,
    )
    .join('');

  const portal = fields.staffPortalUrl
    ? `<p style="margin:20px 0 0;"><a href="${escapeHtml(fields.staffPortalUrl)}" style="display:inline-block;background:#006970;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600;font-size:14px;">Open staff portal</a></p>`
    : '';

  const inner = `
    <p style="margin:0 0 8px;font-size:18px;font-weight:700;">New project enquiry</p>
    <p style="margin:0 0 16px;font-size:14px;color:#41484e;">A visitor submitted the public enquiry form. Details are below.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e1efff;">${tableRows}</table>
    <p style="margin:20px 0 8px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#006970;">Project description</p>
    <p style="margin:0;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(fields.message)}</p>
    ${portal}`;

  return layout(inner);
}

export function enquiryClaimHtml(reference: string, claimLink: string): string {
  const inner = `
    <p style="margin:0 0 12px;font-size:16px;">Claim enquiry <strong>${escapeHtml(reference)}</strong> to your CERA account.</p>
    <p style="margin:0 0 20px;font-size:14px;color:#41484e;">This link expires for security. If you did not request it, you can ignore this email.</p>
    <a href="${escapeHtml(claimLink)}" style="display:inline-block;background:#003b58;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600;">Claim enquiry</a>`;
  return layout(inner);
}
