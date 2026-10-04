import { EmptyState } from '@cera/ui/empty-state';

export function CmsPageUnavailable({ slug }: { readonly slug: string }) {
  return (
    <div className="mx-auto max-w-site px-6 py-24 md:px-10">
      <EmptyState
        heading="This page is not published yet"
        description={`Publish the “${slug}” page in Payload CMS (or run content bootstrap) to show content here.`}
      />
    </div>
  );
}
