export class CloudflareApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'CloudflareApiError';
    this.status = status;
  }
}
