import { redirect } from 'next/navigation';

/** Keep legacy enquiry links working while the single form lives on Contact. */
export default async function EnquiryRedirect({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sourceParams = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sourceParams)) {
    if (Array.isArray(value)) {
      for (const entry of value) params.append(key, entry);
    } else if (value !== undefined) {
      params.set(key, value);
    }
  }
  const query = params.toString();
  redirect(`/contact${query ? `?${query}` : ''}#contact-form`);
}
