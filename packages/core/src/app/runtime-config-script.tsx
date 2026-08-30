import { connection } from 'next/server';

/**
 * Inline `window.__CONFIG__` before any bundle runs.
 *
 * Replaces the nginx entrypoint that used to template `config.js` at container
 * start. `process.env` is read here at request time and is never inlined into
 * the client bundle, so changing the key needs a restart, not a rebuild.
 */
export async function RuntimeConfigScript() {
  // Opt out of prerendering: without this the key could be baked into a
  // statically generated page at build time.
  await connection();

  const config = { googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? '' };

  return (
    <script
      id="runtime-config"
      // `<` is escaped so a stray `</script>` in an env var cannot close the tag.
      dangerouslySetInnerHTML={{
        __html: `window.__CONFIG__=${JSON.stringify(config).replace(/</g, '\\u003c')}`,
      }}
    />
  );
}
