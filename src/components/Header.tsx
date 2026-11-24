import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import type { AppPage, SiteBrandSettings } from '../types/realEstate';

interface HeaderProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  brand: SiteBrandSettings;
}

const NAV_ITEMS: { page: AppPage; label: string }[] = [
  { page: 'home', label: 'Home' },
  { page: 'sell', label: 'Sell With Us' },
  { page: 'listings', label: 'Listings' },
  { page: 'about', label: 'About' },
  { page: 'contact', label: 'Contact' },
];

export function Header({ currentPage, onNavigate, brand }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (page: AppPage) => {
    onNavigate(page);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAFAF9]/95 backdrop-blur-sm border-b border-zinc-200/80">
      <div className="max-w-[1200px] mx-auto px-6 h-[68px] flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            handleNav('home');
          }}
          className={`text-xl font-semibold tracking-tight text-zinc-900 whitespace-nowrap shrink-0 ${
            brand.fontStyle === 'editorial-serif' ? 'font-editorial' : ''
          }`}
        >
          {brand.agencyName}
        </a>

        {/* Zone 2: 5 concise single-line text nav links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-600"
        >
          {NAV_ITEMS.map((item) => {
            const active = currentPage === item.page;
            return (
              <a
                key={item.page}
                href={`#${item.page}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNav(item.page);
                }}
                aria-current={active ? 'page' : undefined}
                className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors duration-150 ${
                  active
                    ? 'text-zinc-950 border-zinc-900'
                    : 'border-transparent hover:text-zinc-950 hover:border-zinc-300'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Single primary CTA + mobile menu toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleNav('sell')}
            style={{ backgroundColor: brand.accentColor }}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
          >
            Book Consultation
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-zinc-200 text-zinc-800 hover:bg-zinc-100 transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden border-t border-zinc-200 bg-white px-6 py-4 space-y-2"
        >
          {NAV_ITEMS.map((item) => (
            <button
              key={item.page}
              type="button"
              onClick={() => handleNav(item.page)}
              className={`block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                currentPage === item.page
                  ? 'bg-zinc-100 text-zinc-950'
                  : 'text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleNav('sell')}
            style={{ backgroundColor: brand.accentColor }}
            className="w-full mt-2 px-4 py-3 text-sm font-medium text-white rounded-lg text-center"
          >
            Book Consultation
          </button>
        </nav>
      )}
    </header>
  );
}
