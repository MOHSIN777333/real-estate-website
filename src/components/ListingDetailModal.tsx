import { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { submitLeadToFirestore } from '../services/realEstateStore';
import type { ListingRecord, SiteBrandSettings } from '../types/realEstate';
import { formatCurrency, validateLeadForm } from '../utils/crmLogic';
import { PropertyImage } from './PropertyImage';

interface ListingDetailModalProps {
  listing: ListingRecord | null;
  brand: SiteBrandSettings;
  onClose: () => void;
  onStartSellerFunnel: () => void;
}

export function ListingDetailModal({
  listing,
  brand,
  onClose,
  onStartSellerFunnel,
}: ListingDetailModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedTags, setSubmittedTags] = useState<string[] | null>(null);

  if (!listing) return null;

  const handleInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload = {
      fullName: name,
      email,
      phone,
      propertyAddress: listing.address,
      neighborhood: listing.neighborhood,
      propertyType: listing.propertyType,
      estimatedValue: listing.price,
      timeline: '1-3 Months' as const,
      homeCondition: 'Move-in Ready' as const,
      leadType: 'property-inquiry' as const,
      preferredSlot: 'Flexible / Within 24 Hours',
      notes: message || `Inquiry regarding ${listing.title} (${listing.address})`,
      sourcePage: '/listings-modal',
    };

    const check = validateLeadForm(payload);
    if (!check.valid) {
      const firstMsg = Object.values(check.errors)[0];
      setError(firstMsg || 'Please complete your name, email, and phone number.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitLeadToFirestore(payload);
      setSubmittedTags(res.tags);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send inquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="listing-modal-title"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white border border-zinc-200 rounded-xl max-w-3xl w-full overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <p className="text-xs font-medium text-zinc-500">
            {listing.neighborhood} · {listing.status === 'for-sale' ? 'Active Listing' : listing.status === 'pending' ? 'Under Contract' : 'Verified Sale'}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close property details"
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12">
          <div className="md:col-span-6 p-6 space-y-5 border-b md:border-b-0 md:border-r border-zinc-200">
            <div className="aspect-[4/3] rounded-lg overflow-hidden bg-zinc-100">
              <PropertyImage
                src={listing.imageUrl}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-2">
              <h2
                id="listing-modal-title"
                className="text-2xl font-semibold text-zinc-950 font-editorial"
              >
                {listing.title}
              </h2>
              <p className="text-sm text-zinc-600">
                {listing.address}, {listing.city}
              </p>
              <p className="text-2xl font-semibold text-zinc-950 tabular-nums">
                {formatCurrency(listing.price)}
              </p>
              <p className="text-xs text-zinc-500 tabular-nums">
                {listing.beds} Beds · {listing.baths} Baths · {listing.sqft.toLocaleString()} Sq Ft · {listing.lotSqft.toLocaleString()} Lot Sq Ft
              </p>
            </div>

            <p className="text-sm text-zinc-600 leading-relaxed">{listing.description}</p>

            <div className="space-y-2 pt-2 border-t border-zinc-100">
              <p className="text-xs font-semibold text-zinc-900">Property Highlights</p>
              <ul className="space-y-1.5 text-xs text-zinc-600 list-disc pl-4">
                {listing.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="md:col-span-6 p-6 space-y-5 bg-[#FAFAF9]">
            {submittedTags ? (
              <div className="space-y-4 py-6">
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                  <p className="text-xs font-semibold uppercase tracking-wide">
                    Inquiry Logged in CRM
                  </p>
                </div>
                <h3 className="text-xl font-semibold text-zinc-950 font-editorial">
                  {brand.agentName} has your request.
                </h3>
                <p className="text-sm text-zinc-600">
                  We&apos;ll reach out shortly with private showing availability or comparable neighborhood sales data.
                </p>
                <p className="text-xs font-mono text-zinc-700 pt-2 border-t border-zinc-200">
                  CRM Tags: {submittedTags.join(' · ')}
                </p>
              </div>
            ) : (
              <form onSubmit={handleInquiry} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-zinc-950">
                    Request Private Showing or Comps
                  </h3>
                  <p className="text-xs text-zinc-600">
                    Curious what a similar home in {listing.neighborhood} would sell for? Send a note directly to {brand.agentName}.
                  </p>
                </div>

                <div>
                  <label htmlFor="modal-name" className="block text-xs font-medium text-zinc-700 mb-1">
                    Full Name
                  </label>
                  <input
                    id="modal-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg"
                  />
                </div>

                <div>
                  <label htmlFor="modal-email" className="block text-xs font-medium text-zinc-700 mb-1">
                    Email
                  </label>
                  <input
                    id="modal-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg"
                  />
                </div>

                <div>
                  <label htmlFor="modal-phone" className="block text-xs font-medium text-zinc-700 mb-1">
                    Phone
                  </label>
                  <input
                    id="modal-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(512) 555-0182"
                    className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg"
                  />
                </div>

                <div>
                  <label htmlFor="modal-message" className="block text-xs font-medium text-zinc-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    id="modal-message"
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Interested in a private tour or comparable neighborhood valuation..."
                    className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-700" role="alert">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  style={{ backgroundColor: brand.accentColor }}
                  className="w-full py-2.5 px-4 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Send Inquiry to Broker'}
                </button>
              </form>
            )}

            <div className="pt-4 border-t border-zinc-200 space-y-2">
              <p className="text-xs text-zinc-500">Own a home in {listing.neighborhood}?</p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartSellerFunnel();
                }}
                className="text-xs font-semibold text-zinc-900 underline underline-offset-4 hover:opacity-75"
              >
                Get Your Custom {listing.neighborhood} Seller Valuation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
