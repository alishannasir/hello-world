import { Link } from 'react-router-dom';
import { ThemeToggle } from '../components/ThemeToggle';

function ShieldIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
    </svg>
  );
}

function YesMark() {
  return (
    <span role="img" aria-label="Yes" className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
        <path d="m5 13 4 4L19 7" />
      </svg>
    </span>
  );
}

function NoMark() {
  return (
    <span role="img" aria-label="No" className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="h-3.5 w-3.5">
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    </span>
  );
}

const HIGHLIGHTS = [
  {
    icon: ShieldIcon,
    title: 'Verified 18+ community',
    text: 'Adults only. Age verification and strict enforcement keep minors out.',
  },
  {
    icon: EyeIcon,
    title: 'Active moderation',
    text: 'Automated scanning plus a human moderation team, with one-tap reporting.',
  },
  {
    icon: UsersIcon,
    title: 'Friends & streaks',
    text: 'Keep the people you click with, chat again, and build daily streaks.',
  },
];

const COMPARISON = [
  { feature: 'Verified 18+ only', us: true, them: false },
  { feature: 'Active moderation & reporting', us: true, them: false },
  { feature: 'Gender & country filters', us: true, them: false },
  { feature: 'Friend list to reconnect', us: true, them: false },
  { feature: 'Streak rewards', us: true, them: false },
  { feature: 'Modern, fast interface', us: true, them: false },
  { feature: 'Random 1:1 video matching', us: true, them: true },
];

const FAQS = [
  {
    q: 'How does matching work?',
    a: 'Tap Start Chat and we instantly pair you with another online user at random. Skip at any time to get a new match, and use filters on paid plans to narrow who you meet.',
  },
  {
    q: 'Is it free?',
    a: 'Yes. The free plan lets you chat every day with some limits. Paid plans remove ads and unlock filters, longer chat time, and a bigger friend list.',
  },
  {
    q: 'How do filters work?',
    a: 'Gender and country filters restrict the matching pool so you only get paired with people who fit your preferences. Filters are available on the Premium plan.',
  },
  {
    q: 'How does the friend list work?',
    a: 'If you enjoy a conversation, send a friend request during or after the call. Once accepted, you can message and call each other again anytime from your friends page.',
  },
  {
    q: 'How do I report someone?',
    a: 'Use the report button visible during and after every call. Our moderation team reviews reports quickly, and violators are banned.',
  },
  {
    q: 'How is my data handled?',
    a: 'Video calls are streamed live and not stored. We keep only the account data needed to run the service. See our Privacy Policy for full details.',
  },
  {
    q: 'How do I cancel a subscription?',
    a: 'You can cancel anytime from your account billing settings. Your plan stays active until the end of the current billing period, with no further charges.',
  },
  {
    q: 'Is it safe for under-18s?',
    a: 'No. This platform is strictly for adults aged 18 and over. We enforce this with age verification and active moderation, and underage accounts are removed.',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="font-heading text-lg font-bold">Online Video Chat</span>
          <div className="flex items-center gap-4">
            <Link
              to="/pricing"
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            >
              Pricing
            </Link>
            <Link
              to="/login"
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            >
              Log in
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 lg:grid-cols-2 lg:py-24">
          <div className="flex flex-col gap-6 text-center lg:text-left animate-fade-in-up">
            <h1 className="text-4xl font-bold sm:text-5xl">Meet someone new.</h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Random 1:1 video chat with people around the world. 18+ only.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                to="/signup"
                className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-8 py-4 text-center text-lg font-semibold text-zinc-950 transition-colors"
              >
                Sign Up
              </Link>
              <Link
                to="/home"
                className="rounded-xl border border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 dark:hover:border-zinc-500 px-8 py-4 text-center text-lg transition-colors"
              >
                Start Chat
              </Link>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-emerald-600 dark:text-emerald-400 underline hover:no-underline"
              >
                Log in
              </Link>
            </p>
            <p className="text-xs text-zinc-500">
              By continuing you agree to our{' '}
              <Link to="/terms" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">
                Terms
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
          <div className="animate-fade-in">
            <video
              className="aspect-video w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 object-cover shadow-lg"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="/demo-poster.jpg"
              aria-label="Product demo video showing a live 1:1 video chat"
            >
              <source src="/demo.mp4" type="video/mp4" />
              Your browser does not support embedded video.
            </video>
          </div>
        </section>

        {/* About */}
        <section
          aria-labelledby="about-heading"
          className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40"
        >
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 id="about-heading" className="text-3xl font-bold">
              A better way to meet people
            </h2>
            <p className="mt-4 max-w-3xl text-zinc-600 dark:text-zinc-400">
              This is live 1:1 video chat for meeting new people around the world. Tap start and
              get matched instantly with another person for a real face-to-face conversation.
              It is built for adults 18 and over who want genuine connections, not chaos. Active
              moderation, verified ages, and one-tap reporting keep the community safe.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6"
                >
                  <div className="text-emerald-600 dark:text-emerald-400">
                    <Icon />
                  </div>
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section aria-labelledby="compare-heading" className="mx-auto max-w-6xl px-6 py-16">
          <h2 id="compare-heading" className="text-3xl font-bold">
            How we compare
          </h2>
          <p className="mt-4 max-w-3xl text-zinc-600 dark:text-zinc-400">
            Random video chat is not new. A safe, modern take on it is.
          </p>
          <div className="mt-8 overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Feature
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                    Us
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-zinc-500">
                    Typical random chat sites
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map(({ feature, us, them }) => (
                  <tr key={feature} className="border-b border-zinc-200 dark:border-zinc-800 last:border-b-0">
                    <th scope="row" className="px-4 py-3 font-medium">
                      {feature}
                    </th>
                    <td className="px-4 py-3">{us ? <YesMark /> : <NoMark />}</td>
                    <td className="px-4 py-3">{them ? <YesMark /> : <NoMark />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Comparison reflects commonly available features on generic random video chat services
            and may vary by platform.
          </p>
        </section>

        {/* FAQ */}
        <section
          aria-labelledby="faq-heading"
          className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40"
        >
          <div className="mx-auto max-w-3xl px-6 py-16">
            <h2 id="faq-heading" className="text-3xl font-bold">
              Frequently asked questions
            </h2>
            <div className="mt-8 flex flex-col gap-3">
              {FAQS.map(({ q, a }) => (
                <details
                  key={q}
                  className="group rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                    {q}
                    <span
                      aria-hidden="true"
                      className="text-zinc-400 transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-xs text-zinc-500 sm:flex-row">
          <span>18+ only. Be kind, stay safe.</span>
          <div className="flex gap-4">
            <Link to="/terms" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">
              Terms
            </Link>
            <Link to="/privacy" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
