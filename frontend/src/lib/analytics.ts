type Props = Record<string, unknown>;

const KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const HOST =
  (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://us.i.posthog.com';

// posthog-js is lazy-loaded so analytics never blocks first paint, and every
// helper is a no-op when VITE_POSTHOG_KEY is unset (local dev, self-hosters).
let client: { capture: (e: string, p?: Props) => void; identify: (id: string) => void } | null =
  null;
let ready: Promise<void> | null = null;

export function initAnalytics(): void {
  if (!KEY || ready) return;
  ready = import('posthog-js')
    .then(({ default: posthog }) => {
      posthog.init(KEY, {
        api_host: HOST,
        capture_pageview: false, // pageviews are captured manually on route change
        persistence: 'localStorage',
        autocapture: false,
      });
      client = posthog;
    })
    .catch(() => undefined); // analytics failures must never break the app
}

export function track(event: string, props?: Props): void {
  if (!KEY) return;
  ready?.then(() => client?.capture(event, props));
}

export function trackPageview(path: string): void {
  if (!KEY) return;
  ready?.then(() =>
    client?.capture('$pageview', { $current_url: window.location.origin + path }),
  );
}

export function identify(userId: string): void {
  if (!KEY) return;
  ready?.then(() => client?.identify(userId));
}
