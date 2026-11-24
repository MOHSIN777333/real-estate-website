import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { submitLeadToFirestore } from '../services/realEstateStore';
import type { SiteBrandSettings } from '../types/realEstate';
import { validateLeadForm, type LeadValidationErrors } from '../utils/crmLogic';

interface ContactPageProps {
  brand: SiteBrandSettings;
}

export function ContactPage({ brand }: ContactPageProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [neighborhood, setNeighborhood] = useState('Austin');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<LeadValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<string[] | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const payload = {
      fullName,
      email,
      phone,
      propertyAddress: 'General Office Inquiry',
      neighborhood: neighborhood || 'Austin',
      propertyType: 'Single Family' as const,
      estimatedValue: 950000,
      timeline: 'Exploring Options' as const,
      homeCondition: 'Move-in Ready' as const,
      leadType: 'general-contact' as const,
      preferredSlot: 'Next Available Business Day',
      notes,
      sourcePage: '/contact',
    };

    const check = validateLeadForm(payload);
    if (!check.valid) {
      setErrors(check.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const res = await submitLeadToFirestore(payload);
      setConfirmed(res.tags);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to send message.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="max-w-[1100px] mx-auto px-6 py-12 lg:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-medium tracking-wide text-zinc-500">
              Direct Office Contact
            </p>
            <h1
              className={`text-3xl md:text-4xl font-semibold text-zinc-950 tracking-tight ${
                brand.fontStyle === 'editorial-serif' ? 'font-editorial' : ''
              }`}
            >
              Start a conversation with {brand.agentName}.
            </h1>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Have a question about timing your sale, neighborhood inventory, or off-market buyer demand? Reach out directly—no call centers or auto-responders.
            </p>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4 text-sm">
            <div>
              <p className="text-xs text-zinc-500">Brokerage Office</p>
              <p className="font-medium text-zinc-900">{brand.officeAddress}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Direct Phone</p>
              <p className="font-medium text-zinc-900 tabular-nums">{brand.officePhone}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Email</p>
              <p className="font-medium text-zinc-900">{brand.officeEmail}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Consultation Hours</p>
              <p className="font-medium text-zinc-900">Mon – Sat · 8:30 AM – 6:30 PM CST</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-xl p-6 md:p-8">
          {confirmed ? (
            <div className="space-y-4 py-8">
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                <p className="text-xs font-semibold uppercase tracking-wide">
                  Message Received
                </p>
              </div>
              <h2 className="text-2xl font-semibold text-zinc-950 font-editorial">
                Thank you, {fullName}.
              </h2>
              <p className="text-sm text-zinc-600">
                Your note has been routed directly into {brand.agentName}&apos;s CRM inbox. Expect a personal reply within one business day.
              </p>
              <p className="text-xs font-mono text-zinc-600 pt-2 border-t border-zinc-100">
                CRM Tags Applied: {confirmed.join(' · ')}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <h2 className="text-xl font-semibold text-zinc-950">Send a Direct Message</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-zinc-800 mb-1.5">
                    Full Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Taylor Reed"
                    className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-xs text-red-700" role="alert">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="contact-neighborhood" className="block text-sm font-medium text-zinc-800 mb-1.5">
                    Neighborhood of Interest
                  </label>
                  <input
                    id="contact-neighborhood"
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Zilker, Tarrytown, East Austin"
                    className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-zinc-800 mb-1.5">
                    Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="taylor@example.com"
                    className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-700" role="alert">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="contact-phone" className="block text-sm font-medium text-zinc-800 mb-1.5">
                    Phone
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(512) 555-0133"
                    className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-700" role="alert">
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="contact-notes" className="block text-sm font-medium text-zinc-800 mb-1.5">
                  How Can We Help?
                </label>
                <textarea
                  id="contact-notes"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Share your target timeframe, property address, or questions..."
                  className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>

              {submitError && (
                <p className="text-xs text-red-700" role="alert">
                  {submitError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{ backgroundColor: brand.accentColor }}
                className="px-6 py-3 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? 'Sending Message...' : 'Send Direct Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
