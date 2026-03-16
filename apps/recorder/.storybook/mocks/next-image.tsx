/**
 * Storybook mock for next/image
 * Renders a plain <img> to bypass Next.js hostname validation and image optimization.
 */
import type { ImageProps } from 'next/image';

export default function MockImage({ src, alt, width, height, fill, ...rest }: ImageProps) {
  // next/image `fill` prop uses absolute positioning with no explicit width/height
  const fillStyle = fill ? { objectFit: 'cover' as const, width: '100%', height: '100%' } : {};

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={typeof src === 'string' ? src : (src as { src: string }).src}
      alt={alt}
      width={fill ? undefined : (width as number)}
      height={fill ? undefined : (height as number)}
      style={fillStyle}
      {...rest}
    />
  );
}
