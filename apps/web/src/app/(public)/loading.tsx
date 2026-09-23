import { PageSkeleton } from '../../components/route-states.tsx';

/**
 * The public site's loading state.
 *
 * A file, not a `<Suspense>` boundary written by hand: Next wraps the route's page in one
 * automatically when this exists, which means every route in the group gets the behaviour and none of
 * them has to remember it.
 */
export default function PublicLoading() {
  return <PageSkeleton />;
}
