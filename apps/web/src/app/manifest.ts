import { readColorTokens } from '@cera/ui/tokens';

import type { MetadataRoute } from 'next';

/**
 * The web app manifest.
 *
 * Present so that a visitor who adds the site to a home screen gets a named icon and the right colours
 * rather than a screenshot and the page title. That is the whole ambition: PRD 3.2 puts native apps out
 * of scope, and this is not a step towards one.
 *
 * `display: 'browser'`, deliberately. `standalone` would launch without the browser's address bar and
 * navigation, which on a site whose main action is submitting personal information is the wrong trade -
 * a user cannot check the origin they are on, and there is no back button. The convenience of a
 * chrome-less window is not worth that on a medical site.
 */
/**
 * The manifest's two colours, read out of `theme.css`.
 *
 * A manifest is JSON fetched by the browser, so it never passes through Tailwind and a class name is no
 * use to it - it needs literal hex. Writing the hex here would put two colour values outside the token
 * file, which is the thing `no-raw-color` exists to prevent and which the rule correctly flagged.
 *
 * So the values are parsed from the stylesheet at request time by the same reader the design preview
 * uses. That makes `theme.css` the only place either colour is written, and it means a palette change
 * reaches the home-screen icon rather than leaving it a shade behind forever.
 *
 * It throws on a missing token rather than substituting a default: a manifest with the wrong theme
 * colour is barely noticeable, so nothing would ever surface the omission.
 */
function manifestColor(token: string): string {
  const value = readColorTokens().get(token);

  if (value === undefined) {
    throw new Error(`theme.css declares no --color-${token}, which the web manifest needs`);
  }

  return value;
}

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CERA Medical',
    short_name: 'CERA',
    description: 'Trusted medical services, made easier to access.',
    start_url: '/',
    display: 'browser',

    background_color: manifestColor('neutral-0'),
    theme_color: manifestColor('primary-700'),

    icons: [
      {
        src: '/icon.svg',
        // `any` covers every size, which is what an SVG is for. Shipping a 192px and a 512px PNG as
        // well would be three files to keep in step for a mark that is four paths.
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        /**
         * A separate maskable icon, not the same file with a second `purpose`.
         *
         * A maskable icon is cropped to whatever shape the platform uses - a circle, a squircle, a
         * rounded square - so it needs padding that a normal icon should not have. Declaring one file
         * as both means it is either clipped on Android or floating in whitespace everywhere else.
         */
        src: '/icon-maskable.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
