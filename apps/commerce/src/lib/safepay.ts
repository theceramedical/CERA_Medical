export type SafepayEnvironment = 'sandbox' | 'production';

export function safepayApiHost(environment: SafepayEnvironment): string {
  return environment === 'production'
    ? 'https://api.getsafepay.com'
    : 'https://sandbox.api.getsafepay.com';
}

export function safepayCheckoutPayBase(environment: SafepayEnvironment): string {
  return environment === 'production'
    ? 'https://getsafepay.com/checkout/pay'
    : 'https://sandbox.api.getsafepay.com/checkout/pay';
}

export function resolveSafepayEnvironment(): SafepayEnvironment {
  return process.env.SAFEPAY_ENVIRONMENT === 'production' ? 'production' : 'sandbox';
}

interface SafepayReporterResponse {
  readonly data?: {
    readonly tracker?: { readonly state?: string; readonly token?: string };
  };
}

/** Returns true when Safepay reports a completed hosted checkout session. */
export async function safepayTrackerCompleted(
  trackerToken: string,
  merchantSecret: string,
  environment: SafepayEnvironment,
): Promise<boolean> {
  const host = safepayApiHost(environment);
  const response = await fetch(`${host}/reporter/api/v1/payments/${trackerToken}`, {
    headers: { 'X-SFPY-MERCHANT-SECRET': merchantSecret },
  });
  if (!response.ok) return false;
  const body = (await response.json()) as SafepayReporterResponse;
  return body.data?.tracker?.state === 'TRACKER_ENDED';
}
