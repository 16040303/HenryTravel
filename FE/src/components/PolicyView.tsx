import { Link, Navigate, useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const policyKeys = {
  stay: {
    title: 'policy.stay.title',
    subtitle: 'policy.stay.subtitle',
    paragraphs: ['policy.stay.p1', 'policy.stay.p2', 'policy.stay.p3', 'policy.stay.p4'],
  },
  hold: {
    title: 'policy.hold.title',
    subtitle: 'policy.hold.subtitle',
    paragraphs: ['policy.hold.p1', 'policy.hold.p2', 'policy.hold.p3', 'policy.hold.p4'],
  },
  secure: {
    title: 'policy.secure.title',
    subtitle: 'policy.secure.subtitle',
    paragraphs: ['policy.secure.p1', 'policy.secure.p2', 'policy.secure.p3', 'policy.secure.p4'],
  },
} as const;

type PolicyKey = keyof typeof policyKeys;

export default function PolicyView() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLanguage();
  const policy = slug && slug in policyKeys ? policyKeys[slug as PolicyKey] : null;

  if (!policy) return <Navigate to="/" replace />;

  return (
    <section className="relative overflow-hidden bg-[#fcf9f8] px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-br from-[#003b6f] via-[#0071c2] to-[#fe6a34] opacity-95" />
      <div className="relative mx-auto max-w-4xl">
        <Link to="/" className="mb-6 inline-flex rounded-full bg-white/15 px-4 py-2 text-xs font-black text-white backdrop-blur hover:bg-white/25">
          ← {t('policy.backHome')}
        </Link>

        <article className="rounded-[2rem] border border-white/60 bg-white p-6 shadow-2xl shadow-sky-950/10 sm:p-10">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-[#fe6a34]">{t('policy.tag')}</p>
          <h1 className="font-display text-3xl font-black tracking-tight text-neutral-900 sm:text-5xl">{t(policy.title)}</h1>
          <p className="mt-4 text-sm font-semibold leading-7 text-neutral-500 sm:text-base">{t(policy.subtitle)}</p>

          <div className="mt-8 space-y-5 text-sm font-medium leading-8 text-neutral-700 sm:text-base">
            {policy.paragraphs.map((paragraphKey) => (
              <p key={paragraphKey} className="rounded-2xl border border-neutral-100 bg-neutral-50/70 p-4">
                {t(paragraphKey)}
              </p>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
