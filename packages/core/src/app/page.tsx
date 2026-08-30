import { redirect } from 'next/navigation';

/**
 * The root has no form of its own. This was a client-side
 * `window.location.replace` in the SPA; now it is a real redirect.
 */
export default function HomePage() {
  redirect('https://github.com/declarativeforms');
}
