import type {
  PostHog,
  PostHogInterface,
} from 'posthog-js/dist/module.no-external';
import { readAuth } from '@/lib/auth-store';
import { runtimeConfig } from '@/lib/runtime-config';

const DEFAULT_POSTHOG_API_HOST = 'https://us.i.posthog.com';

let appliedIdentity: string | null | undefined;
let desiredIdentity: string | null | undefined =
  readAuth().accessToken === null ? null : undefined;
let posthogPromise: Promise<PostHog | null> | null = null;

function applyIdentity(posthog: PostHogInterface): void {
  if (desiredIdentity === undefined || desiredIdentity === appliedIdentity) {
    return;
  }

  appliedIdentity = desiredIdentity;

  if (desiredIdentity === null) {
    posthog.reset();

    return;
  }

  posthog.identify(desiredIdentity, { email: desiredIdentity });
}

function prepareWebAnalytics(posthog: PostHogInterface): void {
  applyIdentity(posthog);
  posthog.register({ application: 'studio' });
}

async function createWebAnalytics(): Promise<PostHog | null> {
  const config = runtimeConfig();

  if (!config.posthogProjectKey) {
    return null;
  }

  const posthogModule = await import('posthog-js/dist/module.no-external');
  const posthog = new posthogModule.PostHog().init(config.posthogProjectKey, {
    api_host: config.posthogApiHost || DEFAULT_POSTHOG_API_HOST,
    advanced_disable_flags: true,
    autocapture: true,
    capture_dead_clicks: false,
    capture_exceptions: false,
    capture_heatmaps: false,
    capture_pageleave: true,
    capture_pageview: 'history_change',
    capture_performance: false,
    disable_session_recording: true,
    disable_surveys: true,
    loaded: prepareWebAnalytics,
    persistence: 'localStorage',
    persistence_name: 'declarative_forms_studio',
    person_profiles: 'identified_only',
  });

  return posthog;
}

export function initializeWebAnalytics(): void {
  if (posthogPromise) {
    return;
  }

  posthogPromise = createWebAnalytics().catch((error: unknown) => {
    console.warn('Unable to initialize web analytics.', error);

    return null;
  });
}

export function syncWebAnalyticsIdentity(email: string | null): void {
  desiredIdentity = email;

  void posthogPromise?.then((posthog) => {
    if (posthog) {
      prepareWebAnalytics(posthog);
    }
  });
}
