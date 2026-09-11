import {
  OG_ALT,
  OG_CONTENT_TYPE,
  OG_SIZE,
  renderFormCard,
} from '@/lib/opengraph-card';
import type { ImageResponse } from 'next/og';

export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image(props: {
  params: Promise<{ slug: string }>;
}): Promise<ImageResponse> {
  const params = await props.params;

  return renderFormCard({ id: params.slug });
}
