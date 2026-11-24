import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type {
  AppPage,
  ListingFilterState,
  ListingPropertyType,
  ListingRecord,
  ListingStatus,
  SiteBrandSettings,
} from '../types/realEstate';
import { filterListings, formatCurrency } from '../utils/crmLogic';
import { PropertyImage } from './PropertyImage';

interface ListingsPageProps {
  brand: SiteBrandSettings;
  listings: ListingRecord[];
  onSelectListing: (listing: ListingRecord) => void;
  onNavigate: (page: AppPage) => void;
}

export function ListingsPage({
  brand,
  listings,
  onSelectListing,
  onNavigate,
}: ListingsPageProps) {
  const [filters, setFilters] = useState<ListingFilterState>({
    query: '',
    status: 'all',
    propertyType: 'all',
    minBeds: 0,
    maxPrice: 0,
  });

  const filtered = useMemo(
    () => filterListings(listings, filters),
    [listings, filters]
  );

  const statusTabs: { value: 'all' | ListingStatus; label: string }[] = [
    { value: 'all', label: 'All Properties' },
    { value: 'for-sale', label: 'For Sale' },
    { value: 'pending', label: 'Pending' },
    { value: 'sold', label: 'Recently Sold' },
  ];

  return (
    <section className="max-w-[1200px] mx-auto px-6 py-12 lg:py-16 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-200 pb-8">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-medium tracking-wide text-zinc-500">
            {brand.cityRegion} Portfolio &amp; Property Search
          </p>
          <h1
            className={`text-3xl md:text-4xl font-semibold text-zinc-950 tracking-tight ${
              brand.fontStyle === 'editorial-serif' ? 'font-editorial' : ''
            }`}
          >
            Active listings and proven neighborhood sales.
          </h1>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('sell')}
          style={{ backgroundColor: brand.accentColor }}
          className="px-5 py-2.5 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 self-start md:self-auto"
        >
          List Your Home With Us
        </button>
      </div>

      {/* Search & Segmented Filters */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <label htmlFor="listing-search-input" className="sr-only">
              Search by address, neighborhood, or title
            </label>
            <input
              id="listing-search-input"
              type="search"
              value={filters.query}
              onChange={(e) => setFilters({ ...filters, query: e.target.value })}
              placeholder="Search Austin neighborhood, street address, or style (e.g. Zilker, Barton Creek)..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          <div
            role="tablist"
            aria-label="Filter properties by status"
            className="flex items-center gap-1 p-1 bg-zinc-100 rounded-lg overflow-x-auto"
          >
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={filters.status === tab.value}
                onClick={() => setFilters({ ...filters, status: tab.value })}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                  filters.status === tab.value
                    ? 'bg-white text-zinc-950 shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-zinc-100">
          <div>
            <label htmlFor="filter-type" className="block text-xs font-medium text-zinc-500 mb-1">
              Property Type
            </label>
            <select
              id="filter-type"
              value={filters.propertyType}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  propertyType: e.target.value as 'all' | ListingPropertyType,
                })
              }
              className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg bg-white"
            >
              <option value="all">All Types</option>
              <option value="Single Family">Single Family</option>
              <option value="Modern Estate">Modern Estate</option>
              <option value="Townhome">Townhome</option>
              <option value="Condo">Condo</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-beds" className="block text-xs font-medium text-zinc-500 mb-1">
              Minimum Bedrooms
            </label>
            <select
              id="filter-beds"
              value={filters.minBeds}
              onChange={(e) => setFilters({ ...filters, minBeds: Number(e.target.value) })}
              className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg bg-white"
            >
              <option value={0}>Any Bedrooms</option>
              <option value={3}>3+ Bedrooms</option>
              <option value={4}>4+ Bedrooms</option>
              <option value={5}>5+ Bedrooms</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-price" className="block text-xs font-medium text-zinc-500 mb-1">
              Maximum Price
            </label>
            <select
              id="filter-price"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
              className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg bg-white"
            >
              <option value={0}>No Price Limit</option>
              <option value={1250000}>Up to $1,250,000</option>
              <option value={2000000}>Up to $2,000,000</option>
              <option value={3000000}>Up to $3,000,000</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-xs font-medium text-zinc-500 tabular-nums">
        Showing {filtered.length} of {listings.length} properties
      </p>

      {filtered.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center space-y-4">
          <p className="text-lg font-semibold text-zinc-900">
            No properties match your current filters
          </p>
          <p className="text-sm text-zinc-600 max-w-md mx-auto">
            Try clearing your neighborhood search or expanding your bedroom and price criteria.
          </p>
          <button
            type="button"
            onClick={() =>
              setFilters({
                query: '',
                status: 'all',
                propertyType: 'all',
                minBeds: 0,
                maxPrice: 0,
              })
            }
            className="px-4 py-2 text-sm font-medium text-zinc-900 border border-zinc-300 rounded-lg hover:bg-zinc-50"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((listing) => (
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
                    <span className="font-semibold text-zinc-900">
                      {listing.status === 'for-sale'
                        ? 'For Sale'
                        : listing.status === 'pending'
                        ? 'Pending'
                        : 'Sold'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{listing.neighborhood}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{listing.saleToListRatio}</span>
                  </div>
                  <h2 className="text-lg font-semibold text-zinc-950 leading-snug">
                    {listing.title}
                  </h2>
                  <p className="text-sm text-zinc-600">
                    {listing.address}, {listing.city}
                  </p>
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
                  View Property Dossier
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
