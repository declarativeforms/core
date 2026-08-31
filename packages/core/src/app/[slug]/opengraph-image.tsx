import {
  OG_ALT,
  OG_CONTENT_TYPE,
  OG_SIZE,
  renderFormCard,
} from '@/lib/opengraph-card';

export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/**
 * The share card for a form addressed by its id.
 *
 * Metadata images are inherited by descendant segments, so this also covers
 * `/{id}/thank-you`. The deeper GitHub route overrides it with its own file.
 */
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return renderFormCard({ id: slug });
}
