import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { DEFAULT_BRAND_SETTINGS, SEED_LISTINGS } from '../data/seedData';
import type {
  LeadInput,
  LeadRecord,
  LeadStatus,
  ListingRecord,
  SiteBrandSettings,
} from '../types/realEstate';
import {
  generateAutomatedCrmTags,
  sanitizeLeadPayload,
} from '../utils/crmLogic';
import {
  OperationType,
  db,
  handleFirestoreError,
} from './firebase';

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  if (value instanceof Date) {
    return value;
  }
  return new Date();
}

function createSafeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

export async function submitLeadToFirestore(
  rawInput: LeadInput
): Promise<{ id: string; tags: string[] }> {
  const clean = sanitizeLeadPayload(rawInput);
  const tags = generateAutomatedCrmTags({
    leadType: clean.leadType,
    timeline: clean.timeline,
    estimatedValue: clean.estimatedValue,
    homeCondition: clean.homeCondition,
    neighborhood: clean.neighborhood,
  });

  const leadId = createSafeId('lead');
  const path = `leads/${leadId}`;

  try {
    await setDoc(doc(db, 'leads', leadId), {
      ...clean,
      tags,
      status: 'new' as LeadStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: leadId, tags };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeListings(
  onData: (listings: ListingRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'listings';
  // Query explicitly includes status constraint so Firestore security rules validate list access.
  const q = query(
    collection(db, 'listings'),
    where('status', 'in', ['for-sale', 'pending', 'sold'])
  );

  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        onData(SEED_LISTINGS);
        return;
      }
      const rows: ListingRecord[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          title: String(d.title ?? ''),
          address: String(d.address ?? ''),
          neighborhood: String(d.neighborhood ?? ''),
          city: String(d.city ?? 'Austin'),
          price: Number(d.price ?? 0),
          beds: Number(d.beds ?? 0),
          baths: Number(d.baths ?? 0),
          sqft: Number(d.sqft ?? 0),
          lotSqft: Number(d.lotSqft ?? 0),
          status: (d.status as ListingRecord['status']) ?? 'for-sale',
          propertyType: (d.propertyType as ListingRecord['propertyType']) ?? 'Single Family',
          daysOnMarket: Number(d.daysOnMarket ?? 0),
          saleToListRatio: String(d.saleToListRatio ?? 'Active'),
          imageUrl: String(d.imageUrl ?? ''),
          description: String(d.description ?? ''),
          highlights: Array.isArray(d.highlights) ? d.highlights.map(String) : [],
          featured: Boolean(d.featured),
          createdAt: toDate(d.createdAt),
          updatedAt: toDate(d.updatedAt),
        };
      });
      rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      onData(rows);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export async function seedInitialListingsToFirestore(): Promise<void> {
  for (const listing of SEED_LISTINGS) {
    const path = `listings/${listing.id}`;
    try {
      const existingSnap = await getDoc(doc(db, 'listings', listing.id));
      if (!existingSnap.exists()) {
        await setDoc(doc(db, 'listings', listing.id), {
          title: listing.title.slice(0, 120),
          address: listing.address.slice(0, 160),
          neighborhood: listing.neighborhood.slice(0, 80),
          city: listing.city.slice(0, 80),
          price: listing.price,
          beds: listing.beds,
          baths: listing.baths,
          sqft: listing.sqft,
          lotSqft: listing.lotSqft,
          status: listing.status,
          propertyType: listing.propertyType,
          daysOnMarket: listing.daysOnMarket,
          saleToListRatio: listing.saleToListRatio.slice(0, 20),
          imageUrl: listing.imageUrl.slice(0, 300),
          description: listing.description.slice(0, 1200),
          highlights: listing.highlights.slice(0, 8),
          featured: listing.featured,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }
}

export async function createOrUpdateListing(
  listing: Omit<ListingRecord, 'createdAt' | 'updatedAt'> & { isNew?: boolean }
): Promise<void> {
  const safeId = (listing.id || createSafeId('listing')).replace(/[^a-zA-Z0-9_-]/g, '');
  const path = `listings/${safeId}`;
  const payload = {
    title: listing.title.trim().slice(0, 120),
    address: listing.address.trim().slice(0, 160),
    neighborhood: listing.neighborhood.trim().slice(0, 80),
    city: listing.city.trim().slice(0, 80),
    price: Number(listing.price),
    beds: Number(listing.beds),
    baths: Number(listing.baths),
    sqft: Number(listing.sqft),
    lotSqft: Number(listing.lotSqft),
    status: listing.status,
    propertyType: listing.propertyType,
    daysOnMarket: Number(listing.daysOnMarket),
    saleToListRatio: listing.saleToListRatio.trim().slice(0, 20),
    imageUrl: listing.imageUrl.trim().slice(0, 300),
    description: listing.description.trim().slice(0, 1200),
    highlights: listing.highlights.slice(0, 8).map((h) => h.trim().slice(0, 100)).filter(Boolean),
    featured: Boolean(listing.featured),
    updatedAt: serverTimestamp(),
  };

  try {
    if (listing.isNew) {
      await setDoc(doc(db, 'listings', safeId), {
        ...payload,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'listings', safeId), payload);
    }
  } catch (error) {
    handleFirestoreError(
      error,
      listing.isNew ? OperationType.CREATE : OperationType.UPDATE,
      path
    );
  }
}

export async function removeListing(listingId: string): Promise<void> {
  const path = `listings/${listingId}`;
  try {
    await deleteDoc(doc(db, 'listings', listingId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeSiteBrandSettings(
  onData: (settings: SiteBrandSettings) => void
): Unsubscribe {
  const path = 'siteSettings/brand';
  return onSnapshot(
    doc(db, 'siteSettings', 'brand'),
    (docSnap) => {
      if (!docSnap.exists()) {
        onData(DEFAULT_BRAND_SETTINGS);
        return;
      }
      const d = docSnap.data();
      onData({
        agencyName: String(d.agencyName ?? DEFAULT_BRAND_SETTINGS.agencyName),
        agentName: String(d.agentName ?? DEFAULT_BRAND_SETTINGS.agentName),
        agentTitle: String(d.agentTitle ?? DEFAULT_BRAND_SETTINGS.agentTitle),
        licenseNumber: String(d.licenseNumber ?? DEFAULT_BRAND_SETTINGS.licenseNumber),
        cityRegion: String(d.cityRegion ?? DEFAULT_BRAND_SETTINGS.cityRegion),
        officeAddress: String(d.officeAddress ?? DEFAULT_BRAND_SETTINGS.officeAddress),
        officePhone: String(d.officePhone ?? DEFAULT_BRAND_SETTINGS.officePhone),
        officeEmail: String(d.officeEmail ?? DEFAULT_BRAND_SETTINGS.officeEmail),
        accentColor: String(d.accentColor ?? DEFAULT_BRAND_SETTINGS.accentColor),
        fontStyle:
          d.fontStyle === 'modern-architectural'
            ? 'modern-architectural'
            : 'editorial-serif',
        heroHeadline: String(d.heroHeadline ?? DEFAULT_BRAND_SETTINGS.heroHeadline),
        heroSubheadline: String(
          d.heroSubheadline ?? DEFAULT_BRAND_SETTINGS.heroSubheadline
        ),
        agentBio: String(d.agentBio ?? DEFAULT_BRAND_SETTINGS.agentBio),
        updatedAt: toDate(d.updatedAt),
      });
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveSiteBrandSettings(
  settings: Omit<SiteBrandSettings, 'updatedAt'>
): Promise<void> {
  const path = 'siteSettings/brand';
  const payload = {
    agencyName: settings.agencyName.trim().slice(0, 80),
    agentName: settings.agentName.trim().slice(0, 80),
    agentTitle: settings.agentTitle.trim().slice(0, 80),
    licenseNumber: settings.licenseNumber.trim().slice(0, 40),
    cityRegion: settings.cityRegion.trim().slice(0, 80),
    officeAddress: settings.officeAddress.trim().slice(0, 160),
    officePhone: settings.officePhone.trim().slice(0, 30),
    officeEmail: settings.officeEmail.trim().slice(0, 120),
    accentColor: /^#[0-9A-Fa-f]{6}$/.test(settings.accentColor)
      ? settings.accentColor
      : DEFAULT_BRAND_SETTINGS.accentColor,
    fontStyle: settings.fontStyle,
    heroHeadline: settings.heroHeadline.trim().slice(0, 140),
    heroSubheadline: settings.heroSubheadline.trim().slice(0, 260),
    agentBio: settings.agentBio.trim().slice(0, 1000),
    updatedAt: serverTimestamp(),
  };

  try {
    const existingSnap = await getDoc(doc(db, 'siteSettings', 'brand'));
    if (existingSnap.exists()) {
      await updateDoc(doc(db, 'siteSettings', 'brand'), payload);
    } else {
      await setDoc(doc(db, 'siteSettings', 'brand'), payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeAdminLeads(
  onData: (leads: LeadRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'leads';
  const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const rows: LeadRecord[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          fullName: String(d.fullName ?? ''),
          email: String(d.email ?? ''),
          phone: String(d.phone ?? ''),
          propertyAddress: String(d.propertyAddress ?? ''),
          neighborhood: String(d.neighborhood ?? ''),
          propertyType: (d.propertyType as LeadRecord['propertyType']) ?? 'Single Family',
          estimatedValue: Number(d.estimatedValue ?? 0),
          timeline: (d.timeline as LeadRecord['timeline']) ?? '1-3 Months',
          homeCondition: (d.homeCondition as LeadRecord['homeCondition']) ?? 'Move-in Ready',
          leadType: (d.leadType as LeadRecord['leadType']) ?? 'seller-consultation',
          preferredSlot: String(d.preferredSlot ?? ''),
          notes: String(d.notes ?? ''),
          tags: Array.isArray(d.tags) ? d.tags.map(String) : ['seller-consultation'],
          status: (d.status as LeadStatus) ?? 'new',
          sourcePage: String(d.sourcePage ?? '/sell'),
          createdAt: toDate(d.createdAt),
          updatedAt: toDate(d.updatedAt),
        };
      });
      onData(rows);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export async function updateLeadInFirestore(
  leadId: string,
  updates: {
    status: LeadStatus;
    notes: string;
    tags: string[];
  }
): Promise<void> {
  const path = `leads/${leadId}`;
  const cleanTags = updates.tags
    .map((t) => t.trim().slice(0, 50))
    .filter(Boolean)
    .slice(0, 10);
  if (cleanTags.length === 0) {
    cleanTags.push('seller-consultation');
  }

  try {
    await updateDoc(doc(db, 'leads', leadId), {
      status: updates.status,
      notes: updates.notes.trim().slice(0, 1000),
      tags: cleanTags,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
