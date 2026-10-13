# CMS galleries, About team and production release

## Implemented

- Native Media list bulk upload explicitly enabled; existing required alt text, image types and per-file limit retained.
- Pages, Posts and Service presentations have ordered multi-upload galleries (up to 40 images) and a gallery heading.
- Pages have team heading/introduction and editable member rows with name, role, biography, optional photo and HTTPS profile links.
- About renders its CMS record instead of the fixed AboutProfile component. CMS SEO fields drive its metadata.
- Public galleries retain original aspect ratio inside image frames and link to full-size files. Empty galleries/team lists are hidden.
- Gallery and team relations are included in draft/version tables by the generated migration.

## Checks

- CMS/web typechecks and changed-file lint passed.
- Contract suite: 323 passing tests.
- Mapper/rendering suite: 8 passing tests, including gallery ordering, deleted media, unsafe profile URLs and team rendering.
- Applied the full migration chain in an isolated PostgreSQL schema within a rolled-back transaction. No live content modified.
- Local Next.js browser preview using a mock CMS: About content, two gallery images, team profiles with/without photos, and profile link rendered.
- In-app browser desktop/mobile viewport checks: no horizontal overflow; all image resources loaded.
- The development React debugging warning about eval under the existing CSP was observed. The security policy was not weakened for development tooling.
- Commit `07414a07765230f704832c99b6be244c2841b05e` passed CI, the security workflow, all six production image builds, deployment over SSH, and the release smoke test: https://github.com/theceramedical/CERA_Medical/actions/runs/38367549791
- Post-release checks: `https://www.ceramedical.org` returned HTTP 200; the CMS admin endpoint redirected to sign-in (HTTP 307); all Compose application services reported running and healthy on CERA-Production.

## Release and owner use

The production release deployed the CMS/web images and ran migrations in order: site_logo, then galleries_and_team. Shared contracts were included in the image builds.

1. CMS → Content → Media: upload multiple images; complete required alt text.
2. Content → Posts or Service presentations → open record → Image gallery: select/reorder images, save draft, preview and publish.
3. Content → Pages → about: edit content and team fields; add/reorder/remove member rows, save draft, preview and publish.
4. Verify the public article/service gallery and About page. The local browser preview used fixture data; Habab’s signed-in CMS upload/create/publish workflow has not yet been exercised with owner content.

No production team profiles or synthetic public articles were created. Photos and identities must be supplied/approved by the owner.
