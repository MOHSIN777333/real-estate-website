import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSellerNetEstimate,
  filterListings,
  generateAutomatedCrmTags,
  validateLeadForm,
} from './crmLogic';
import type { LeadInput, ListingRecord } from '../types/realEstate';

test('generateAutomatedCrmTags assigns seller-consultation, urgency, tier, and neighborhood tags', () => {
  const tags = generateAutomatedCrmTags({
    leadType: 'seller-consultation',
    timeline: 'ASAP (0-30 Days)',
    estimatedValue: 1650000,
    homeCondition: 'Turnkey / Renovated',
    neighborhood: 'Barton Creek',
  });

  assert.ok(tags.includes('seller-consultation'));
  assert.ok(tags.includes('high-intent-seller'));
  assert.ok(tags.includes('timeline-hot-30d'));
  assert.ok(tags.includes('tier-luxury-1.5m-plus'));
  assert.ok(tags.includes('prep-turnkey-launch'));
  assert.ok(tags.includes('area-barton-creek'));
  assert.ok(tags.length <= 10);
});

test('calculateSellerNetEstimate returns coherent projected net range', () => {
  const result = calculateSellerNetEstimate({
    estimatedValue: 1000000,
    homeCondition: 'Move-in Ready',
    timeline: '1-3 Months',
  });

  assert.equal(result.lowMarketEstimate, 980000);
  assert.equal(result.highMarketEstimate, 1035000);
  assert.ok(result.projectedNetHigh > result.projectedNetLow);
  assert.ok(result.projectedNetLow > 800000);
});

test('validateLeadForm rejects invalid email and missing address without silent fallback', () => {
  const badInput: LeadInput = {
    fullName: 'A',
    email: 'invalid-email',
    phone: '123',
    propertyAddress: '',
    neighborhood: 'Zilker',
    propertyType: 'Single Family',
    estimatedValue: 950000,
    timeline: '1-3 Months',
    homeCondition: 'Move-in Ready',
    leadType: 'seller-consultation',
    preferredSlot: 'Tuesday 2:00 PM',
    notes: '',
    sourcePage: '/sell',
  };

  const result = validateLeadForm(badInput);
  assert.equal(result.valid, false);
  assert.ok(result.errors.fullName);
  assert.ok(result.errors.email);
  assert.ok(result.errors.phone);
  assert.ok(result.errors.propertyAddress);
});

test('filterListings filters accurately by query, status, minBeds, and maxPrice', () => {
  const sampleListings: ListingRecord[] = [
    {
      id: '1',
      title: 'Limestone Terrace Estate',
      address: '2104 Barton Hills Dr',
      neighborhood: 'Barton Hills',
      city: 'Austin',
      price: 1850000,
      beds: 4,
      baths: 3.5,
      sqft: 3400,
      lotSqft: 11000,
      status: 'for-sale',
      propertyType: 'Modern Estate',
      daysOnMarket: 8,
      saleToListRatio: 'Active',
      imageUrl: '/img1.jpg',
      description: 'Modern estate',
      highlights: ['Pool'],
      featured: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      title: 'Zilker Park Craftsman',
      address: '1428 Kinney Ave',
      neighborhood: 'Zilker',
      city: 'Austin',
      price: 1150000,
      beds: 3,
      baths: 2.5,
      sqft: 2250,
      lotSqft: 7200,
      status: 'sold',
      propertyType: 'Single Family',
      daysOnMarket: 11,
      saleToListRatio: '103.4%',
      imageUrl: '/img2.jpg',
      description: 'Craftsman',
      highlights: ['Patio'],
      featured: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const byNeighborhood = filterListings(sampleListings, {
    query: 'zilker',
    status: 'all',
    propertyType: 'all',
    minBeds: 0,
    maxPrice: 0,
  });
  assert.equal(byNeighborhood.length, 1);
  assert.equal(byNeighborhood[0].id, '2');

  const byBedsAndStatus = filterListings(sampleListings, {
    query: '',
    status: 'for-sale',
    propertyType: 'all',
    minBeds: 4,
    maxPrice: 2000000,
  });
  assert.equal(byBedsAndStatus.length, 1);
  assert.equal(byBedsAndStatus[0].id, '1');
});
