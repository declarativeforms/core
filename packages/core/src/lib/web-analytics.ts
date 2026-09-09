'use client';
import type {
  PostHog,
  PostHogInterface,
} from 'posthog-js/dist/module.no-external';
import { runtimeConfig } from '@/lib/runtime-config';

const DEFAULT_POSTHOG_API_HOST = 'https://us.i.posthog.com';

let posthogPromise: Promise<PostHog | null> | null = null;

function prepareWebAnalytics(posthog: PostHogInterface): void {
  posthog.register({ application: 'core' });
}

async function createWebAnalytics(): Promise<PostHog | null> {
  const config = runtimeConfig();

  if (!config.posthogProjectKey) {
    return null;
  }

  const posthogModule = await import('posthog-js/dist/module.no-external');

  return new posthogModule.PostHog().init(config.posthogProjectKey, {
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
    persistence_name: 'declarative_forms_core',
    person_profiles: 'never',
  });
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
