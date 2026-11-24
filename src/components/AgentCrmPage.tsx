import { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { Download, LogIn, LogOut, Plus, Trash2 } from 'lucide-react';
import {
  BRAND_COLOR_PRESETS,
  HERO_IMAGE_URL,
} from '../data/seedData';
import {
  BOOTSTRAPPED_ADMIN_EMAIL,
  isVerifiedAdminUser,
  signInAgentWithGoogle,
  signOutAgent,
} from '../services/firebase';
import {
  createOrUpdateListing,
  removeListing,
  saveSiteBrandSettings,
  seedInitialListingsToFirestore,
  subscribeAdminLeads,
  updateLeadInFirestore,
} from '../services/realEstateStore';
import type {
  LeadRecord,
  LeadStatus,
  ListingPropertyType,
  ListingRecord,
  ListingStatus,
  SiteBrandSettings,
} from '../types/realEstate';
import { formatCurrency } from '../utils/crmLogic';

interface AgentCrmPageProps {
  user: User | null;
  authReady: boolean;
  brand: SiteBrandSettings;
  listings: ListingRecord[];
}

type CrmTab = 'leads' | 'listings' | 'brand' | 'templates';

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New Lead',
  contacted: 'Contacted',
  'consultation-booked': 'Consultation Booked',
  listed: 'Listed',
  closed: 'Closed',
};

export function AgentCrmPage({
  user,
  authReady,
  brand,
  listings,
}: AgentCrmPageProps) {
  const isAdmin = isVerifiedAdminUser(user);
  const [activeTab, setActiveTab] = useState<CrmTab>('leads');
  const [authError, setAuthError] = useState<string | null>(null);

  // Leads state
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | LeadStatus>('all');
  const [leadQuery, setLeadQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);
  const [editStatus, setEditStatus] = useState<LeadStatus>('new');
  const [editNotes, setEditNotes] = useState('');
  const [editTagsText, setEditTagsText] = useState('');
  const [savingLead, setSavingLead] = useState(false);

  // Listings manager state
  const [seedingListings, setSeedingListings] = useState(false);
  const [listingFeedback, setListingFeedback] = useState<string | null>(null);
  const [newListingTitle, setNewListingTitle] = useState('');
  const [newListingAddress, setNewListingAddress] = useState('');
  const [newListingNeighborhood, setNewListingNeighborhood] = useState('Zilker');
  const [newListingPrice, setNewListingPrice] = useState('1295000');
  const [newListingBeds, setNewListingBeds] = useState('4');
  const [newListingBaths, setNewListingBaths] = useState('3');
  const [newListingSqft, setNewListingSqft] = useState('2680');
  const [newListingStatus, setNewListingStatus] = useState<ListingStatus>('for-sale');
  const [newListingType, setNewListingType] = useState<ListingPropertyType>('Single Family');

  // Brand customizer state
  const [brandDraft, setBrandDraft] = useState<Omit<SiteBrandSettings, 'updatedAt'>>({
    agencyName: brand.agencyName,
    agentName: brand.agentName,
    agentTitle: brand.agentTitle,
    licenseNumber: brand.licenseNumber,
    cityRegion: brand.cityRegion,
    officeAddress: brand.officeAddress,
    officePhone: brand.officePhone,
    officeEmail: brand.officeEmail,
    accentColor: brand.accentColor,
    fontStyle: brand.fontStyle,
    heroHeadline: brand.heroHeadline,
    heroSubheadline: brand.heroSubheadline,
    agentBio: brand.agentBio,
  });
  const [savingBrand, setSavingBrand] = useState(false);
  const [brandMessage, setBrandMessage] = useState<string | null>(null);

  // Editable Canva-ready graphic state
  const [templateHeadline, setTemplateHeadline] = useState('What Could Your Austin Home Net This Season?');
  const [templateSubtext, setTemplateSubtext] = useState('Private Pricing & Staging Consultation');
  const [templateArea, setTemplateArea] = useState('Zilker · Barton Creek · Tarrytown');

  useEffect(() => {
    setBrandDraft({
      agencyName: brand.agencyName,
      agentName: brand.agentName,
      agentTitle: brand.agentTitle,
      licenseNumber: brand.licenseNumber,
      cityRegion: brand.cityRegion,
      officeAddress: brand.officeAddress,
      officePhone: brand.officePhone,
      officeEmail: brand.officeEmail,
      accentColor: brand.accentColor,
      fontStyle: brand.fontStyle,
      heroHeadline: brand.heroHeadline,
      heroSubheadline: brand.heroSubheadline,
      agentBio: brand.agentBio,
    });
  }, [brand]);

  useEffect(() => {
    if (!authReady || !isAdmin) {
      setLeads([]);
      return;
    }
    setLeadsLoading(true);
    setLeadsError(null);
    const unsub = subscribeAdminLeads(
      (rows) => {
        setLeads(rows);
        setLeadsLoading(false);
      },
      (err) => {
        setLeadsError(err.message);
        setLeadsLoading(false);
      }
    );
    return () => unsub();
  }, [authReady, isAdmin]);

  const filteredLeads = useMemo(() => {
    const q = leadQuery.trim().toLowerCase();
    return leads.filter((lead) => {
      if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
      if (q) {
        const hay = `${lead.fullName} ${lead.email} ${lead.propertyAddress} ${lead.neighborhood} ${lead.tags.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [leads, statusFilter, leadQuery]);

  const pipelineValue = useMemo(
    () => leads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0),
    [leads]
  );

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signInAgentWithGoogle();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Google Sign-In failed.');
    }
  };

  const handleSelectLead = (lead: LeadRecord) => {
    setSelectedLead(lead);
    setEditStatus(lead.status);
    setEditNotes(lead.notes);
    setEditTagsText(lead.tags.join(', '));
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    setSavingLead(true);
    try {
      const parsedTags = editTagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      await updateLeadInFirestore(selectedLead.id, {
        status: editStatus,
        notes: editNotes,
        tags: parsedTags,
      });
      setSelectedLead((prev) =>
        prev
          ? {
              ...prev,
              status: editStatus,
              notes: editNotes,
              tags: parsedTags.length > 0 ? parsedTags : prev.tags,
            }
          : null
      );
    } finally {
      setSavingLead(false);
    }
  };

  const handleSeedListings = async () => {
    setSeedingListings(true);
    setListingFeedback(null);
    try {
      await seedInitialListingsToFirestore();
      setListingFeedback('Sample Austin portfolio listings synced to Firestore.');
    } catch (err) {
      setListingFeedback(err instanceof Error ? err.message : 'Failed to sync listings.');
    } finally {
      setSeedingListings(false);
    }
  };

  const handleAddListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newListingTitle.trim().length < 4 || newListingAddress.trim().length < 4) {
      setListingFeedback('Please provide a listing title and street address (min 4 characters).');
      return;
    }
    setListingFeedback(null);
    try {
      await createOrUpdateListing({
        id: `listing_${Date.now()}`,
        isNew: true,
        title: newListingTitle,
        address: newListingAddress,
        neighborhood: newListingNeighborhood || 'Austin',
        city: 'Austin',
        price: Number(newListingPrice) || 950000,
        beds: Number(newListingBeds) || 3,
        baths: Number(newListingBaths) || 2.5,
        sqft: Number(newListingSqft) || 2200,
        lotSqft: 7200,
        status: newListingStatus,
        propertyType: newListingType,
        daysOnMarket: 1,
        saleToListRatio: newListingStatus === 'sold' ? '102.0%' : 'Active',
        imageUrl: HERO_IMAGE_URL,
        description: `${newListingTitle} located in ${newListingNeighborhood}, Austin.`,
        highlights: ['Editorial twilight photography', 'Custom seller staging package'],
        featured: true,
      });
      setNewListingTitle('');
      setNewListingAddress('');
      setListingFeedback('Listing published to Firestore.');
    } catch (err) {
      setListingFeedback(err instanceof Error ? err.message : 'Failed to publish listing.');
    }
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBrand(true);
    setBrandMessage(null);
    try {
      await saveSiteBrandSettings(brandDraft);
      setBrandMessage('Brand settings saved to Firestore and applied live across the website.');
    } catch (err) {
      setBrandMessage(err instanceof Error ? err.message : 'Failed to save brand settings.');
    } finally {
      setSavingBrand(false);
    }
  };

  const downloadSvgTemplate = (variant: 'valuation' | 'postcard' | 'story') => {
    const width = variant === 'postcard' ? 1200 : 1080;
    const height = variant === 'story' ? 1920 : variant === 'postcard' ? 900 : 1080;
    const esc = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#FAFAF9"/>
  <rect x="48" y="48" width="${width - 96}" height="${height - 96}" fill="#FFFFFF" stroke="#E4E4E7" stroke-width="2"/>
  <rect x="48" y="48" width="${width - 96}" height="24" fill="${esc(brandDraft.accentColor)}"/>
  <text x="96" y="160" font-family="Georgia, serif" font-size="28" fill="#52525B">${esc(brandDraft.agencyName)} · ${esc(templateArea)}</text>
  <text x="96" y="340" font-family="Georgia, serif" font-size="64" font-weight="600" fill="#09090B">${esc(templateHeadline.slice(0, 44))}</text>
  <text x="96" y="425" font-family="sans-serif" font-size="30" fill="#3F3F46">${esc(templateSubtext)}</text>
  <rect x="96" y="${height - 230}" width="420" height="72" rx="8" fill="${esc(brandDraft.accentColor)}"/>
  <text x="132" y="${height - 184}" font-family="sans-serif" font-size="24" font-weight="600" fill="#FFFFFF">Book Listing Consultation</text>
  <text x="96" y="${height - 100}" font-family="sans-serif" font-size="24" fill="#52525B">${esc(brandDraft.agentName)} · ${esc(brandDraft.officePhone)} · ${esc(brandDraft.officeEmail)}</text>
</svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${brandDraft.agencyName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${variant}-template.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="max-w-[1200px] mx-auto px-6 py-10 space-y-8">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div className="space-y-1">
          <p className="text-xs font-medium text-zinc-500">
            {brand.agencyName} · Agent Workspace
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold text-zinc-950 font-editorial">
            CRM Lead Pipeline, Brand Customizer &amp; Handover Kit
          </h1>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <>
              <span className="text-xs text-zinc-600 hidden sm:inline">
                Signed in as {user.email}
              </span>
              <button
                type="button"
                onClick={() => void signOutAgent()}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-zinc-800 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void handleSignIn()}
              style={{ backgroundColor: brand.accentColor }}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-white rounded-lg hover:opacity-90"
            >
              <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Agent Google Sign-In</span>
            </button>
          )}
        </div>
      </div>

      {authError && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800" role="alert">
          {authError}
        </div>
      )}

      {/* Segmented Navigation Tabs */}
      <div
        role="tablist"
        aria-label="CRM Workspace Sections"
        className="flex items-center gap-1 p-1 bg-zinc-100 rounded-lg w-fit max-w-full overflow-x-auto"
      >
        {(
          [
            ['leads', 'Lead Pipeline & Tags'],
            ['listings', 'Listings Manager'],
            ['brand', 'Brand Customizer'],
            ['templates', 'Editable Templates & Guide'],
          ] as [CrmTab, string][]
        ).map(([tabKey, label]) => (
          <button
            key={tabKey}
            type="button"
            role="tab"
            aria-selected={activeTab === tabKey}
            onClick={() => setActiveTab(tabKey)}
            className={`px-3.5 py-2 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
              activeTab === tabKey
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Admin Gate Notice for Protected Tabs */}
      {activeTab !== 'templates' && !isAdmin && (
        <div className="bg-white border border-zinc-200 rounded-xl p-8 space-y-4">
          <h2 className="text-xl font-semibold text-zinc-950 font-editorial">
            Verified Broker Sign-In Required for Live CRM Data
          </h2>
          <p className="text-sm text-zinc-600 max-w-2xl leading-relaxed">
            To protect homeowner PII (names, phone numbers, email addresses, and property details), Firestore security rules restrict reading and editing leads, listings, and live brand settings to the verified agency admin ({BOOTSTRAPPED_ADMIN_EMAIL}).
          </p>
          {user && !isAdmin && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
              You are currently signed in as {user.email}, which does not have admin privileges. Switch to {BOOTSTRAPPED_ADMIN_EMAIL} or inspect the Editable Templates &amp; Handover Guide tab.
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleSignIn()}
              style={{ backgroundColor: brand.accentColor }}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-lg hover:opacity-90"
            >
              <LogIn className="w-4 h-4" aria-hidden="true" />
              <span>Sign In With Google</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('templates')}
              className="px-5 py-2.5 text-sm font-medium text-zinc-800 border border-zinc-300 rounded-lg hover:bg-zinc-50"
            >
              Open Templates &amp; Handover Guide
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: LEADS PIPELINE */}
      {activeTab === 'leads' && isAdmin && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 border border-zinc-200 rounded-xl bg-white divide-y lg:divide-y-0 lg:divide-x divide-zinc-200">
            <div className="p-5 space-y-1">
              <p className="text-xs text-zinc-500">Total CRM Leads</p>
              <p className="text-2xl font-semibold text-zinc-950 tabular-nums">{leads.length}</p>
            </div>
            <div className="p-5 space-y-1">
              <p className="text-xs text-zinc-500">New Uncontacted</p>
              <p className="text-2xl font-semibold text-zinc-950 tabular-nums">
                {leads.filter((l) => l.status === 'new').length}
              </p>
            </div>
            <div className="p-5 space-y-1">
              <p className="text-xs text-zinc-500">Consultations Booked</p>
              <p className="text-2xl font-semibold text-zinc-950 tabular-nums">
                {leads.filter((l) => l.status === 'consultation-booked').length}
              </p>
            </div>
            <div className="p-5 space-y-1">
              <p className="text-xs text-zinc-500">Seller Pipeline Volume</p>
              <p className="text-2xl font-semibold text-zinc-950 tabular-nums">
                {formatCurrency(pipelineValue)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <input
                  type="search"
                  aria-label="Search CRM leads"
                  value={leadQuery}
                  onChange={(e) => setLeadQuery(e.target.value)}
                  placeholder="Search lead name, address, or tag..."
                  className="px-3 py-2 text-sm border border-zinc-300 rounded-lg flex-1"
                />
                <select
                  aria-label="Filter leads by pipeline stage"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | LeadStatus)}
                  className="px-3 py-2 text-sm border border-zinc-300 rounded-lg bg-white"
                >
                  <option value="all">All Stages</option>
                  <option value="new">New Lead</option>
                  <option value="contacted">Contacted</option>
                  <option value="consultation-booked">Consultation Booked</option>
                  <option value="listed">Listed</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {leadsLoading ? (
                <div className="p-8 text-sm text-zinc-500">Loading leads from Firestore...</div>
              ) : leadsError ? (
                <div className="p-6 text-xs text-red-700">{leadsError}</div>
              ) : filteredLeads.length === 0 ? (
                <div className="p-10 text-center space-y-2">
                  <p className="text-sm font-medium text-zinc-900">No leads captured yet</p>
                  <p className="text-xs text-zinc-500">
                    Submit a test consultation in the Sell With Us funnel to watch it arrive here with automatic tags.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 text-xs text-zinc-500 bg-zinc-50">
                        <th className="py-2.5 px-4 font-medium">Seller / Lead</th>
                        <th className="py-2.5 px-4 font-medium">Property</th>
                        <th className="py-2.5 px-4 font-medium text-right">Est. Value</th>
                        <th className="py-2.5 px-4 font-medium">Stage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredLeads.map((lead) => (
                        <tr
                          key={lead.id}
                          className={`hover:bg-zinc-50 transition-colors ${
                            selectedLead?.id === lead.id ? 'bg-zinc-50' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => handleSelectLead(lead)}
                              className="text-left font-medium text-zinc-950 hover:underline"
                            >
                              {lead.fullName}
                            </button>
                            <p className="text-xs text-zinc-500 font-mono truncate max-w-[240px]">
                              {lead.tags.slice(0, 3).join(' · ')}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-zinc-800">{lead.propertyAddress}</p>
                            <p className="text-xs text-zinc-500">
                              {lead.neighborhood} · {lead.timeline}
                            </p>
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-zinc-900 tabular-nums">
                            {formatCurrency(lead.estimatedValue)}
                          </td>
                          <td className="py-3 px-4 text-xs font-medium text-zinc-700">
                            {STATUS_LABELS[lead.status]}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Lead Inspector */}
            <aside className="lg:col-span-4 bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
              {selectedLead ? (
                <form onSubmit={handleSaveLead} className="space-y-4">
                  <div className="border-b border-zinc-200 pb-3">
                    <p className="text-xs text-zinc-500">Lead Record</p>
                    <h2 className="text-lg font-semibold text-zinc-950">{selectedLead.fullName}</h2>
                    <p className="text-xs text-zinc-600 tabular-nums">
                      {selectedLead.email} · {selectedLead.phone}
                    </p>
                  </div>

                  <div className="text-xs text-zinc-600 space-y-1">
                    <p>
                      <strong className="text-zinc-900">Address:</strong> {selectedLead.propertyAddress} ({selectedLead.neighborhood})
                    </p>
                    <p>
                      <strong className="text-zinc-900">Preferred Slot:</strong> {selectedLead.preferredSlot}
                    </p>
                    <p>
                      <strong className="text-zinc-900">Condition:</strong> {selectedLead.homeCondition}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="crm-lead-status" className="block text-xs font-medium text-zinc-700 mb-1">
                      Pipeline Stage
                    </label>
                    <select
                      id="crm-lead-status"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as LeadStatus)}
                      className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg bg-white"
                    >
                      {Object.entries(STATUS_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="crm-lead-tags" className="block text-xs font-medium text-zinc-700 mb-1">
                      CRM Tags (comma-separated)
                    </label>
                    <input
                      id="crm-lead-tags"
                      type="text"
                      value={editTagsText}
                      onChange={(e) => setEditTagsText(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-zinc-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label htmlFor="crm-lead-notes" className="block text-xs font-medium text-zinc-700 mb-1">
                      Follow-Up Notes
                    </label>
                    <textarea
                      id="crm-lead-notes"
                      rows={3}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingLead}
                    style={{ backgroundColor: brand.accentColor }}
                    className="w-full py-2.5 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                  >
                    {savingLead ? 'Saving...' : 'Update Lead in Firestore'}
                  </button>
                </form>
              ) : (
                <div className="space-y-3 text-sm text-zinc-600">
                  <p className="font-semibold text-zinc-900">Automated Tagging Rules Active</p>
                  <p className="text-xs leading-relaxed">
                    Select any lead from the table to edit its CRM stage or notes. Every website submission automatically receives:
                  </p>
                  <ul className="text-xs space-y-1.5 font-mono text-zinc-700 list-disc pl-4">
                    <li>seller-consultation / home-valuation</li>
                    <li>timeline-hot-30d / timeline-warm-90d</li>
                    <li>tier-luxury-1.5m-plus / tier-premier-800k-plus</li>
                    <li>prep-turnkey-launch / prep-staging-advisory</li>
                    <li>area-[neighborhood]</li>
                  </ul>
                </div>
              )}
            </aside>
          </div>
        </div>
      )}

      {/* TAB 2: LISTINGS MANAGER */}
      {activeTab === 'listings' && isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form
            onSubmit={handleAddListing}
            className="lg:col-span-5 bg-white border border-zinc-200 rounded-xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-950">Add Property Listing</h2>
              <button
                type="button"
                disabled={seedingListings}
                onClick={() => void handleSeedListings()}
                className="text-xs font-medium text-zinc-800 underline underline-offset-4 hover:opacity-75"
              >
                {seedingListings ? 'Syncing...' : 'Sync Sample Portfolio'}
              </button>
            </div>

            <div>
              <label htmlFor="add-title" className="block text-xs font-medium text-zinc-700 mb-1">
                Listing Headline
              </label>
              <input
                id="add-title"
                type="text"
                required
                value={newListingTitle}
                onChange={(e) => setNewListingTitle(e.target.value)}
                placeholder="Barton Hills Contemporary"
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
              />
            </div>

            <div>
              <label htmlFor="add-address" className="block text-xs font-medium text-zinc-700 mb-1">
                Street Address
              </label>
              <input
                id="add-address"
                type="text"
                required
                value={newListingAddress}
                onChange={(e) => setNewListingAddress(e.target.value)}
                placeholder="1904 Treadwell St"
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="add-neighborhood" className="block text-xs font-medium text-zinc-700 mb-1">
                  Neighborhood
                </label>
                <input
                  id="add-neighborhood"
                  type="text"
                  value={newListingNeighborhood}
                  onChange={(e) => setNewListingNeighborhood(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="add-price" className="block text-xs font-medium text-zinc-700 mb-1">
                  Price (USD)
                </label>
                <input
                  id="add-price"
                  type="number"
                  value={newListingPrice}
                  onChange={(e) => setNewListingPrice(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="add-beds" className="block text-xs font-medium text-zinc-700 mb-1">
                  Beds
                </label>
                <input
                  id="add-beds"
                  type="number"
                  value={newListingBeds}
                  onChange={(e) => setNewListingBeds(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="add-baths" className="block text-xs font-medium text-zinc-700 mb-1">
                  Baths
                </label>
                <input
                  id="add-baths"
                  type="number"
                  step="0.5"
                  value={newListingBaths}
                  onChange={(e) => setNewListingBaths(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="add-sqft" className="block text-xs font-medium text-zinc-700 mb-1">
                  Sq Ft
                </label>
                <input
                  id="add-sqft"
                  type="number"
                  value={newListingSqft}
                  onChange={(e) => setNewListingSqft(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="add-status" className="block text-xs font-medium text-zinc-700 mb-1">
                  Status
                </label>
                <select
                  id="add-status"
                  value={newListingStatus}
                  onChange={(e) => setNewListingStatus(e.target.value as ListingStatus)}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg bg-white"
                >
                  <option value="for-sale">For Sale</option>
                  <option value="pending">Pending</option>
                  <option value="sold">Sold</option>
                </select>
              </div>
              <div>
                <label htmlFor="add-type" className="block text-xs font-medium text-zinc-700 mb-1">
                  Type
                </label>
                <select
                  id="add-type"
                  value={newListingType}
                  onChange={(e) => setNewListingType(e.target.value as ListingPropertyType)}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg bg-white"
                >
                  <option value="Single Family">Single Family</option>
                  <option value="Modern Estate">Modern Estate</option>
                  <option value="Townhome">Townhome</option>
                  <option value="Condo">Condo</option>
                </select>
              </div>
            </div>

            {listingFeedback && (
              <p className="text-xs text-zinc-700 bg-zinc-100 p-2.5 rounded-lg">{listingFeedback}</p>
            )}

            <button
              type="submit"
              style={{ backgroundColor: brand.accentColor }}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white rounded-lg hover:opacity-90"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Publish Listing</span>
            </button>
          </form>

          <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-zinc-200">
              <h2 className="text-sm font-semibold text-zinc-900">
                Active &amp; Sold Portfolio ({listings.length})
              </h2>
            </div>
            <div className="divide-y divide-zinc-100">
              {listings.map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-zinc-50"
                >
                  <div>
                    <p className="text-sm font-semibold text-zinc-950">{item.title}</p>
                    <p className="text-xs text-zinc-500 tabular-nums">
                      {item.address} · {item.neighborhood} · {formatCurrency(item.price)} · {item.status}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void removeListing(item.id)}
                    aria-label={`Delete listing ${item.title}`}
                    className="p-2 text-zinc-500 hover:text-red-700 rounded-lg hover:bg-zinc-100"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BRAND CUSTOMIZER */}
      {activeTab === 'brand' && isAdmin && (
        <form
          onSubmit={handleSaveBrand}
          className="bg-white border border-zinc-200 rounded-xl p-6 md:p-8 space-y-6 max-w-3xl"
        >
          <div className="space-y-1 border-b border-zinc-200 pb-4">
            <h2 className="text-xl font-semibold text-zinc-950 font-editorial">
              Agency Brand &amp; Copy Customizer
            </h2>
            <p className="text-xs text-zinc-600">
              Adjust your Canva-matched colors, typography style, and hero copy anytime. Changes save directly to Firestore and update the live website immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="brand-agency" className="block text-xs font-medium text-zinc-700 mb-1">
                Agency Name
              </label>
              <input
                id="brand-agency"
                type="text"
                value={brandDraft.agencyName}
                onChange={(e) => setBrandDraft({ ...brandDraft, agencyName: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="brand-agent" className="block text-xs font-medium text-zinc-700 mb-1">
                Principal Agent Name
              </label>
              <input
                id="brand-agent"
                type="text"
                value={brandDraft.agentName}
                onChange={(e) => setBrandDraft({ ...brandDraft, agentName: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="brand-font" className="block text-xs font-medium text-zinc-700 mb-1">
                Headline Typography Pairing
              </label>
              <select
                id="brand-font"
                value={brandDraft.fontStyle}
                onChange={(e) =>
                  setBrandDraft({
                    ...brandDraft,
                    fontStyle: e.target.value as SiteBrandSettings['fontStyle'],
                  })
                }
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg bg-white"
              >
                <option value="editorial-serif">Editorial Serif (Fraunces + Plus Jakarta Sans)</option>
                <option value="modern-architectural">Modern Architectural Sans (Plus Jakarta Sans)</option>
              </select>
            </div>

            <div>
              <span className="block text-xs font-medium text-zinc-700 mb-1">
                Brand Accent Color
              </span>
              <div className="flex items-center gap-2">
                {BRAND_COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => setBrandDraft({ ...brandDraft, accentColor: preset.hex })}
                    aria-label={`Select ${preset.name} color`}
                    style={{ backgroundColor: preset.hex }}
                    className={`w-9 h-9 rounded-lg border-2 transition-transform ${
                      brandDraft.accentColor === preset.hex
                        ? 'border-zinc-950 scale-105'
                        : 'border-transparent'
                    }`}
                  />
                ))}
                <input
                  type="text"
                  aria-label="Custom accent hex color"
                  value={brandDraft.accentColor}
                  onChange={(e) => setBrandDraft({ ...brandDraft, accentColor: e.target.value })}
                  className="w-24 px-2.5 py-2 text-xs font-mono border border-zinc-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="brand-headline" className="block text-xs font-medium text-zinc-700 mb-1">
              Hero Headline
            </label>
            <input
              id="brand-headline"
              type="text"
              value={brandDraft.heroHeadline}
              onChange={(e) => setBrandDraft({ ...brandDraft, heroHeadline: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
            />
          </div>

          <div>
            <label htmlFor="brand-subheadline" className="block text-xs font-medium text-zinc-700 mb-1">
              Hero Subheadline
            </label>
            <textarea
              id="brand-subheadline"
              rows={2}
              value={brandDraft.heroSubheadline}
              onChange={(e) => setBrandDraft({ ...brandDraft, heroSubheadline: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
            />
          </div>

          <div>
            <label htmlFor="brand-bio" className="block text-xs font-medium text-zinc-700 mb-1">
              Agent About Bio
            </label>
            <textarea
              id="brand-bio"
              rows={3}
              value={brandDraft.agentBio}
              onChange={(e) => setBrandDraft({ ...brandDraft, agentBio: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
            />
          </div>

          {brandMessage && (
            <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
              {brandMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={savingBrand}
            style={{ backgroundColor: brandDraft.accentColor }}
            className="px-6 py-2.5 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {savingBrand ? 'Saving Brand Settings...' : 'Save & Publish Brand Changes'}
          </button>
        </form>
      )}

      {/* TAB 4: EDITABLE TEMPLATES & HANDOVER GUIDE */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-xl p-6 md:p-8 space-y-6">
            <div className="space-y-1 border-b border-zinc-200 pb-4">
              <h2 className="text-xl font-semibold text-zinc-950 font-editorial">
                Editable Canva-Ready Brand Template Kit
              </h2>
              <p className="text-xs text-zinc-600">
                Customize the text below and download clean vector SVG templates ready to import directly into Canva for social posts, seller mailers, and open house flyers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="tpl-headline" className="block text-xs font-medium text-zinc-700 mb-1">
                  Graphic Headline
                </label>
                <input
                  id="tpl-headline"
                  type="text"
                  value={templateHeadline}
                  onChange={(e) => setTemplateHeadline(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="tpl-area" className="block text-xs font-medium text-zinc-700 mb-1">
                  Local Neighborhood Strip
                </label>
                <input
                  id="tpl-area"
                  type="text"
                  value={templateArea}
                  onChange={(e) => setTemplateArea(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label htmlFor="tpl-subtext" className="block text-xs font-medium text-zinc-700 mb-1">
                Callout Subtext
              </label>
              <input
                id="tpl-subtext"
                type="text"
                value={templateSubtext}
                onChange={(e) => setTemplateSubtext(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
              />
            </div>

            {/* Live Branded Graphic Preview */}
            <div className="border border-zinc-200 rounded-lg p-6 bg-[#FAFAF9] space-y-4">
              <div
                style={{ backgroundColor: brandDraft.accentColor }}
                className="h-2 w-full rounded-sm"
              />
              <p className="text-xs text-zinc-500">
                {brandDraft.agencyName} · {templateArea}
              </p>
              <p className="text-2xl font-semibold text-zinc-950 font-editorial leading-snug">
                {templateHeadline}
              </p>
              <p className="text-sm text-zinc-600">{templateSubtext}</p>
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 text-xs text-zinc-600">
                <span>
                  {brandDraft.agentName} · {brandDraft.officePhone}
                </span>
                <span
                  style={{ backgroundColor: brandDraft.accentColor }}
                  className="px-3 py-1.5 text-white rounded-md font-medium"
                >
                  Book Listing Consultation
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => downloadSvgTemplate('valuation')}
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium text-zinc-900 border border-zinc-300 rounded-lg hover:bg-zinc-50"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Social Square SVG</span>
              </button>
              <button
                type="button"
                onClick={() => downloadSvgTemplate('postcard')}
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium text-zinc-900 border border-zinc-300 rounded-lg hover:bg-zinc-50"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Mailer Postcard SVG</span>
              </button>
              <button
                type="button"
                onClick={() => downloadSvgTemplate('story')}
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium text-zinc-900 border border-zinc-300 rounded-lg hover:bg-zinc-50"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Vertical Story SVG</span>
              </button>
            </div>
          </div>

          {/* Client Self-Maintenance Quick Guide */}
          <aside className="lg:col-span-5 bg-white border border-zinc-200 rounded-xl p-6 md:p-8 space-y-5">
            <div className="space-y-1 border-b border-zinc-200 pb-4">
              <p className="text-xs font-medium text-zinc-500">Client Handover Documentation</p>
              <h2 className="text-xl font-semibold text-zinc-950 font-editorial">
                Quick Guide: Tweak Copy, Swap Photos &amp; Manage Leads
              </h2>
            </div>

            <ol className="space-y-4 text-sm text-zinc-700 leading-relaxed">
              <li>
                <strong className="text-zinc-950 block">1. Swapping Headline Text &amp; Colors</strong>
                Open the <em>Brand Customizer</em> tab in this Agent CRM portal, update your Agency Name, Hero Headline, or Accent Hex Color, and click Save. The public homepage and funnel update instantly without touching code.
              </li>
              <li>
                <strong className="text-zinc-950 block">2. Publishing or Updating Property Photos</strong>
                Use the <em>Listings Manager</em> tab to publish new active listings or mark homes as Pending/Sold. You can paste any hosted property image URL or upload new assets to Firebase Storage.
              </li>
              <li>
                <strong className="text-zinc-950 block">3. Editing Graphic Templates in Canva</strong>
                Download any of the three SVG templates on the left, drag the `.svg` file directly into a blank Canva canvas, and every layer (headline, color bar, contact line) remains individually editable.
              </li>
              <li>
                <strong className="text-zinc-950 block">4. Working Seller Consultation Leads</strong>
                Every seller who completes the <em>Sell With Us</em> funnel drops directly into <em>Lead Pipeline &amp; Tags</em> with automatic intent, timeline, price-tier, and neighborhood tags.
              </li>
            </ol>
          </aside>
        </div>
      )}
    </section>
  );
}
