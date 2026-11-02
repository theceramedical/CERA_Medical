import { redirect } from 'next/navigation';

/** Customer identity verification is retired with customer account sign-in. */
export default function RetiredCustomerVerificationPage(): never {
  redirect('/contact');
}
