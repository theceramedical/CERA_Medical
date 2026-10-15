/** Staff-facing clock. Storage stays UTC; this only formats for display. */
export const PAKISTAN_TIME_ZONE = 'Asia/Karachi';

export function formatPakistanDateTime(iso: string): string {
  const formatted = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: PAKISTAN_TIME_ZONE,
  }).format(new Date(iso));
  return `${formatted} PKT`;
}
