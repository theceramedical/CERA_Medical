import {
  BlockquoteFeature,
  BoldFeature,
  HeadingFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  lexicalEditor,
  OrderedListFeature,
  ParagraphFeature,
  UnderlineFeature,
  UnorderedListFeature,
} from '@payloadcms/richtext-lexical';

import type { Config } from 'payload';

/**
 * The Lexical feature set the public renderer knows how to draw.
 *
 * An editor who can author a table, an embed, or a raw HTML block will, and the
 * public renderer will then either drop it or render it wrong. Constraining the
 * editor to the marks and blocks `apps/web` implements is what makes "what you
 * see in preview is what publishes" a property rather than a hope.
 *
 * Deliberately absent: tables, uploads-inside-the-body (media is a relation on
 * the document), alignment, text colour, and anything that would emit a hex
 * value (ADR-001).
 */
export function constrainedEditor(): NonNullable<Config['editor']> {
  return lexicalEditor({
    features: () => [
      ParagraphFeature(),
      HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
      BoldFeature(),
      ItalicFeature(),
      UnderlineFeature(),
      UnorderedListFeature(),
      OrderedListFeature(),
      BlockquoteFeature(),
      LinkFeature({
        enabledCollections: [],
        fields: ({ defaultFields }) => defaultFields.filter((field) => field.name !== 'rel'),
      }),
      InlineToolbarFeature(),
    ],
  });
}
