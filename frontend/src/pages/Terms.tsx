import { Link } from 'react-router-dom';

// PLACEHOLDER legal copy. Have qualified counsel review and replace this
// before public launch - it is a template, not legal advice.
const SECTIONS: { title: string; body: string }[] = [
  {
    title: '1. Eligibility (18+)',
    body: 'You must be at least 18 years old to use this service. We verify age at signup and permanently ban accounts found to belong to minors. Suspected underage use is reported and escalated.',
  },
  {
    title: '2. Acceptable use',
    body: 'Nudity, sexual content, harassment, hate speech, spam, recording other users without consent, and any illegal activity are prohibited. Video calls are sampled by automated moderation systems, and other users can report you at any time.',
  },
  {
    title: '3. Enforcement',
    body: 'We may suspend or permanently ban accounts that violate these terms, at our sole discretion, with or without notice. Automated systems may end a call immediately when a violation is detected.',
  },
  {
    title: '4. Subscriptions',
    body: 'Paid plans are billed through Stripe and renew automatically until cancelled. You can cancel anytime from the billing portal; access continues until the end of the paid period. Fees are non-refundable except where required by law.',
  },
  {
    title: '5. Availability',
    body: 'The service is offered only in supported countries and may be unavailable, interrupted, or changed at any time. We provide the service "as is" without warranties of any kind.',
  },
  {
    title: '6. Liability',
    body: 'You interact with strangers at your own risk. To the maximum extent permitted by law, we are not liable for the conduct of other users or for indirect or consequential damages.',
  },
];

export default function Terms() {
  return (
    <main className="min-h-screen max-w-md mx-auto flex flex-col gap-5 p-6">
      <h1 className="text-2xl font-bold">Terms of Service</h1>
      <p className="text-xs text-zinc-500">Last updated: July 2026 (placeholder - pending legal review)</p>
      {SECTIONS.map((section) => (
        <section key={section.title} className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-zinc-200">{section.title}</h2>
          <p className="text-sm text-zinc-400">{section.body}</p>
        </section>
      ))}
      <div className="flex gap-4 pt-2 text-sm">
        <Link to="/privacy" className="text-emerald-400 hover:text-emerald-300">
          Privacy Policy
        </Link>
        <Link to="/" className="text-zinc-400 hover:text-zinc-200">
          Back
        </Link>
      </div>
    </main>
  );
}
