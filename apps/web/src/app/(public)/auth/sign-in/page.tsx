import { redirect } from 'next/navigation';

/** Customer accounts are retired; customer journeys begin with a public enquiry or guest order. */
export default function CustomerSignInPage(): never {
  redirect('/contact');
}
