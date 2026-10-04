import { ApiError } from '@cera/contracts/errors';

type SafepayEnvironment = 'sandbox' | 'production';

function apiHost(environment: SafepayEnvironment): string {
  return environment === 'production'
    ? 'https://api.getsafepay.com'
    : 'https://sandbox.api.getsafepay.com';
}

function checkoutPayBase(environment: SafepayEnvironment): string {
  return environment === 'production'
    ? 'https://getsafepay.com/checkout/pay'
    : 'https://sandbox.api.getsafepay.com/checkout/pay';
}

function environmentFromEnv(): SafepayEnvironment {
  return process.env.SAFEPAY_ENVIRONMENT === 'production' ? 'production' : 'sandbox';
}

function merchantSecret(): string {
  const secret = process.env.SAFEPAY_MERCHANT_SECRET;
  if (secret === undefined || secret.length === 0) {
    throw new ApiError('upstream_unavailable', { internalDetail: 'safepay not configured' });
  }
  return secret;
}

function merchantApiKey(): string {
  const key = process.env.SAFEPAY_MERCHANT_API_KEY;
  if (key === undefined || key.length === 0) {
    throw new ApiError('upstream_unavailable', {
      internalDetail: 'safepay api key not configured',
    });
  }
  return key;
}

async function safepayPost<T>(path: string, body: unknown): Promise<T> {
  const environment = environmentFromEnv();
  const host = apiHost(environment);
  const response = await fetch(`${host}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'X-SFPY-MERCHANT-SECRET': merchantSecret(),
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new ApiError('upstream_unavailable', {
      internalDetail: `safepay HTTP ${String(response.status)} on ${path}`,
    });
  }
  return (await response.json()) as T;
}

export async function createSafepayHostedCheckout(input: {
  amountMinor: number;
  currency: string;
  redirectUrl: string;
  cancelUrl: string;
}): Promise<{ checkoutUrl: string; tracker: string }> {
  const environment = environmentFromEnv();
  const session = await safepayPost<{
    data?: { tracker?: { token?: string } };
  }>('/order/payments/v3/', {
    merchant_api_key: merchantApiKey(),
    intent: 'CYBERSOURCE',
    mode: 'payment',
    entry_mode: 'raw',
    currency: input.currency,
    amount: input.amountMinor,
    include_fees: false,
  });
  const tracker = session.data?.tracker?.token;
  if (tracker === undefined || tracker.length === 0) {
    throw new ApiError('upstream_unavailable', { internalDetail: 'safepay missing tracker' });
  }

  const base = checkoutPayBase(environment);
  const params = new URLSearchParams({
    tracker,
    source: 'hosted',
    redirect_url: input.redirectUrl,
    cancel_url: input.cancelUrl,
  });
  return { checkoutUrl: `${base}?${params.toString()}`, tracker };
}
