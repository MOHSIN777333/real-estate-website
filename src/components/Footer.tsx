import type { AppPage, SiteBrandSettings } from '../types/realEstate';

interface FooterProps {
  brand: SiteBrandSettings;
  onNavigate: (page: AppPage) => void;
}

export function Footer({ brand, onNavigate }: FooterProps) {
  const go = (page: AppPage) => {
    onNavigate(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-zinc-200 bg-white text-zinc-700">
      <div className="max-w-[1200px] mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-5 space-y-3">
          <p className="text-lg font-semibold text-zinc-950 font-editorial">
            {brand.agencyName}
          </p>
          <p className="text-sm text-zinc-600 leading-relaxed max-w-sm">
            Independent residential seller representation and architectural property marketing serving {brand.cityRegion}.
          </p>
          <p className="text-xs text-zinc-500">
            {brand.agentName} · {brand.licenseNumber}
          </p>
        </div>

        <div className="md:col-span-3 space-y-2.5 text-sm">
          <p className="font-semibold text-zinc-950">Navigation</p>
          <ul className="space-y-2 text-zinc-600">
            <li>
              <button type="button" onClick={() => go('sell')} className="hover:text-zinc-950 transition-colors">
                Seller Consultation Funnel
              </button>
            </li>
            <li>
              <button type="button" onClick={() => go('listings')} className="hover:text-zinc-950 transition-colors">
                Property Search &amp; Sold Portfolio
              </button>
            </li>
            <li>
              <button type="button" onClick={() => go('about')} className="hover:text-zinc-950 transition-colors">
                About {brand.agentName}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => go('contact')} className="hover:text-zinc-950 transition-colors">
                Contact Office
              </button>
            </li>
          </ul>
        </div>

        <div className="md:col-span-4 space-y-2.5 text-sm">
          <p className="font-semibold text-zinc-950">Austin Office &amp; Agent Portal</p>
          <p className="text-zinc-600 leading-relaxed">{brand.officeAddress}</p>
          <p className="text-zinc-600 tabular-nums">
            {brand.officePhone} · {brand.officeEmail}
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => go('crm')}
              className="text-xs font-medium text-zinc-900 underline underline-offset-4 hover:opacity-75 transition-opacity"
            >
              Open Agent CRM &amp; Brand Template Kit
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-200/80">
        <div className="max-w-[1200px] mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
          <span>
            &copy; {new Date().getFullYear()} {brand.agencyName}. Equal Housing Opportunity.
          </span>
          <span>Serving Zilker · Barton Creek · Tarrytown · East Austin · South Congress</span>
        </div>
      </div>
    </footer>
  );
}
