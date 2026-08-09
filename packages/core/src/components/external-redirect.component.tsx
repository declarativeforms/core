export function ExternalRedirect({ url }: { url: string }) {
  window.location.replace(url);
  return null;
}
