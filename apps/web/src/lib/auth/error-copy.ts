export interface AuthErrorCopy {
  title: string;
  lede: string;
  plan: string;
}

const errors: Record<string, AuthErrorCopy> = {
  configuration: {
    title: 'Secure sign-in is not ready yet',
    lede: 'CERA is still configuring its account sign-in service.',
    plan: 'You can still contact CERA without signing in. Please try again later if you need an account.',
  },
  access: {
    title: 'Your account does not have CERA access yet',
    lede: 'Your identity provider sign-in succeeded, but this account is not assigned a CERA role.',
    plan: 'Ask the CERA administrator to add your account to the right CERA group, then start a new sign-in.',
  },
  expired: {
    title: 'This sign-in attempt expired',
    lede: 'Sign-in links can only be used once and expire after a short time.',
    plan: 'Start again from the sign-in page. Nothing was stored from this attempt.',
  },
  identity: {
    title: 'Your identity could not be verified',
    lede: 'The identity provider did not return the account details CERA needs.',
    plan: 'Check that your sign-in account has a verified email address. If it still fails, contact the CERA administrator.',
  },
  email_unverified: {
    title: 'Verify your email to use the portal',
    lede: 'Your sign-in succeeded, but CERA can only show enquiries for a verified email address.',
    plan: 'Complete email verification in your sign-in service, then sign in again from the sign-in page.',
  },
  mfa: {
    title: 'Staff sign-in requires multi-factor authentication',
    lede: 'Your account has a staff role, but the identity provider did not confirm a second factor for this sign-in.',
    plan: 'Complete the required second-factor step with your identity provider, then try again. Contact the CERA administrator if you need help setting it up.',
  },
  provider: {
    title: 'The identity provider could not complete sign-in',
    lede: 'CERA could not finish exchanging the sign-in response with your identity provider.',
    plan: 'Start again from the sign-in page. If this keeps happening, contact the CERA administrator.',
  },
  unavailable: {
    title: 'Sign-in is temporarily unavailable',
    lede: 'CERA could not reach its sign-in service.',
    plan: 'Wait a moment and try again. If the issue continues, contact the CERA administrator.',
  },
};

export function authErrorCopy(reason: string | string[] | undefined): AuthErrorCopy {
  const key = typeof reason === 'string' ? reason : undefined;
  return (
    errors[key ?? ''] ?? {
      title: 'Sign-in could not be completed',
      lede: 'CERA could not complete this sign-in attempt.',
      plan: 'Start again from the sign-in page. If this keeps happening, contact the CERA administrator.',
    }
  );
}
