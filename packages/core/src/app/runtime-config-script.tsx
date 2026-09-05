import { connection } from 'next/server';

export async function RuntimeConfigScript() {
  await connection();

  const config = {
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? '',
    posthogApiHost: process.env.POSTHOG_API_HOST ?? 'https://us.i.posthog.com',
    posthogProjectKey: process.env.POSTHOG_PROJECT_KEY ?? '',
  };

  return (
    <script
      id="runtime-config"
      dangerouslySetInnerHTML={{
        __html: `window.__CONFIG__=${JSON.stringify(config).replace(/</g, '\\u003c')}`,
      }}
    />
  );
}
