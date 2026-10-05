/** Rough paragraph count in a Lexical document — used to detect bootstrap-thin posts. */
export function lexicalParagraphCount(body: unknown): number {
  if (body === null || typeof body !== 'object') return 0;
  const root = (body as { root?: { children?: unknown[] } }).root;
  const children = root?.children;
  if (!Array.isArray(children)) return 0;
  return children.filter((node) => {
    if (node === null || typeof node !== 'object') return false;
    return (node as { type?: string }).type === 'paragraph';
  }).length;
}
