export function formatCartMoney(minor: number, currencyCode: string): string {
  const major = minor / 100;
  try {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'code',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(major);
  } catch {
    return `${major.toFixed(2)} ${currencyCode}`;
  }
}
