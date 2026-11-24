import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { submitLeadToFirestore } from '../services/realEstateStore';
import type {
  HomeCondition,
  LeadInput,
  PropertyType,
  SellerTimeline,
  SiteBrandSettings,
} from '../types/realEstate';
import {
  calculateSellerNetEstimate,
  formatCurrency,
  generateAutomatedCrmTags,
  validateLeadForm,
  type LeadValidationErrors,
} from '../utils/crmLogic';

interface SellerFunnelPageProps {
  brand: SiteBrandSettings;
  onBackHome: () => void;
}

const PROPERTY_TYPES: PropertyType[] = [
  'Single Family',
  'Modern Estate',
  'Townhome',
  'Condo',
  'Lot / Land',
];

const TIMELINES: SellerTimeline[] = [
  'ASAP (0-30 Days)',
  '1-3 Months',
  '3-6 Months',
  'Exploring Options',
];

const CONDITIONS: HomeCondition[] = [
  'Turnkey / Renovated',
  'Move-in Ready',
  'Needs Light Updates',
  'Major Renovation',
];

const CONSULTATION_SLOTS = [
  'Weekday Morning (9:00 AM – 12:00 PM)',
  'Weekday Afternoon (1:00 PM – 4:30 PM)',
  'Saturday Private Walkthrough (10:00 AM)',
  'Virtual Strategy Call via Video',
];

export function SellerFunnelPage({ brand, onBackHome }: SellerFunnelPageProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<LeadInput>({
    fullName: '',
    email: '',
    phone: '',
    propertyAddress: '',
    neighborhood: '',
    propertyType: 'Single Family',
    estimatedValue: 1150000,
    timeline: '1-3 Months',
    homeCondition: 'Move-in Ready',
    leadType: 'seller-consultation',
    preferredSlot: CONSULTATION_SLOTS[0],
    notes: '',
    sourcePage: '/sell',
  });

  const [errors, setErrors] = useState<LeadValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    id: string;
    tags: string[];
  } | null>(null);

  const estimate = useMemo(
    () =>
      calculateSellerNetEstimate({
        estimatedValue: form.estimatedValue,
        homeCondition: form.homeCondition,
        timeline: form.timeline,
      }),
    [form.estimatedValue, form.homeCondition, form.timeline]
  );

  const previewTags = useMemo(
    () =>
      generateAutomatedCrmTags({
        leadType: form.leadType,
        timeline: form.timeline,
        estimatedValue: form.estimatedValue,
        homeCondition: form.homeCondition,
        neighborhood: form.neighborhood || 'Austin',
      }),
    [form.leadType, form.timeline, form.estimatedValue, form.homeCondition, form.neighborhood]
  );

  const validateStep1 = (): boolean => {
    const nextErrors: LeadValidationErrors = {};
    if (form.propertyAddress.trim().length < 3) {
      nextErrors.propertyAddress = 'Please enter your street address.';
    }
    if (form.neighborhood.trim().length < 2) {
      nextErrors.neighborhood = 'Please enter your Austin neighborhood or ZIP code.';
    }
    if (!Number.isFinite(form.estimatedValue) || form.estimatedValue < 50000) {
      nextErrors.estimatedValue = 'Please enter an estimated property value ($50,000+).';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const validation = validateLeadForm(form);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const result = await submitLeadToFirestore(form);
      setConfirmation(result);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Unable to submit your consultation request right now. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmation) {
    return (
      <section className="max-w-[780px] mx-auto px-6 py-16">
        <div className="bg-white border border-zinc-200 rounded-xl p-8 md:p-12 space-y-6">
          <div className="flex items-center gap-3 text-emerald-800">
            <CheckCircle2 className="w-6 h-6 shrink-0" aria-hidden="true" />
            <p className="text-xs font-semibold uppercase tracking-wider">
              Consultation Request Received
            </p>
          </div>
          <h1
            className={`text-3xl font-semibold text-zinc-950 tracking-tight ${
              brand.fontStyle === 'editorial-serif' ? 'font-editorial' : ''
            }`}
          >
            Thank you, {form.fullName}. Your listing strategy dossier is in motion.
          </h1>
          <p className="text-sm text-zinc-600 leading-relaxed">
            {brand.agentName} will confirm your <strong className="text-zinc-900">{form.preferredSlot}</strong> consultation for{' '}
            <strong className="text-zinc-900">{form.propertyAddress}</strong> within 2 business hours and bring a custom neighborhood comp report.
          </p>

          <div className="border-t border-b border-zinc-200 py-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-zinc-500">Projected Market Range</p>
                <p className="font-semibold text-zinc-950 tabular-nums">
                  {formatCurrency(estimate.lowMarketEstimate)} – {formatCurrency(estimate.highMarketEstimate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Estimated Net Proceeds</p>
                <p className="font-semibold text-zinc-950 tabular-nums">
                  {formatCurrency(estimate.projectedNetLow)} – {formatCurrency(estimate.projectedNetHigh)}
                </p>
              </div>
            </div>
            <div className="pt-2">
              <p className="text-xs text-zinc-500 mb-1">Automated CRM Routing &amp; Tags Applied</p>
              <p className="text-xs font-mono text-zinc-800">
                {confirmation.tags.join(' · ')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onBackHome}
              style={{ backgroundColor: brand.accentColor }}
              className="px-5 py-2.5 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Return to Home
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmation(null);
                setStep(1);
                setForm((prev) => ({
                  ...prev,
                  fullName: '',
                  email: '',
                  phone: '',
                  propertyAddress: '',
                  neighborhood: '',
                  notes: '',
                }));
              }}
              className="px-5 py-2.5 text-sm font-medium text-zinc-800 border border-zinc-300 rounded-lg hover:bg-zinc-50"
            >
              Submit Another Property
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-[1100px] mx-auto px-6 py-12 lg:py-16 space-y-10">
      <div className="max-w-2xl space-y-3">
        <p className="text-xs font-medium tracking-wide text-zinc-500">
          Seller Consultation &amp; Net Proceeds Funnel
        </p>
        <h1
          className={`text-3xl md:text-4xl font-semibold text-zinc-950 tracking-tight text-balance ${
            brand.fontStyle === 'editorial-serif' ? 'font-editorial' : ''
          }`}
        >
          See what your home can net in today&apos;s {brand.cityRegion} market.
        </h1>
        <p className="text-sm text-zinc-600 leading-relaxed">
          Complete the three quick steps below to preview your net proceeds range and book a private 1-on-1 listing consultation with {brand.agentName}.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Interactive 3-Step Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="lg:col-span-7 bg-white border border-zinc-200 rounded-xl p-6 md:p-8 space-y-6"
        >
          {/* Step Progress Tabs */}
          <div className="grid grid-cols-3 gap-2 border-b border-zinc-200 pb-4 text-xs font-medium">
            <button
              type="button"
              onClick={() => setStep(1)}
              style={step === 1 ? { backgroundColor: brand.accentColor } : undefined}
              className={`py-2 px-3 rounded-lg text-left transition-colors ${
                step === 1 ? 'text-white' : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
              }`}
            >
              1. Property Details
            </button>
            <button
              type="button"
              onClick={() => {
                if (validateStep1()) setStep(2);
              }}
              style={step === 2 ? { backgroundColor: brand.accentColor } : undefined}
              className={`py-2 px-3 rounded-lg text-left transition-colors ${
                step === 2 ? 'text-white' : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
              }`}
            >
              2. Timeline &amp; Prep
            </button>
            <button
              type="button"
              onClick={() => {
                if (validateStep1()) setStep(3);
              }}
              style={step === 3 ? { backgroundColor: brand.accentColor } : undefined}
              className={`py-2 px-3 rounded-lg text-left transition-colors ${
                step === 3 ? 'text-white' : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
              }`}
            >
              3. Book Slot
            </button>
          </div>

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label htmlFor="sell-address" className="block text-sm font-medium text-zinc-800 mb-1.5">
                  Property Street Address
                </label>
                <input
                  id="sell-address"
                  type="text"
                  required
                  value={form.propertyAddress}
                  onChange={(e) => setForm({ ...form, propertyAddress: e.target.value })}
                  placeholder="e.g. 1428 Kinney Ave"
                  className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
                {errors.propertyAddress && (
                  <p className="mt-1 text-xs text-red-700" role="alert">
                    {errors.propertyAddress}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sell-neighborhood" className="block text-sm font-medium text-zinc-800 mb-1.5">
                    Neighborhood or ZIP
                  </label>
                  <input
                    id="sell-neighborhood"
                    type="text"
                    required
                    value={form.neighborhood}
                    onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                    placeholder="e.g. Zilker / 78704"
                    className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                  {errors.neighborhood && (
                    <p className="mt-1 text-xs text-red-700" role="alert">
                      {errors.neighborhood}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="sell-type" className="block text-sm font-medium text-zinc-800 mb-1.5">
                    Property Type
                  </label>
                  <select
                    id="sell-type"
                    value={form.propertyType}
                    onChange={(e) =>
                      setForm({ ...form, propertyType: e.target.value as PropertyType })
                    }
                    className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  >
                    {PROPERTY_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="sell-value" className="text-sm font-medium text-zinc-800">
                    Your Estimated Market Value
                  </label>
                  <span className="text-sm font-semibold text-zinc-950 tabular-nums">
                    {formatCurrency(form.estimatedValue)}
                  </span>
                </div>
                <input
                  id="sell-value"
                  type="range"
                  min={350000}
                  max={4500000}
                  step={25000}
                  value={form.estimatedValue}
                  onChange={(e) =>
                    setForm({ ...form, estimatedValue: Number(e.target.value) })
                  }
                  className="w-full accent-zinc-900"
                />
                <div className="flex justify-between text-xs text-zinc-500 tabular-nums mt-1">
                  <span>$350k</span>
                  <span>$2.4M</span>
                  <span>$4.5M+</span>
                </div>
                {errors.estimatedValue && (
                  <p className="mt-1 text-xs text-red-700" role="alert">
                    {errors.estimatedValue}
                  </p>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep1()) setStep(2);
                  }}
                  style={{ backgroundColor: brand.accentColor }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-lg hover:opacity-90"
                >
                  <span>Continue to Timeline</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label htmlFor="sell-timeline" className="block text-sm font-medium text-zinc-800 mb-1.5">
                  Target Listing Timeline
                </label>
                <select
                  id="sell-timeline"
                  value={form.timeline}
                  onChange={(e) =>
                    setForm({ ...form, timeline: e.target.value as SellerTimeline })
                  }
                  className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  {TIMELINES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="sell-condition" className="block text-sm font-medium text-zinc-800 mb-1.5">
                  Current Home Condition
                </label>
                <select
                  id="sell-condition"
                  value={form.homeCondition}
                  onChange={(e) =>
                    setForm({ ...form, homeCondition: e.target.value as HomeCondition })
                  }
                  className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  {CONDITIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="sell-notes" className="block text-sm font-medium text-zinc-800 mb-1.5">
                  Recent Upgrades or Goals (Optional)
                </label>
                <textarea
                  id="sell-notes"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Tell Claire about recent renovations, target move-out date, or privacy needs..."
                  className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-zinc-700 border border-zinc-300 rounded-lg hover:bg-zinc-50"
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  style={{ backgroundColor: brand.accentColor }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-lg hover:opacity-90"
                >
                  <span>Continue to Book Consultation</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label htmlFor="sell-name" className="block text-sm font-medium text-zinc-800 mb-1.5">
                  Full Name
                </label>
                <input
                  id="sell-name"
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Jordan Ellis"
                  className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-red-700" role="alert">
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sell-email" className="block text-sm font-medium text-zinc-800 mb-1.5">
                    Email Address
                  </label>
                  <input
                    id="sell-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="jordan@example.com"
                    className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-700" role="alert">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="sell-phone" className="block text-sm font-medium text-zinc-800 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    id="sell-phone"
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="(512) 555-0148"
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
                <label htmlFor="sell-slot" className="block text-sm font-medium text-zinc-800 mb-1.5">
                  Preferred Consultation Window
                </label>
                <select
                  id="sell-slot"
                  value={form.preferredSlot}
                  onChange={(e) => setForm({ ...form, preferredSlot: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  {CONSULTATION_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              {submitError && (
                <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800" role="alert">
                  {submitError}
                </div>
              )}

              <div className="pt-2 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-zinc-700 border border-zinc-300 rounded-lg hover:bg-zinc-50"
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ backgroundColor: brand.accentColor }}
                  className="px-6 py-3 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {submitting ? 'Booking Consultation...' : 'Confirm Listing Consultation'}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Right: Live Net Proceeds & CRM Automation Preview */}
        <aside className="lg:col-span-5 bg-white border border-zinc-200 rounded-xl p-6 md:p-8 space-y-6">
          <div className="space-y-1 border-b border-zinc-200 pb-4">
            <p className="text-xs font-medium text-zinc-500">Live Valuation Preview</p>
            <h2 className="text-xl font-semibold text-zinc-950 font-editorial">
              Projected Seller Net Proceeds
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-zinc-500">Targeted Sale Price Range</p>
              <p className="text-2xl font-semibold text-zinc-950 tabular-nums">
                {formatCurrency(estimate.lowMarketEstimate)} – {formatCurrency(estimate.highMarketEstimate)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-100">
              <div>
                <p className="text-xs text-zinc-500">Estimated Net Range</p>
                <p className="text-sm font-semibold text-zinc-900 tabular-nums">
                  {formatCurrency(estimate.projectedNetLow)} – {formatCurrency(estimate.projectedNetHigh)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Target Days on Market</p>
                <p className="text-sm font-semibold text-zinc-900 tabular-nums">
                  {estimate.expectedDaysOnMarket}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 space-y-1">
              <p className="text-xs text-zinc-500">Recommended Launch Playbook</p>
              <p className="text-sm text-zinc-800 font-medium leading-snug">
                {estimate.recommendedStrategy}
              </p>
            </div>

            <div className="pt-3 border-t border-zinc-100 space-y-1.5">
              <p className="text-xs text-zinc-500">CRM Auto-Tags Prepared for This Lead</p>
              <p className="text-xs font-mono text-zinc-700 leading-relaxed">
                {previewTags.join(' · ')}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
