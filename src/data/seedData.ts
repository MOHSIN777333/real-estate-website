import type { ListingRecord, SiteBrandSettings } from '../types/realEstate';

export const HERO_IMAGE_URL = '/src/assets/images/hero_modern_residence_1795550902680.jpg';
export const AGENT_PORTRAIT_URL = '/src/assets/images/agent_portrait_claire_1795550902395.jpg';

export const DEFAULT_BRAND_SETTINGS: SiteBrandSettings = {
  agencyName: 'Hartwell Realty',
  agentName: 'Claire Hartwell',
  agentTitle: 'Principal Broker & Seller Advisor',
  licenseNumber: 'TX Broker #0719482',
  cityRegion: 'Austin, Texas',
  officeAddress: '1408 South Congress Ave, Suite 210, Austin, TX 78704',
  officePhone: '(512) 555-0194',
  officeEmail: 'claire@hartwellrealty.com',
  accentColor: '#0F2922',
  fontStyle: 'editorial-serif',
  heroHeadline: 'Sell Your Austin Home With Precision Pricing and Editorial Reach.',
  heroSubheadline:
    'Independent, high-touch listing representation built to attract qualified buyers and maximize your net proceeds—without big-box brokerage overhead.',
  agentBio:
    'With 11 years advising Austin homeowners across Zilker, Barton Creek, Tarrytown, and East Austin, Claire Hartwell combines hyper-local pricing analytics, bespoke architectural staging, and direct buyer outreach to close listings faster and above neighborhood averages.',
  updatedAt: new Date('2026-11-01T10:00:00Z'),
};

export const SEED_LISTINGS: ListingRecord[] = [
  {
    id: 'listing-barton-creek-ridge',
    title: 'Barton Creek Limestone Pavilion',
    address: '4108 Ridgeway Bluff',
    neighborhood: 'Barton Creek',
    city: 'Austin',
    price: 2450000,
    beds: 4,
    baths: 4.5,
    sqft: 4180,
    lotSqft: 16500,
    status: 'for-sale',
    propertyType: 'Modern Estate',
    daysOnMarket: 9,
    saleToListRatio: 'Active',
    imageUrl: '/src/assets/images/listing_barton_creek_1795550902795.jpg',
    description:
      'Architectural native limestone and cedar residence overlooking the Barton Creek greenbelt, featuring zero-edge lap pool, floor-to-ceiling steel glazing, and private guest casita.',
    highlights: [
      'Unobstructed greenbelt and skyline views',
      'Zero-edge heated lap pool & limestone terrace',
      'White oak chef kitchen with Gaggenau suite',
      'Private detached studio / guest casita',
    ],
    featured: true,
    createdAt: new Date('2026-11-12T10:00:00Z'),
    updatedAt: new Date('2026-11-12T10:00:00Z'),
  },
  {
    id: 'listing-zilker-craftsman',
    title: 'Zilker Park Modern Craftsman',
    address: '1428 Kinney Ave',
    neighborhood: 'Zilker',
    city: 'Austin',
    price: 1385000,
    beds: 4,
    baths: 3,
    sqft: 2740,
    lotSqft: 7850,
    status: 'sold',
    propertyType: 'Single Family',
    daysOnMarket: 11,
    saleToListRatio: '103.8%',
    imageUrl: '/src/assets/images/listing_zilker_bungalow_1795550903574.jpg',
    description:
      'Thoughtfully reimagined two-story residence steps from Zilker Park. Staged, photographed, and marketed through our private seller launch—securing four competing offers in 11 days.',
    highlights: [
      'Sold 3.8% above asking in 11 days',
      'Custom steel-framed windows and white oak floors',
      'Xeriscaped native Texas limestone front garden',
      'Walkable to Barton Springs & South Lamar dining',
    ],
    featured: true,
    createdAt: new Date('2026-10-18T10:00:00Z'),
    updatedAt: new Date('2026-10-29T10:00:00Z'),
  },
  {
    id: 'listing-east-austin-courtyard',
    title: 'East Cesar Chavez Courtyard House',
    address: '2315 Holly Street',
    neighborhood: 'East Austin',
    city: 'Austin',
    price: 1120000,
    beds: 3,
    baths: 2.5,
    sqft: 2310,
    lotSqft: 6100,
    status: 'for-sale',
    propertyType: 'Single Family',
    daysOnMarket: 6,
    saleToListRatio: 'Active',
    imageUrl: '/src/assets/images/listing_east_austin_loft_1795550904063.jpg',
    description:
      'Sunlit architectural courtyard home blending board-formed concrete, honed marble waterfall island, and retractable 16-foot glass sliders opening to a private dining garden.',
    highlights: [
      '16-foot pocketing glass wall to garden patio',
      'Honed Carrara marble island & Lacanche range',
      'Polished concrete & rift-sawn oak ceilings',
      'Two blocks from Lady Bird Lake hike & bike trail',
    ],
    featured: true,
    createdAt: new Date('2026-11-18T10:00:00Z'),
    updatedAt: new Date('2026-11-18T10:00:00Z'),
  },
  {
    id: 'listing-tarrytown-oak-estate',
    title: 'Tarrytown Live Oak Residence',
    address: '2709 Windsor Road',
    neighborhood: 'Tarrytown',
    city: 'Austin',
    price: 2890000,
    beds: 5,
    baths: 4.5,
    sqft: 4650,
    lotSqft: 14200,
    status: 'sold',
    propertyType: 'Modern Estate',
    daysOnMarket: 14,
    saleToListRatio: '101.9%',
    imageUrl: '/src/assets/images/hero_modern_residence_1795550902680.jpg',
    description:
      'Represented the sellers from pre-listing refresh through private relocation buyer closing. Strategic pricing and twilight architectural campaign captured a cash buyer in two weeks.',
    highlights: [
      'Sold off-market preview + 14-day public launch',
      '101.9% sale-to-list ratio with zero contingencies',
      'Canopy of century-old heritage live oaks',
      'Full outdoor kitchen & saltwater plunge pool',
    ],
    featured: false,
    createdAt: new Date('2026-09-25T10:00:00Z'),
    updatedAt: new Date('2026-10-10T10:00:00Z'),
  },
  {
    id: 'listing-south-congress-townhome',
    title: 'South Congress Architectural Townhome',
    address: '1812 Drake Ave #B',
    neighborhood: 'South Congress',
    city: 'Austin',
    price: 945000,
    beds: 3,
    baths: 2.5,
    sqft: 1980,
    lotSqft: 3400,
    status: 'pending',
    propertyType: 'Townhome',
    daysOnMarket: 10,
    saleToListRatio: 'Under Contract',
    imageUrl: '/src/assets/images/listing_east_austin_loft_1795550904063.jpg',
    description:
      'Lock-and-leave architectural townhome in 78704 with private fenced courtyard, custom millwork, and rooftop terrace overlooking downtown Austin.',
    highlights: [
      'Under contract in 10 days on market',
      'Private rooftop deck with skyline views',
      'Steps from South Congress boutiques & cafes',
      'EV-ready 2-car garage with epoxy finish',
    ],
    featured: false,
    createdAt: new Date('2026-11-10T10:00:00Z'),
    updatedAt: new Date('2026-11-20T10:00:00Z'),
  },
];

export const SELLER_TESTIMONIALS = [
  {
    quote:
      'We interviewed three large franchise teams before choosing Claire. Her pre-listing prep roadmap cost us under $4,000, and our Zilker home drew four offers and closed $52,000 over asking in 11 days.',
    author: 'Marcus & Elena Vance',
    detail: 'Sold 1428 Kinney Ave, Zilker · $1,385,000',
  },
  {
    quote:
      'Every step felt calm and transparent. From the neighborhood comp breakdown in our first consultation to the twilight photography and relocation buyer outreach, we netted significantly more than expected.',
    author: 'Dr. David Okafor',
    detail: 'Sold 2709 Windsor Rd, Tarrytown · $2,890,000',
  },
];

export const BRAND_COLOR_PRESETS = [
  { name: 'Deep Pine', hex: '#0F2922' },
  { name: 'Architectural Navy', hex: '#13263E' },
  { name: 'Charcoal Ink', hex: '#1F2421' },
  { name: 'Muted Bronze', hex: '#5C4738' },
];
