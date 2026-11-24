import { ArrowRight } from 'lucide-react';
import { HERO_IMAGE_URL, SELLER_TESTIMONIALS } from '../data/seedData';
import type { AppPage, ListingRecord, SiteBrandSettings } from '../types/realEstate';
import { formatCurrency } from '../utils/crmLogic';
import { PropertyImage } from './PropertyImage';

interface HomePageProps {
  brand: SiteBrandSettings;
  listings: ListingRecord[];
  onNavigate: (page: AppPage) => void;
  onSelectListing: (listing: ListingRecord) => void;
}

export function HomePage({
  brand,
  listings,
  onNavigate,
  onSelectListing,
}: HomePageProps) {
  const featuredListings = listings.slice(0, 3);

  return (
    <div className="space-y-24 pb-24">
      {/* 1. Editorial Hero Section */}
      <section className="max-w-[1200px] mx-auto px-6 pt-10 lg:pt-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-between py-2 space-y-8">
            <div className="space-y-5">
              <p className="text-xs font-medium tracking-wide text-zinc-500">
                {brand.cityRegion} · Independent Seller Advisory
              </p>
              <h1
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.6rem)' }}
                className={`leading-[1.08] tracking-tight text-zinc-950 font-semibold text-balance ${
                  brand.fontStyle === 'editorial-serif' ? 'font-editorial' : ''
                }`}
              >
                {brand.heroHeadline}
              </h1>
              <p className="text-base text-zinc-600 leading-relaxed max-w-[54ch]">
                {brand.heroSubheadline}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onNavigate('sell')}
                style={{ backgroundColor: brand.accentColor }}
                className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
              >
                <span>Book a Listing Consultation</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('listings')}
                className="inline-flex items-center px-5 py-3.5 text-sm font-medium text-zinc-900 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors whitespace-nowrap shrink-0"
              >
                Explore Recent Sales &amp; Listings
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="w-full h-full min-h-[320px] lg:min-h-[460px] rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100">
              <PropertyImage
                src={HERO_IMAGE_URL}
                alt="Modern limestone and glass Austin residence marketed by Hartwell Realty"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Full-width 4-column seller proof strip below the hero split */}
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 border border-zinc-200 rounded-xl bg-white divide-y lg:divide-y-0 lg:divide-x divide-zinc-200">
          <div className="p-6 space-y-1">
            <p className="text-2xl font-semibold text-zinc-950 tabular-nums">102.4%</p>
            <p className="text-xs text-zinc-500">Average Sale-to-List Ratio (Last 12 Mo)</p>
          </div>
          <div className="p-6 space-y-1">
            <p className="text-2xl font-semibold text-zinc-950 tabular-nums">13 Days</p>
            <p className="text-xs text-zinc-500">Median Days on Market vs. 42 Austin Avg</p>
          </div>
          <div className="p-6 space-y-1">
            <p className="text-2xl font-semibold text-zinc-950 tabular-nums">$64.8M</p>
            <p className="text-xs text-zinc-500">Closed Austin Seller Volume Since 2022</p>
          </div>
          <div className="p-6 space-y-1">
            <p className="text-2xl font-semibold text-zinc-950 tabular-nums">1-on-1</p>
            <p className="text-xs text-zinc-500">Principal Broker Representation Start to Close</p>
          </div>
        </div>
      </section>

      {/* 2. Seller Listing Playbook (Editorial Numbered Capabilities) */}
      <section className="max-w-[1200px] mx-auto px-6 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-200 pb-6">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-medium tracking-wide text-zinc-500">
              How We Position Your Property
            </p>
            <h2
              className={`text-3xl font-semibold text-zinc-950 tracking-tight text-balance ${
                brand.fontStyle === 'editorial-serif' ? 'font-editorial' : ''
              }`}
            >
              A disciplined three-stage launch engineered for maximum seller net proceeds.
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('sell')}
            className="text-sm font-medium text-zinc-900 underline underline-offset-4 hover:opacity-75 whitespace-nowrap shrink-0 self-start md:self-auto"
          >
            Calculate Your Net Proceeds
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <article className="bg-white border border-zinc-200 rounded-xl p-7 space-y-4">
            <h3 className="text-lg font-semibold text-zinc-950">
              01. Micro-Market Comp Pricing
            </h3>
            <p className="text-sm text-zinc-600 leading-relaxed">
              We benchmark active buyer absorption street by street across Zilker, Barton Creek, and Tarrytown so your list price triggers urgency instead of stale price reductions.
            </p>
            <p className="text-xs font-medium text-zinc-500 pt-2 border-t border-zinc-100">
              Deliverable: 18-Page Pricing &amp; Net Proceeds Dossier
            </p>
          </article>

          <article className="bg-white border border-zinc-200 rounded-xl p-7 space-y-4">
            <h3 className="text-lg font-semibold text-zinc-950">
              02. Cohesive Editorial Presentation
            </h3>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Targeted staging refinements, twilight architectural photography, and unified print-to-social campaign graphics ensure your home stands out across MLS and relocation feeds.
            </p>
            <p className="text-xs font-medium text-zinc-500 pt-2 border-t border-zinc-100">
              Deliverable: Architectural Photo, Floorplan &amp; Social Kit
            </p>
          </article>

          <article className="bg-white border border-zinc-200 rounded-xl p-7 space-y-4">
            <h3 className="text-lg font-semibold text-zinc-950">
              03. Automated Buyer &amp; Relocation Match
            </h3>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Every listing is matched immediately against vetted active buyers and incoming corporate relocation leads inside our CRM prior to public weekend open houses.
            </p>
            <p className="text-xs font-medium text-zinc-500 pt-2 border-t border-zinc-100">
              Deliverable: Private Broker Preview + Weekly Demand Report
            </p>
          </article>
        </div>
      </section>

      {/* 3. Featured Portfolio & Active Listings */}
      <section className="max-w-[1200px] mx-auto px-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium tracking-wide text-zinc-500">
              Featured Austin Portfolio
            </p>
            <h2
              className={`text-3xl font-semibold text-zinc-950 tracking-tight ${
                brand.fontStyle === 'editorial-serif' ? 'font-editorial' : ''
              }`}
            >
              Active listings and verified recent sales.
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('listings')}
            className="text-sm font-medium text-zinc-900 underline underline-offset-4 hover:opacity-75 whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            View All Properties ({listings.length})
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredListings.map((listing) => (
            <article
              key={listing.id}
              className="bg-white border border-zinc-200 rounded-xl overflow-hidden flex flex-col justify-between hover:border-zinc-300 transition-colors"
            >
              <div>
                <div className="aspect-[4/3] w-full bg-zinc-100 overflow-hidden">
                  <PropertyImage
                    src={listing.imageUrl}
                    alt={`${listing.title} in ${listing.neighborhood}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span className="font-medium text-zinc-800">
                      {listing.status === 'for-sale'
                        ? 'For Sale'
                        : listing.status === 'pending'
                        ? 'Pending'
                        : 'Sold'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{listing.neighborhood}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{listing.daysOnMarket} DOM</span>
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-950 leading-snug">
                    {listing.title}
                  </h3>
                  <p className="text-sm text-zinc-600">{listing.address}</p>
                  <p className="text-xl font-semibold text-zinc-950 tabular-nums pt-1">
                    {formatCurrency(listing.price)}
                  </p>
                  <p className="text-xs text-zinc-500 tabular-nums">
                    {listing.beds} Beds · {listing.baths} Baths · {listing.sqft.toLocaleString()} Sq Ft
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 pt-2">
                <button
                  type="button"
                  onClick={() => onSelectListing(listing)}
                  className="w-full py-2.5 px-4 text-sm font-medium text-zinc-900 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
                >
                  Inspect Property Details
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 4. Attributable Client Outcomes (Claim-to-Proof Adjacency) */}
      <section className="max-w-[1200px] mx-auto px-6">
        <div className="bg-white border border-zinc-200 rounded-xl p-8 md:p-12 space-y-8">
          <div className="space-y-2 max-w-xl">
            <p className="text-xs font-medium tracking-wide text-zinc-500">
              Verified Seller Outcomes
            </p>
            <h2
              className={`text-2xl md:text-3xl font-semibold text-zinc-950 tracking-tight ${
                brand.fontStyle === 'editorial-serif' ? 'font-editorial' : ''
              }`}
            >
              What Austin homeowners say after closing with {brand.agentName}.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-zinc-200">
            {SELLER_TESTIMONIALS.map((item) => (
              <blockquote key={item.author} className="pt-6 md:pt-0 md:pl-8 first:pt-0 first:pl-0 space-y-4">
                <p className="text-base text-zinc-800 leading-relaxed">
                  &ldquo;{item.quote}&rdquo;
                </p>
                <footer className="text-xs text-zinc-500 space-y-0.5">
                  <p className="font-semibold text-zinc-900">{item.author}</p>
                  <p>{item.detail}</p>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* 5. High-Intent Seller Conversion Strip */}
      <section className="max-w-[1200px] mx-auto px-6">
        <div
          style={{ backgroundColor: brand.accentColor }}
          className="rounded-xl p-8 md:p-12 text-white flex flex-col md:flex-row md:items-center justify-between gap-8"
        >
          <div className="space-y-3 max-w-xl">
            <p className="text-xs font-medium tracking-wide text-white/75">
              Complimentary Seller Strategy Session
            </p>
            <h2
              className={`text-2xl md:text-3xl font-semibold tracking-tight text-balance ${
                brand.fontStyle === 'editorial-serif' ? 'font-editorial' : ''
              }`}
            >
              Thinking about selling in the next 6 months? Start with a custom home valuation.
            </h2>
            <p className="text-sm text-white/85 leading-relaxed">
              Get an accurate net-proceeds projection, neighborhood buyer demand snapshot, and a room-by-room prep checklist in a 30-minute private consultation.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('sell')}
            className="px-6 py-3.5 text-sm font-semibold text-zinc-950 bg-white rounded-lg hover:bg-zinc-100 transition-colors whitespace-nowrap shrink-0 self-start md:self-auto"
          >
            Start Seller Valuation Funnel
          </button>
        </div>
      </section>
    </div>
  );
}
