import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { AboutPage } from './components/AboutPage';
import { AgentCrmPage } from './components/AgentCrmPage';
import { ContactPage } from './components/ContactPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { ListingDetailModal } from './components/ListingDetailModal';
import { ListingsPage } from './components/ListingsPage';
import { SellerFunnelPage } from './components/SellerFunnelPage';
import { DEFAULT_BRAND_SETTINGS, SEED_LISTINGS } from './data/seedData';
import { auth } from './services/firebase';
import {
  subscribeListings,
  subscribeSiteBrandSettings,
} from './services/realEstateStore';
import type {
  AppPage,
  ListingRecord,
  SiteBrandSettings,
} from './types/realEstate';

export default function App() {
  const [page, setPage] = useState<AppPage>('home');
  const [brand, setBrand] = useState<SiteBrandSettings>(DEFAULT_BRAND_SETTINGS);
  const [listings, setListings] = useState<ListingRecord[]>(SEED_LISTINGS);
  const [selectedListing, setSelectedListing] = useState<ListingRecord | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });
    const unsubListings = subscribeListings((rows) => {
      setListings(rows);
    });
    const unsubBrand = subscribeSiteBrandSettings((nextBrand) => {
      setBrand(nextBrand);
    });

    return () => {
      unsubAuth();
      unsubListings();
      unsubBrand();
    };
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as AppPage;
    if (['home', 'sell', 'listings', 'about', 'contact', 'crm'].includes(hash)) {
      setPage(hash);
    }
  }, []);

  const navigate = (nextPage: AppPage) => {
    setPage(nextPage);
    window.history.replaceState(null, '', `#${nextPage}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-[#FAFAF9] text-zinc-900">
        <Header currentPage={page} onNavigate={navigate} brand={brand} />

        <main className="flex-1">
          {page === 'home' && (
            <HomePage
              brand={brand}
              listings={listings}
              onNavigate={navigate}
              onSelectListing={(l) => setSelectedListing(l)}
            />
          )}

          {page === 'sell' && (
            <SellerFunnelPage
              brand={brand}
              onBackHome={() => navigate('home')}
            />
          )}

          {page === 'listings' && (
            <ListingsPage
              brand={brand}
              listings={listings}
              onSelectListing={(l) => setSelectedListing(l)}
              onNavigate={navigate}
            />
          )}

          {page === 'about' && (
            <AboutPage brand={brand} onNavigate={navigate} />
          )}

          {page === 'contact' && <ContactPage brand={brand} />}

          {page === 'crm' && (
            <AgentCrmPage
              user={user}
              authReady={authReady}
              brand={brand}
              listings={listings}
            />
          )}
        </main>

        <Footer brand={brand} onNavigate={navigate} />

        <ListingDetailModal
          listing={selectedListing}
          brand={brand}
          onClose={() => setSelectedListing(null)}
          onStartSellerFunnel={() => navigate('sell')}
        />
      </div>
    </ErrorBoundary>
  );
}
