/**
 * LinkedText component for rendering text with embedded links.
 *
 * Takes a plain text string and an array of link definitions
 * with start/end character indices, then renders the text with
 * the specified ranges wrapped in <Link> elements.
 */

import { Link, Text } from '@react-email/components';
import * as React from 'react';

import * as styles from './styles';

export interface TextLink {
  /** Start index (inclusive) in the text string */
  start: number;
  /** End index (exclusive) in the text string */
  end: number;
  /** URL the link points to */
  href: string;
}

export interface LinkedTextProps {
  text: string;
  links?: TextLink[];
  style?: React.CSSProperties;
  linkStyle?: React.CSSProperties;
}

export const LinkedText = ({ text, links, style, linkStyle = styles.link }: LinkedTextProps) => {
  if (!links || links.length === 0) {
    return <Text style={style}>{text}</Text>;
  }

  const sorted = [...links].sort((a, b) => a.start - b.start);
  const parts: React.ReactNode[] = [];
  let cursor = 0;

  for (const link of sorted) {
    if (cursor < link.start) {
      parts.push(text.slice(cursor, link.start));
    }
    parts.push(
      <Link key={link.start} href={link.href} style={linkStyle}>
        {text.slice(link.start, link.end)}
      </Link>
    );
    cursor = link.end;
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return <Text style={style}>{parts}</Text>;
};
