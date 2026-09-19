'use client';
import type {
  IDeclarativeFormAnalyticsProvider,
  IDeclarativeFormMeasurements,
} from '@declarativeforms/engine';
import type { Mixpanel } from 'mixpanel-browser';

type AnalyticsProperties = Record<
  string,
  boolean | number | string | null | undefined
>;

type AnalyticsProvider = {
  capture: (event: string, properties: AnalyticsProperties) => void;
  shutdown: () => void;
};

type AnalyticsEventProperties = {
  page_view: {
    form_id?: string;
  };
  section_completed: {
    form_id?: string;
    section_id: string;
    is_final: boolean;
  };
};

export type Analytics = {
  capture: <Event extends keyof AnalyticsEventProperties>(
    event: Event,
    properties: AnalyticsEventProperties[Event],
  ) => void;
  shutdown: () => void;
};

const MIXPANEL_API_HOST = 'https://api-eu.mixpanel.com';
const POSTHOG_API_HOST = 'https://us.i.posthog.com';

let mixpanelInstanceId = 0;

function normalizeProvider(
  provider: IDeclarativeFormAnalyticsProvider,
  defaultApiHost: string,
): { token: string; apiHost: string } {
  return typeof provider === 'string'
    ? { token: provider, apiHost: defaultApiHost }
    : { token: provider.token, apiHost: provider.api_host || defaultApiHost };
}

async function createMixpanelProvider(
  configuration: IDeclarativeFormAnalyticsProvider,
): Promise<AnalyticsProvider | null> {
  const provider = normalizeProvider(configuration, MIXPANEL_API_HOST);

  if (!provider.token) {
    return null;
  }

  const mixpanelModule = await import('mixpanel-browser');
  const instanceName = `declarative_forms_${mixpanelInstanceId++}`;
  const instance: Mixpanel = mixpanelModule.default.init(
    provider.token,
    {
      api_host: provider.apiHost,
      autocapture: false,
      record_sessions_percent: 0,
      track_pageview: false,
    },
    instanceName,
  );

  return {
    capture: (event, properties) => instance.track(event, properties),
    shutdown: () => instance.disable(),
  };
}

async function createPostHogProvider(
  configuration: IDeclarativeFormAnalyticsProvider,
): Promise<AnalyticsProvider | null> {
  const provider = normalizeProvider(configuration, POSTHOG_API_HOST);

  if (!provider.token) {
    return null;
  }

  const posthogModule = await import('posthog-js/dist/module.no-external');
  const instance = new posthogModule.PostHog().init(provider.token, {
    api_host: provider.apiHost,
    advanced_disable_flags: true,
    autocapture: false,
    capture_dead_clicks: false,
    capture_exceptions: false,
    capture_heatmaps: false,
    capture_pageleave: true,
    capture_pageview: 'history_change',
    capture_performance: false,
    disable_session_recording: true,
    disable_surveys: true,
    persistence: 'localStorage',
    person_profiles: 'never',
  });

  return {
    capture: (event, properties) => {
      if (event === 'page_view') {
        return;
      }

      instance.capture(event, properties, { send_instantly: true });
    },
    shutdown: () => {
      void instance.shutdown().catch((error) => {
        console.warn('Unable to shut down PostHog analytics.', error);
      });
    },
  };
}

export function createAnalytics(
  measurements?: IDeclarativeFormMeasurements,
): Analytics {
  const providers: Array<Promise<AnalyticsProvider | null>> = [];
  let isShutDown = false;

  if (measurements?.mixpanel) {
    providers.push(
      createMixpanelProvider(measurements.mixpanel).catch((error) => {
        console.warn('Unable to initialize Mixpanel analytics.', error);

        return null;
      }),
    );
  }

  if (measurements?.posthog) {
    providers.push(
      createPostHogProvider(measurements.posthog).catch((error) => {
        console.warn('Unable to initialize PostHog analytics.', error);

        return null;
      }),
    );
  }

  return {
    capture: (event, properties) => {
      if (isShutDown) {
        return;
      }

      for (const provider of providers) {
        void provider.then((initializedProvider) => {
          try {
            initializedProvider?.capture(event, properties);
          } catch (error) {
            console.warn(
              `Unable to capture analytics event "${event}".`,
              error,
            );
          }
        });
      }
    },
    shutdown: () => {
      if (isShutDown) {
        return;
      }

      isShutDown = true;
      for (const provider of providers) {
        void provider.then((initializedProvider) => {
          try {
            initializedProvider?.shutdown();
          } catch (error) {
            console.warn('Unable to shut down an analytics provider.', error);
          }
        });
      }
    },
  };
}
