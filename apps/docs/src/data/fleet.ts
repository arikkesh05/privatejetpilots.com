export interface FleetDimension {
  readonly label: string;
  readonly value: string;
}

export interface FleetCraft {
  readonly id: string;
  readonly model: string;
  /** Editorial positioning line set above the model name. */
  readonly eyebrow: string;
  readonly image: string;
  readonly imageAlt: string;
  /** Editorial caption set into the image crop. */
  readonly imageCaption: string;
  readonly blurb: string;
  /** Range, cruise speed and guest capacity — the only figures shown on the landing. */
  readonly dimensions: readonly FleetDimension[];
  readonly cta: { readonly label: string; readonly icon: string };
}

export const FLEET: readonly FleetCraft[] = [
  {
    id: 'gulfstream-g700',
    model: 'Gulfstream G700',
    eyebrow: 'Ultra-Long-Range Flagship',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDDynLPkKELAwfgCQoNO4lj6HU-qB2r4M-7ItA2R0L0tP3atmt73qupxHfJtD_qzOLjB9K3XnzWAA4BSs_wA5rIqeNEtDsDOZrULMsUtOqcTcAW58ouuPe0iEJECe1Tvjj7Is7rh0NNIG6T9IJKNi0KLcCL4iJh0rgCBsZB81cMo_YiFFii7E-2a-lGJtl-C1QjR50pSpnCL6pQqnNOeGITR4VYgR6cJXuCRKq1aSO4C9UECZNHgLAOtg',
    imageAlt:
      'Modern ultra-luxurious private jet interior cabin featuring tailored cream leather swivel seats, walnut burl wood consoles, warm ambient LED reading fixtures, and a quiet executive cabin atmosphere bathed in golden hour twilight.',
    imageCaption: 'Five living areas in one continuous cabin',
    blurb:
      'The pinnacle of cabin volume and whisper-quiet flight. Outfitted with bespoke circadian lighting and 100% fresh air replenishment every two minutes.',
    dimensions: [
      { label: 'Range', value: '7,750 NM' },
      { label: 'Mach speed', value: 'Mach 0.935' },
      { label: 'Guest capacity', value: 'Up to 19' },
    ],
    cta: { label: 'Request This Aircraft', icon: 'arrow_forward' },
  },
  {
    id: 'bombardier-global-7500',
    model: 'Bombardier Global 7500',
    eyebrow: 'Transcontinental Private Suite',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAv7QxJ2Vib-6qNZPJBzVDPBeb5yNvBo9Mj6EpqJ3w_juPGsOPkgVxIhcODjkhzerlyTkTY4WneiupvUiQpSYvycNjP-h_0iMACD_nI5ZzXF1op6qAPyfmG390dLAZtUzuQttQ6kJp7Amy6J_7QZyCggbtTjfgxZUFIQ1gMhWj_UJsvC6ak3G773q2B07MMEU_OSw35BWY-G0Jew38Jw4HfQFKMnAx0Owzotc4ahMhYsV1dqR6UcB7eiQ',
    imageAlt:
      'Executive private jet master bedroom en-suite with an actual queen size bed, soft satin linens, and private shower bath facility in a heavy business jet cabin cruising above the night sky.',
    imageCaption: 'Master suite with en-suite shower',
    blurb:
      'Featuring the revolutionary Smooth Flx Wing for an unmatched tranquil ride. Configured with a permanent master suite, full-size bed, and stand-up shower.',
    dimensions: [
      { label: 'Range', value: '7,700 NM' },
      { label: 'Mach speed', value: 'Mach 0.925' },
      { label: 'Guest capacity', value: 'Up to 19' },
    ],
    cta: { label: 'Request This Aircraft', icon: 'arrow_forward' },
  },
  {
    id: 'dassault-falcon-10x',
    model: 'Dassault Falcon 10X',
    eyebrow: 'Widest Cabin in Class',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAjcNB0PZtKuxlAV_QUgxU9B5YK8evAvrtHZp_SaA758dnPBYXZgm_zAFty7UucOgRVLXU7iWKMyv9DnW-esxgHxBKJaMOjjrAwsYnq7Hz-lZO8TlOzvg0ijBbWmoaTrHuVkEzv0EOe-RaY3z8OYiYJpD28IKcrA3MEbP8YSk-j453xsw1AF7g6ub9fAD_iK02TBxHszGlGPishiBOMRVjLCp7duy-XNEQgHEvBM7oa4ESCQVZDet5U3A',
    imageAlt:
      'Futuristic glass cockpit flight deck of an ultra-modern business jet with glowing heads-up display symbology, synthetic vision multi-function touch screens, and pilots hands on high-tech flight controls.',
    imageCaption: 'Nine feet one inch across',
    blurb:
      'The penthouse of the skies. Fly-by-wire flight control derived from a fighter lineage, with a single-throttle automated recovery system and panoramic acoustic dampening.',
    dimensions: [
      { label: 'Range', value: '7,500 NM' },
      { label: 'Mach speed', value: 'Mach 0.925' },
      { label: 'Guest capacity', value: 'Up to 19' },
    ],
    cta: { label: 'Request This Aircraft', icon: 'arrow_forward' },
  },
] as const;
