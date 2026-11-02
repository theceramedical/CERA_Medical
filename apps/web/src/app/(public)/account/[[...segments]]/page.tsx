import { redirect } from 'next/navigation';

/** Old customer-account URLs now lead to the public contact path. */
export default function RetiredCustomerAccountPage(): never {
  redirect('/contact');
}
