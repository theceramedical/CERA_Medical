import { APIError } from 'payload';

import type { CollectionBeforeChangeHook } from 'payload';

/** A team record can go public only after both client and photo approvals. */
export const approverOnlyTeamPublish: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  const incoming = data as {
    _status?: 'draft' | 'published';
    clientConfirmed?: boolean;
    photoApproved?: boolean;
    photo?: number | { id?: number } | null;
  };
  const existing = originalDoc as
    | {
        _status?: 'draft' | 'published';
        clientConfirmed?: boolean;
        photoApproved?: boolean;
        photo?: number | { id?: number } | null;
      }
    | undefined;
  const nextStatus = incoming._status ?? existing?._status ?? 'draft';
  const clientConfirmed = incoming.clientConfirmed ?? existing?.clientConfirmed ?? false;
  const photo = incoming.photo ?? existing?.photo;
  const relationID = (value: unknown): number | undefined => {
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && value !== null && 'id' in value) {
      const id = value.id;
      return typeof id === 'number' ? id : undefined;
    }
    return undefined;
  };
  const photoID = relationID(photo);
  const photoChanged = incoming.photo !== undefined && photoID !== relationID(existing?.photo);
  const photoApproved = photoChanged
    ? incoming.photoApproved === true
    : (incoming.photoApproved ?? existing?.photoApproved ?? false);
  const hasPhoto = typeof photoID === 'number' && Number.isInteger(photoID) && photoID > 0;

  if (
    nextStatus === 'published' &&
    (clientConfirmed !== true || photoApproved !== true || !hasPhoto)
  ) {
    throw new APIError(
      'Team publication requires approver-confirmed current client details and an uploaded, approver-approved photo.',
      400,
    );
  }

  // A relation ID alone is not enough: Payload can receive stale/imported IDs
  // through privileged writes, so confirm the referenced media row exists.
  if (nextStatus === 'published' && hasPhoto) {
    await req.payload.findByID({
      collection: 'media',
      id: photoID,
      overrideAccess: true,
    });
  }

  return data;
};
