export type IDeclarativeFormAnalyticsProvider =
  | string
  | {
      token: string;
      api_host?: string;
    };

export type IDeclarativeFormMeasurements = {
  mixpanel?: IDeclarativeFormAnalyticsProvider;
  posthog?: IDeclarativeFormAnalyticsProvider;
};
