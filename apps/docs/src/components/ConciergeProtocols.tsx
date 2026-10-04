interface ConciergePillar {
  readonly protocol: string;
  readonly icon: string;
  readonly title: string;
  readonly body: string;
  readonly footnoteIcon: string;
  readonly footnote: string;
}

const PILLARS: readonly ConciergePillar[] = [
  {
    protocol: 'Protocol One',
    icon: 'shield',
    title: 'PJP Encryption & Manifest Secrecy',
    body: 'Passenger manifests, itinerary coordinates, and diplomatic clearance filings are secured behind air-gapped cryptographic vaults. Complete anonymity guaranteed across international civil aviation authorities.',
    footnoteIcon: 'lock',
    footnote: 'Zero-Knowledge Architecture',
  },
  {
    protocol: 'Protocol Two',
    icon: 'directions_car',
    title: 'Direct Tarmac Armored Chauffeur Transfer',
    body: 'Eliminate traditional terminal transitions entirely. Chauffeur vehicles approach the jet airstairs directly under customs pre-clearance at participating private FBO ramps globally.',
    footnoteIcon: 'verified',
    footnote: 'Airside Escort Permitted',
  },
  {
    protocol: 'Protocol Three',
    icon: 'restaurant',
    title: 'Michelin-Starred Inflight Atelier',
    body: 'Curated high-altitude gastronomic menus prepared by dedicated onboard chefs. Cellared grand cru wines, temperature-regulated caviar service, and bespoke dietary adaptations.',
    footnoteIcon: 'wine_bar',
    footnote: 'Sommelier Approved Pressurization',
  },
] as const;

/** 5. Executive Concierge & Diplomatic Protocol — three quiet pillars. */
export function ConciergeProtocols() {
  return (
    <section className="py-28 max-w-7xl mx-auto px-6 md:px-10" data-reveal id="concierge">
      <div className="max-w-3xl mb-20">
        <span className="block font-label-caps text-label-caps uppercase tracking-[0.34em] text-champagne mb-6">
          The Standard
        </span>
        <h2 className="font-headline text-headline-xl-mobile md:text-headline-xl text-on-surface mb-5">
          Discretion, gastronomy and ground handling.
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
          Every detail outside the cockpit is orchestrated with the same uncompromising discipline
          applied to transcontinental navigation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PILLARS.map((pillar) => (
          <div
            className="glass-cockpit concierge-card rounded-sm p-8 flex flex-col justify-between"
            key={pillar.protocol}
          >
            <div>
              <div className="icon-box w-14 h-14 rounded-sm flex items-center justify-center text-champagne mb-7 border border-champagne-hairline">
                <span className="material-symbols-outlined text-[26px]">{pillar.icon}</span>
              </div>
              <span className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-3">
                {pillar.protocol}
              </span>
              <h3 className="font-headline text-headline-lg text-on-surface mb-4">{pillar.title}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                {pillar.body}
              </p>
            </div>
            <div className="mt-8 pt-5 border-t border-champagne-hairline flex items-center gap-2 font-label-caps text-label-caps uppercase text-champagne">
              <span className="material-symbols-outlined text-[16px]">{pillar.footnoteIcon}</span>
              <span>{pillar.footnote}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
