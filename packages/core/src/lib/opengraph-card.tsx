import 'server-only';

import { ImageResponse } from 'next/og';

import {
  fetchForm,
  resolveFormLocale,
  resolveFormText,
  SITE_NAME,
  type FormRouteTarget,
} from './form-metadata';

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = 'image/png';
export const OG_ALT = SITE_NAME;

/** Shown when the form cannot be read, so a broken link still previews. */
const FALLBACK_TITLE = SITE_NAME;
const FALLBACK_DESCRIPTION = 'Forms that live in your Git repo.';

/** The app's own `--primary` in a hex satori understands (it cannot parse oklch). */
const DEFAULT_ACCENT = '#171717';

// Satori has no `-webkit-line-clamp` and will not shrink text to fit, so long
// copy is cut before layout and whatever still runs over is clipped by the
// scrolling container below.
const TITLE_LIMIT = 110;
const DESCRIPTION_LIMIT = 120;

/**
 * Two title sizes rather than one. Most form titles are a few words and want to
 * be large; a long one has to shrink or it cannot share the card with a
 * description. At 44px the longest allowed title runs to three lines, which
 * still leaves room for two lines of description above the footer.
 */
const TITLE_SIZE = { short: 64, long: 44 };
const SHORT_TITLE_CHARS = 45;

function clamp(text: string, limit: number): string {
  return text.length > limit ? `${text.slice(0, limit - 1).trimEnd()}…` : text;
}

/**
 * The share card, mirroring the card the form itself renders in: the same
 * neutral-50 ground, white panel and grey rule, so the preview and the page a
 * click later look like the same product.
 *
 * Everything is `display: flex` on purpose — satori requires it the moment an
 * element has more than one child — and nothing asks for a weight above 400,
 * which is the only face the renderer ships.
 */
export async function renderFormCard(
  target: FormRouteTarget,
): Promise<ImageResponse> {
  const form = await fetchForm(target);
  const locale = await resolveFormLocale(form);

  const title = resolveFormText(form?.title, locale) || FALLBACK_TITLE;
  const description = form
    ? resolveFormText(form.description, locale)
    : FALLBACK_DESCRIPTION;
  const accent = form?.theme?.primary || DEFAULT_ACCENT;
  const headline = clamp(title, TITLE_LIMIT);

  return new ImageResponse(
    (
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
            {/* Its own bounded, clipped column, so copy that still overruns can
                never push the footer off the card or print over the rule. */}
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
                  {clamp(description, DESCRIPTION_LIMIT)}
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
      </div>
    ),
    OG_SIZE,
  );
}
