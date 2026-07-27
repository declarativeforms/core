export type RendererOptions = {
  apiBaseUrl?: string;
};

let apiBaseUrl = '/api/v1';

export function configureRenderer(options: RendererOptions): void {
  if (options.apiBaseUrl) {
    apiBaseUrl = options.apiBaseUrl.replace(/\/$/, '');
  }
}

export function getBackendUrl(path: string): string {
  return `${apiBaseUrl}/${path.replace(/^\//, '')}`;
}
