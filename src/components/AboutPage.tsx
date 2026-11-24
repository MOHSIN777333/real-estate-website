import { AGENT_PORTRAIT_URL } from '../data/seedData';
import type { AppPage, SiteBrandSettings } from '../types/realEstate';
import { PropertyImage } from './PropertyImage';

interface AboutPageProps {
  brand: SiteBrandSettings;
  onNavigate: (page: AppPage) => void;
}

export function AboutPage({ brand, onNavigate }: AboutPageProps) {
  return (
    <section className="max-w-[1100px] mx-auto px-6 py-12 lg:py-16 space-y-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
        <div className="lg:col-span-5">
          <div className="w-full h-full min-h-[380px] rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100">
            <PropertyImage
              src={AGENT_PORTRAIT_URL}
              alt={`${brand.agentName}, ${brand.agentTitle}`}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col justify-between space-y-6 py-2">
          <div className="space-y-4">
            <p className="text-xs font-medium tracking-wide text-zinc-500">
              {brand.agencyName} · {brand.cityRegion}
            </p>
            <h1
              className={`text-3xl md:text-4xl font-semibold text-zinc-950 tracking-tight text-balance ${
                brand.fontStyle === 'editorial-serif' ? 'font-editorial' : ''
              }`}
            >
              Meet {brand.agentName}, {brand.agentTitle}.
            </h1>
            <p className="text-base text-zinc-700 leading-relaxed">{brand.agentBio}</p>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Unlike high-volume teams that hand your listing off to junior coordinators after the agreement is signed, {brand.agentName} personally leads every pricing session, staging walkthrough, and offer negotiation from initial consultation through closing day.
            </p>
          </div>

          <div className="pt-6 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-zinc-500 space-y-0.5">
              <p className="font-semibold text-zinc-900">{brand.licenseNumber}</p>
              <p>{brand.officeAddress}</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('sell')}
              style={{ backgroundColor: brand.accentColor }}
              className="px-5 py-2.5 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
            >
              Schedule a Listing Consultation
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-zinc-200 pt-12">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-zinc-950">Independent Agility</h2>
          <p className="text-sm text-zinc-600 leading-relaxed">
            Lean operational structure means marketing capital goes straight into editorial photography, targeted neighborhood outreach, and staging prep—never franchise royalties.
          </p>
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-zinc-950">Transparent Net Modeling</h2>
          <p className="text-sm text-zinc-600 leading-relaxed">
            Every seller consultation includes a line-by-line net proceeds worksheet showing realistic closing scenarios before you ever commit to a listing date.
          </p>
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-zinc-950">Unified Brand Presentation</h2>
          <p className="text-sm text-zinc-600 leading-relaxed">
            From print neighborhood postcards to MLS galleries and Instagram launch stories, every touchpoint is crafted to make your home look unmistakable.
          </p>
        </div>
      </div>
    </section>
  );
}
