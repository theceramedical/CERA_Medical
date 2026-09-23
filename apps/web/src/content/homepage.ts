import {
  Activity,
  Bone,
  CalendarCheck,
  ClipboardList,
  HeartPulse,
  Leaf,
  MessageSquare,
  Search,
  ShieldCheck,
  Stethoscope,
  Sun,
  TestTube,
  UserRound,
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

/**
 * The homepage's content, transcribed from the reference image (design-language.md section 6).
 *
 * **Placeholder pending CERA content approval (PRD 22).** Phase 06 replaces the services with the
 * Vendure catalogue and Phase 05 replaces the articles with Payload documents; the section components
 * take these shapes as props, so that swap changes this file and the data source and nothing else.
 *
 * **Why this is not `@cera/contracts/fixtures`.** The fixture package says plainly that nothing in it
 * is imported by application code, and it is right to: every fixture is wrapped in a `Fixture` marker,
 * carries test email domains and synthetic subject ids, and pulls twelve enquiries and their histories
 * along with it. Bundling that into a client build to render six card titles would be a poor trade, and
 * the marker exists precisely so fixture data cannot be mistaken for real data at runtime.
 *
 * The cost of the separation is that the same words exist twice, which is a drift risk - so
 * `homepage.test.ts` imports both and asserts they agree. A test can reach the fixtures where the
 * application cannot, so the duplication is pinned without the coupling.
 */

export interface ServiceSummary {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly icon: LucideIcon;
}

/**
 * The six services in the reference's card row.
 *
 * The icons are a judgement, not data - the reference draws generic glyphs and lucide has no
 * "orthopaedics" icon - so they live here beside the copy rather than in the catalogue. Phase 06 keeps
 * this mapping when the titles start coming from Vendure, because an icon is a presentation decision
 * and putting it in the catalogue would make it a merchandising field nobody maintains.
 */
export const HOMEPAGE_SERVICES: readonly ServiceSummary[] = [
  {
    slug: 'general-health',
    title: 'General Health',
    description: 'Comprehensive care for everyday health needs.',
    icon: Stethoscope,
  },
  {
    slug: 'cardiology',
    title: 'Cardiology',
    description: 'Expert care for a healthier heart.',
    icon: HeartPulse,
  },
  {
    slug: 'orthopaedics',
    title: 'Orthopaedics',
    description: 'Getting you moving with confidence.',
    icon: Bone,
  },
  {
    slug: 'womens-health',
    title: "Women's Health",
    description: 'Specialist care for every stage of life.',
    icon: UserRound,
  },
  {
    slug: 'diagnostic-tests',
    title: 'Diagnostic Tests',
    description: 'Accurate results for better care.',
    icon: TestTube,
  },
  {
    slug: 'wellness-preventive-care',
    title: 'Wellness & Preventive Care',
    description: 'Stay healthy today and tomorrow.',
    icon: Leaf,
  },
];

export interface ProcessStepContent {
  readonly title: string;
  readonly description: string;
  readonly icon: LucideIcon;
}

export const HOMEPAGE_PROCESS: readonly ProcessStepContent[] = [
  {
    title: 'Explore',
    description: 'Browse our services and find the right care for you.',
    icon: Search,
  },
  {
    title: 'Enquire',
    description: 'Submit a simple enquiry through our secure form.',
    icon: MessageSquare,
  },
  {
    title: 'Follow Up',
    description: 'Track your enquiry and stay updated in your account.',
    icon: CalendarCheck,
  },
];

export interface ArticleSummary {
  readonly slug: string;
  readonly category: string;
  readonly title: string;
  readonly excerpt: string;
}

export const HOMEPAGE_ARTICLES: readonly ArticleSummary[] = [
  {
    slug: '5-simple-habits-for-a-healthier-you',
    category: 'Wellness',
    title: '5 Simple Habits for a Healthier You',
    excerpt: 'Small changes can make a big difference to your long-term health.',
  },
  {
    slug: 'the-role-of-nutrition-in-wellbeing',
    category: 'Nutrition',
    title: 'The Role of Nutrition in Wellbeing',
    excerpt: 'Discover how the right diet can support your physical and mental health.',
  },
  {
    slug: 'understanding-heart-health',
    category: 'Heart Health',
    title: 'Understanding Heart Health',
    excerpt: 'Learn about key risk factors and how to keep your heart healthy.',
  },
];

export interface TrustItem {
  readonly label: string;
  readonly icon: LucideIcon;
}

/** The three-item row beneath the hero's buttons. */
export const HERO_TRUST_ITEMS: readonly TrustItem[] = [
  { label: 'Trusted Information', icon: ShieldCheck },
  { label: 'Patient Focused', icon: Activity },
  { label: 'A Healthier Tomorrow', icon: Sun },
];

/**
 * The hero's words, as data rather than inline JSX.
 *
 * The headline is split because the reference sets line one in navy and line two in teal, and the two
 * have to render inside a single `<h1>`. Keeping the halves as separate strings makes that explicit -
 * and makes it obvious that the split is a colour decision, not two headings.
 */
export const HERO = {
  eyebrow: 'Your Health, Our Priority.',
  headlinePrimary: 'Trusted Medical Services,',
  headlineAccent: 'Made Easier to Access.',
  body: 'Clear information. Simple enquiries. Better care for a healthier tomorrow.',
  badge: {
    title: 'Real People Real Care',
    body: 'Access the right services with confidence.',
    icon: ClipboardList,
  },
} as const;

export const CTA_BAND = {
  heading: 'Need help finding the right service?',
  body: 'Our team is here to help you with any questions.',
} as const;
