/**
 * CMS redirects. Loop detection is a depth cap plus a seen-set: a cycle
 * `a -> b -> a` would otherwise pin the proxy.
 */

export interface CmsRedirect {
  readonly from: string;
  readonly to: string;
  readonly permanent: boolean;
}

export function resolveRedirect(
  path: string,
  redirects: readonly CmsRedirect[],
  maxHops = 5,
): CmsRedirect | null {
  const byFrom = new Map(redirects.map((item) => [item.from, item]));
  const seen = new Set<string>();
  let current = path;
  let last: CmsRedirect | null = null;

  for (let hop = 0; hop < maxHops; hop += 1) {
    if (seen.has(current)) return null;
    seen.add(current);
    const next = byFrom.get(current);
    if (next === undefined) return last;
    if (next.from === next.to) return null;
    last = next;
    current = next.to;
  }

  return null;
}
