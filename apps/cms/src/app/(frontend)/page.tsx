import { redirect } from 'next/navigation';

/**
 * The CMS host has no public pages. Visiting :3001 is almost always someone
 * looking for the admin, so send them there rather than rendering an empty
 * marketing shell that would duplicate `apps/web`.
 */
export default function Home() {
  redirect('/admin');
}
