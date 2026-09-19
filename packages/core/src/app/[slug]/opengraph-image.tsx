import { ImageResponse } from 'next/og';
import {
  findForm,
  resolveFormLocale,
  resolveFormText,
  SITE_NAME,
} from '@/lib/form-metadata';

export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const FALLBACK_DESCRIPTION = 'Open-source Forms as Code.';
const DEFAULT_ACCENT = '#171717';
const TITLE_LIMIT = 110;
const DESCRIPTION_LIMIT = 120;
const TITLE_SIZE = { short: 64, long: 44 };
const SHORT_TITLE_CHARS = 45;

function clampText(text: string, limit: number): string {
  return text.length > limit ? `${text.slice(0, limit - 1).trimEnd()}…` : text;
}

export default async function Image(props: {
  params: Promise<{ slug: string }>;
}): Promise<ImageResponse> {
  const params = await props.params;
  const form = await findForm({ id: params.slug });
  const locale = await resolveFormLocale(form);
  const title = resolveFormText(form?.title, locale) || SITE_NAME;
  const description = form
    ? resolveFormText(form.description, locale)
    : FALLBACK_DESCRIPTION;
  const accent = form?.theme?.primary || DEFAULT_ACCENT;
  const headline = clampText(title, TITLE_LIMIT);

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        padding: 72,
        backgroundColor: '#fafafa',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          borderRadius: 24,
          border: '1px solid #e5e7eb',
          backgroundColor: '#ffffff',
          overflow: 'hidden',
        }}
      >
        <div style={{ height: 12, backgroundColor: accent }} />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            padding: 64,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                fontSize:
                  headline.length <= SHORT_TITLE_CHARS
                    ? TITLE_SIZE.short
                    : TITLE_SIZE.long,
                lineHeight: 1.15,
                letterSpacing: -1.5,
                color: '#0a0a0a',
              }}
            >
              {headline}
            </div>

            {description ? (
              <div
                style={{
                  marginTop: 24,
                  fontSize: 30,
                  lineHeight: 1.4,
                  color: '#6b7280',
                }}
              >
                {clampText(description, DESCRIPTION_LIMIT)}
              </div>
            ) : null}
          </div>

          <div
            style={{
              display: 'flex',
              paddingTop: 28,
              borderTop: '1px solid #e5e7eb',
              fontSize: 24,
              color: '#9ca3af',
            }}
          >
            {SITE_NAME}
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
