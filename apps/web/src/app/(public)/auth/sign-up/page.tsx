import { redirect } from 'next/navigation';

/** Customer registration is retired; customers can enquire or place a guest COD order. */
export default function CustomerSignUpPage(): never {
  redirect('/contact');
}
