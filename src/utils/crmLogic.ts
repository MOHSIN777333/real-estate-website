import type {
  HomeCondition,
  LeadInput,
  ListingFilterState,
  ListingRecord,
  SellerTimeline,
} from '../types/realEstate';

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export function slugifyTag(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 36);
}

/**
 * Pure CRM tag automation rule engine matching Lofty-CRM seller funnel behavior.
 * Generates bounded (1-10) tags based on lead intent, timeline, valuation tier,
 * home condition, and localized neighborhood.
 */
export function generateAutomatedCrmTags(input: {
  leadType: LeadInput['leadType'];
  timeline: SellerTimeline;
  estimatedValue: number;
  homeCondition: HomeCondition;
  neighborhood: string;
}): string[] {
  const tags: string[] = [];

  if (input.leadType === 'seller-consultation') {
    tags.push('seller-consultation', 'high-intent-seller');
  } else if (input.leadType === 'home-valuation') {
    tags.push('home-valuation', 'seller-nurture');
  } else if (input.leadType === 'property-inquiry') {
    tags.push('property-inquiry', 'active-browser');
  } else {
    tags.push('general-contact');
  }

  switch (input.timeline) {
    case 'ASAP (0-30 Days)':
      tags.push('timeline-hot-30d');
      break;
    case '1-3 Months':
      tags.push('timeline-warm-90d');
      break;
    case '3-6 Months':
      tags.push('timeline-nurture-6m');
      break;
    case 'Exploring Options':
      tags.push('timeline-exploring');
      break;
  }

  if (input.estimatedValue >= 1500000) {
    tags.push('tier-luxury-1.5m-plus');
  } else if (input.estimatedValue >= 800000) {
    tags.push('tier-premier-800k-plus');
  } else if (input.estimatedValue > 0) {
    tags.push('tier-core-residential');
  }

  if (input.homeCondition === 'Turnkey / Renovated') {
    tags.push('prep-turnkey-launch');
  } else if (input.homeCondition === 'Needs Light Updates' || input.homeCondition === 'Major Renovation') {
    tags.push('prep-staging-advisory');
  }

  const areaSlug = slugifyTag(input.neighborhood);
  if (areaSlug) {
    tags.push(`area-${areaSlug}`.slice(0, 50));
  }

  // Deduplicate and enforce Firestore rules bound (max 10 tags, max 50 chars each)
  return Array.from(new Set(tags)).slice(0, 10);
}

export interface SellerNetProceedsResult {
  lowMarketEstimate: number;
  highMarketEstimate: number;
  estimatedPrepBudget: number;
  projectedNetLow: number;
  projectedNetHigh: number;
  expectedDaysOnMarket: string;
  recommendedStrategy: string;
}

export function calculateSellerNetEstimate(params: {
  estimatedValue: number;
  homeCondition: HomeCondition;
  timeline: SellerTimeline;
}): SellerNetProceedsResult {
  const baseValue = Math.max(150000, Math.min(25000000, Number(params.estimatedValue) || 0));

  let upsideMultiplier = 1.035;
  let prepBudget = 3500;
  let expectedDaysOnMarket = '12–18 Days';
  let recommendedStrategy = 'Editorial Twilight Photography + Private Broker Preview';

  if (params.homeCondition === 'Turnkey / Renovated') {
    upsideMultiplier = 1.05;
    prepBudget = 2500;
    expectedDaysOnMarket = '9–14 Days';
    recommendedStrategy = 'Architectural Showcase + Relocation Buyer Syndication';
  } else if (params.homeCondition === 'Needs Light Updates') {
    upsideMultiplier = 1.025;
    prepBudget = 8500;
    expectedDaysOnMarket = '16–24 Days';
    recommendedStrategy = 'Targeted Paint & Lighting Refresh + Full Staging Package';
  } else if (params.homeCondition === 'Major Renovation') {
    upsideMultiplier = 1.01;
    prepBudget = 0;
    expectedDaysOnMarket = '21–32 Days';
    recommendedStrategy = 'As-Is Investor & Custom Builder Private Network Placement';
  }

  if (params.timeline === 'ASAP (0-30 Days)') {
    expectedDaysOnMarket = '7–14 Days (Accelerated)';
  }

  const lowMarketEstimate = Math.round(baseValue * 0.98);
  const highMarketEstimate = Math.round(baseValue * upsideMultiplier);
  // Typical seller closing costs + brokerage fee ~7.5%
  const sellingCostRate = 0.075;

  const projectedNetLow = Math.round(lowMarketEstimate * (1 - sellingCostRate) - prepBudget);
  const projectedNetHigh = Math.round(highMarketEstimate * (1 - sellingCostRate) - prepBudget);

  return {
    lowMarketEstimate,
    highMarketEstimate,
    estimatedPrepBudget: prepBudget,
    projectedNetLow,
    projectedNetHigh,
    expectedDaysOnMarket,
    recommendedStrategy,
  };
}

export interface LeadValidationErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  propertyAddress?: string;
  neighborhood?: string;
  estimatedValue?: string;
  notes?: string;
}

export function validateLeadForm(input: LeadInput): {
  valid: boolean;
  errors: LeadValidationErrors;
} {
  const errors: LeadValidationErrors = {};
  const name = input.fullName.trim();
  const email = input.email.trim();
  const phone = input.phone.trim();
  const address = input.propertyAddress.trim();
  const neighborhood = input.neighborhood.trim();
  const notes = input.notes.trim();

  if (name.length < 2 || name.length > 100) {
    errors.fullName = 'Please enter your full name (2–100 characters).';
  }
  if (!EMAIL_REGEX.test(email) || email.length < 5 || email.length > 120) {
    errors.email = 'Please enter a valid email address.';
  }
  const phoneDigits = phone.replace(/\D/g, '');
  if (phone.length < 7 || phone.length > 30 || phoneDigits.length < 7) {
    errors.phone = 'Please enter a valid phone number (at least 7 digits).';
  }
  if (address.length < 3 || address.length > 200) {
    errors.propertyAddress = 'Please enter the property street address or general area.';
  }
  if (neighborhood.length < 2 || neighborhood.length > 80) {
    errors.neighborhood = 'Please enter a neighborhood or ZIP code.';
  }
  if (!Number.isFinite(input.estimatedValue) || input.estimatedValue < 0 || input.estimatedValue > 100000000) {
    errors.estimatedValue = 'Estimated value must be between $0 and $100,000,000.';
  }
  if (notes.length > 1000) {
    errors.notes = 'Notes must be 1,000 characters or fewer.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function filterListings(
  listings: ListingRecord[],
  filters: ListingFilterState
): ListingRecord[] {
  const q = filters.query.trim().toLowerCase();

  return listings.filter((item) => {
    if (filters.status !== 'all' && item.status !== filters.status) {
      return false;
    }
    if (filters.propertyType !== 'all' && item.propertyType !== filters.propertyType) {
      return false;
    }
    if (filters.minBeds > 0 && item.beds < filters.minBeds) {
      return false;
    }
    if (filters.maxPrice > 0 && item.price > filters.maxPrice) {
      return false;
    }
    if (q.length > 0) {
      const searchable = `${item.title} ${item.address} ${item.neighborhood} ${item.city} ${item.propertyType}`.toLowerCase();
      if (!searchable.includes(q)) {
        return false;
      }
    }
    return true;
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function sanitizeLeadPayload(input: LeadInput): LeadInput {
  return {
    fullName: input.fullName.trim().slice(0, 100),
    email: input.email.trim().slice(0, 120),
    phone: input.phone.trim().slice(0, 30),
    propertyAddress: input.propertyAddress.trim().slice(0, 200),
    neighborhood: input.neighborhood.trim().slice(0, 80),
    propertyType: input.propertyType,
    estimatedValue: Math.max(0, Math.min(100000000, Math.round(Number(input.estimatedValue) || 0))),
    timeline: input.timeline,
    homeCondition: input.homeCondition,
    leadType: input.leadType,
    preferredSlot: input.preferredSlot.trim().slice(0, 80),
    notes: input.notes.trim().slice(0, 1000),
    sourcePage: input.sourcePage.trim().slice(0, 60) || 'website',
  };
}
