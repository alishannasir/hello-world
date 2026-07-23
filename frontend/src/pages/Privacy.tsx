import { Link } from 'react-router-dom';

// PLACEHOLDER legal copy. Have qualified counsel review and replace this
// before public launch - it is a template, not legal advice.
const SECTIONS: { title: string; body: string }[] = [
  {
    title: '1. Data we collect',
    body: 'Account data (email, display name, birthdate, gender, country), usage data (matches, chat time, streaks), friend connections and messages, reports you make or receive, and billing status via Stripe. We do not store your card details.',
  },
  {
    title: '2. Video and moderation',
    body: 'Video and audio streams flow through our media provider (LiveKit) and are not recorded or stored by us. For safety, small periodic snapshots of your own video may be analysed by an automated moderation provider during calls; flagged results are retained for review.',
  },
  {
    title: '3. How we use data',
    body: 'To match you with other users, enforce plan limits and safety rules, process payments, and improve the product via aggregated analytics. We do not sell your personal data.',
  },
  {
    title: '4. Location',
    body: 'Your approximate country is derived from your IP address to enforce regional availability and to power country matching filters. We do not collect precise location.',
  },
  {
    title: '5. Retention and deletion',
    body: 'Account data is kept while your account is active. You may request deletion of your account and associated data; safety records (reports, bans) may be retained where legally required.',
  },
  {
    title: '6. Contact',
    body: 'For privacy requests, contact the support address listed on our site. EU/UK users have rights under GDPR including access, correction, and erasure.',
  },
];

export default function Privacy() {
  return (
    <main className="min-h-screen max-w-md mx-auto flex flex-col gap-5 p-6">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>
      <p className="text-xs text-zinc-500">Last updated: July 2026 (placeholder - pending legal review)</p>
      {SECTIONS.map((section) => (
        <section key={section.title} className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-zinc-200">{section.title}</h2>
          <p className="text-sm text-zinc-400">{section.body}</p>
        </section>
      ))}
      <div className="flex gap-4 pt-2 text-sm">
        <Link to="/terms" className="text-emerald-400 hover:text-emerald-300">
          Terms of Service
        </Link>
        <Link to="/" className="text-zinc-400 hover:text-zinc-200">
          Back
        </Link>
      </div>
    </main>
  );
}
