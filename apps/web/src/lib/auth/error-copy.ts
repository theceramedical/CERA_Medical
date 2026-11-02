export interface AuthErrorCopy {
  title: string;
  lede: string;
  plan: string;
}

const errors: Record<string, AuthErrorCopy> = {
  configuration: {
    title: 'Staff access is not configured yet',
    lede: 'CERA has not finished configuring Cloudflare Access for this staff workspace.',
    plan: 'Contact the CERA administrator. Public enquiries and eligible guest orders remain available.',
  },
  access: {
    title: 'This identity is not assigned staff access',
    lede: 'Cloudflare Access authenticated this identity, but it is not mapped to a CERA staff role.',
    plan: 'Ask the CERA administrator to review the staff email and role allowlist.',
  },
};

export function authErrorCopy(reason: string | string[] | undefined): AuthErrorCopy {
  const key = typeof reason === 'string' ? reason : undefined;
  return (
    errors[key ?? ''] ?? {
      title: 'Sign-in could not be completed',
      lede: 'CERA could not authorize this request for the staff workspace.',
      plan: 'Return to the staff workspace or contact the CERA administrator.',
    }
  );
}
