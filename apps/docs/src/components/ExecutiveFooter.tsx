/* Each footer destination resolves to a section that actually exists on the
   deck — no link is pointed at a placeholder anchor. */
const FOOTER_LINKS = [
  { label: 'The Fleet', href: '#fleet' },
  { label: 'Charter Enquiry', href: '#charter' },
  { label: 'Concierge Protocols', href: '#concierge' },
  { label: 'Charter Terms', href: '#concierge' },
] as const;

/* WCAG 2.5.8 — a text link's box, not its type size, is the target. The caps
   tier sets a 16px line box, so the hit area is grown back out to the 24px
   minimum with vertical padding, centred on the same baseline. `inline-flex`
   keeps the links flow-level inside the wrapping row instead of turning them
   into blockified flex children that would collapse the gutter. */
const LINK_CLASS =
  'inline-flex items-center min-h-[24px] px-0.5 -mx-0.5 text-on-surface-variant font-label-caps text-label-caps uppercase hover:text-champagne-bright transition-colors duration-300';

/** 6. Footer — flat editorial close, no shadows, no glow. */
export function ExecutiveFooter() {
  return (
    <footer className="bg-charcoal-black border-t border-champagne-hairline" data-reveal>
      <div className="w-full max-w-7xl mx-auto px-6 md:px-10 py-14 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div>
            <span className="block uppercase text-brand-lockup text-on-surface">
              PJP // PRIVATE JET PILOTS
            </span>
            <span className="block font-label-caps text-label-caps uppercase text-on-surface-variant mt-1.5">
              © 2025 PJP Private Jet Pilots Flight Operations
            </span>
          </div>
        </div>

        <div className="flex flex-wrap justify-center md:justify-end gap-x-7 gap-y-3">
          {FOOTER_LINKS.map((link) => (
            <a className={LINK_CLASS} href={link.href} key={link.label}>
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
