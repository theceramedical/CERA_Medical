import { Heading, Text } from '@cera/ui/typography';

import type { ReactNode } from 'react';

/**
 * Renders the constrained Lexical set from Phase 05.
 *
 * An unknown node becomes a visible fallback rather than a crash, so an editor
 * who somehow saved a table does not take the article page down.
 */

interface LexicalText {
  readonly type: 'text';
  readonly text?: string;
  readonly format?: number;
}

interface LexicalNode {
  readonly type: string;
  readonly tag?: string;
  readonly children?: readonly LexicalNode[];
  readonly text?: string;
  readonly format?: number;
}

interface LexicalRoot {
  readonly root?: { readonly children?: readonly LexicalNode[] };
}

const BOLD = 1;
const ITALIC = 2;
const UNDERLINE = 8;

function renderText(node: LexicalText, key: string): ReactNode {
  let content: ReactNode = node.text ?? '';
  const format = node.format ?? 0;
  if (format & BOLD) content = <strong>{content}</strong>;
  if (format & ITALIC) content = <em>{content}</em>;
  if (format & UNDERLINE) content = <span className="underline">{content}</span>;
  return <span key={key}>{content}</span>;
}

function renderChildren(nodes: readonly LexicalNode[] | undefined, prefix: string): ReactNode {
  return nodes?.map((node, index) => renderNode(node, `${prefix}-${String(index)}`));
}

function renderNode(node: LexicalNode, key: string): ReactNode {
  switch (node.type) {
    case 'text':
      return renderText(
        {
          type: 'text',
          ...(node.text === undefined ? {} : { text: node.text }),
          ...(node.format === undefined ? {} : { format: node.format }),
        },
        key,
      );
    case 'paragraph':
      return (
        <Text key={key} className="mt-4">
          {renderChildren(node.children, key)}
        </Text>
      );
    case 'heading': {
      const level = node.tag === 'h3' ? 3 : node.tag === 'h4' ? 4 : 2;
      return (
        <Heading key={key} level={level} size={level === 2 ? 'h3' : 'h4'} className="mt-10">
          {renderChildren(node.children, key)}
        </Heading>
      );
    }
    case 'list': {
      const Tag = node.tag === 'ol' ? 'ol' : 'ul';
      return (
        <Tag key={key} className="mt-4 list-inside list-disc space-y-2 pl-1">
          {renderChildren(node.children, key)}
        </Tag>
      );
    }
    case 'listitem':
      return <li key={key}>{renderChildren(node.children, key)}</li>;
    case 'quote':
      return (
        <blockquote key={key} className="mt-6 border-l-2 border-accent-fill pl-4">
          {renderChildren(node.children, key)}
        </blockquote>
      );
    case 'link':
      return (
        <span key={key} className="text-primary underline">
          {renderChildren(node.children, key)}
        </span>
      );
    default:
      return (
        <Text key={key} tone="muted" className="mt-4">
          This block cannot be shown.
        </Text>
      );
  }
}

export function RichText({ body }: { readonly body: unknown }) {
  if (body === null || body === undefined) return null;
  const document = body as LexicalRoot;
  const children = document.root?.children;
  if (children === undefined || children.length === 0) return null;
  return <div className="max-w-measure">{renderChildren(children, 'rt')}</div>;
}
