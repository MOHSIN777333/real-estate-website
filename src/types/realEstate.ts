export type PropertyType =
  | 'Single Family'
  | 'Modern Estate'
  | 'Townhome'
  | 'Condo'
  | 'Lot / Land';

export type ListingPropertyType =
  | 'Single Family'
  | 'Modern Estate'
  | 'Townhome'
  | 'Condo';

export type ListingStatus = 'for-sale' | 'pending' | 'sold';

export type SellerTimeline =
  | 'ASAP (0-30 Days)'
  | '1-3 Months'
  | '3-6 Months'
  | 'Exploring Options';

export type HomeCondition =
  | 'Turnkey / Renovated'
  | 'Move-in Ready'
  | 'Needs Light Updates'
  | 'Major Renovation';

export type LeadType =
  | 'seller-consultation'
  | 'home-valuation'
  | 'property-inquiry'
  | 'general-contact';

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'consultation-booked'
  | 'listed'
  | 'closed';

export interface LeadInput {
  fullName: string;
  email: string;
  phone: string;
  propertyAddress: string;
  neighborhood: string;
  propertyType: PropertyType;
  estimatedValue: number;
  timeline: SellerTimeline;
  homeCondition: HomeCondition;
  leadType: LeadType;
  preferredSlot: string;
  notes: string;
  sourcePage: string;
}

export interface LeadRecord extends LeadInput {
  id: string;
  tags: string[];
  status: LeadStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListingRecord {
  id: string;
  title: string;
  address: string;
  neighborhood: string;
  city: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  lotSqft: number;
  status: ListingStatus;
  propertyType: ListingPropertyType;
  daysOnMarket: number;
  saleToListRatio: string;
  imageUrl: string;
  description: string;
  highlights: string[];
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SiteBrandSettings {
  agencyName: string;
  agentName: string;
  agentTitle: string;
  licenseNumber: string;
  cityRegion: string;
  officeAddress: string;
  officePhone: string;
  officeEmail: string;
  accentColor: string;
  fontStyle: 'editorial-serif' | 'modern-architectural';
  heroHeadline: string;
  heroSubheadline: string;
  agentBio: string;
  updatedAt: Date;
}

export type AppPage = 'home' | 'sell' | 'listings' | 'about' | 'contact' | 'crm';

export interface ListingFilterState {
  query: string;
  status: 'all' | ListingStatus;
  propertyType: 'all' | ListingPropertyType;
  minBeds: number;
  maxPrice: number;
}
