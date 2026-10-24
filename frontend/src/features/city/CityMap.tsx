import React from 'react';
import {
  GraduationCap,
  Briefcase,
  Home,
  Landmark,
  ShoppingBag,
  Rocket,
  Users,
  ArrowUpRight,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { DISTRICTS, COURSES, JOBS, HOUSINGS } from '../../data/mockData';
import { useGameStore } from '../../stores/useGameStore';
import type { DistrictId } from '../../types/game';
import { ViewHeader } from '../../components/ui/ViewHeader';
import { Panel } from '../../components/ui/Panel';
import { Badge } from '../../components/ui/Badge';
import { IconChip } from '../../components/ui/IconChip';
import { formatNumber } from '../../lib/format';

const ICON_MAP = {
  GraduationCap,
  Briefcase,
  Home,
  Landmark,
  ShoppingBag,
  Rocket,
  Users,
};

export const CityMap: React.FC = () => {
  const { selectDistrict, citizen, startupProjects, guilds, hackathons } = useGameStore();

  const housing = HOUSINGS.find((h) => h.id === citizen.currentHousingId);
  const availableCourses = COURSES.filter((c) => !citizen.completedCourses.includes(c.id)).length;
  const openJobs = JOBS.filter((j) => j.id !== citizen.currentJobId).length;
  const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

  const getDistrictLiveMeta = (id: DistrictId) => {
    switch (id) {
      case 'campus':
        return {
          label: availableCourses
            ? plural(availableCourses, 'formation disponible', 'formations disponibles')
            : 'Toutes les formations validées',
          active: availableCourses > 0,
          tag: 'Éducation',
        };
      case 'business':
        return {
          label: citizen.currentJobId
            ? 'Emploi actif en cours'
            : plural(openJobs, "offre d'emploi ouverte", "offres d'emploi ouvertes"),
          active: !!citizen.currentJobId,
          tag: citizen.currentJobId ? 'En poste' : 'Recrutement',
        };
      case 'residential':
        return { label: `Logement actuel : ${housing?.title ?? 'aucun'}`, active: !!housing, tag: 'Foyer' };
      case 'finance':
        return {
          label: `Épargne : ${formatNumber(citizen.savings)} MGA`,
          active: true,
          tag: 'Trésorerie',
        };
      case 'market':
        return { label: 'Équipement PC & Ravitaillement', active: true, tag: 'Commerce' };
      case 'startup':
        return {
          label: startupProjects.length > 0 ? `${startupProjects.length} startup active` : 'Incubateur & Amorçage',
          active: true,
          tag: 'Incubateur',
        };
      case 'cityhub':
        return {
          label: `${guilds.length} guildes & ${hackathons.length} hackathons`,
          active: true,
          tag: 'Communauté',
        };
    }
  };


  return (
    <div className="space-y-5 sm:space-y-6">
      <ViewHeader
        headingId="map-title"
        tone="brand"
        badgeIcon={<MapPin />}
        badgeLabel="Carte urbaine interactive 2D"
        meta="7 districts connectés"
        title="Explore la cité de ton avenir"
        description="Navigue entre les quartiers pour te former, postuler, louer un logement ou gérer ton budget. Chaque quartier impacte directement tes statistiques de citoyen."
        aside={
          <div className="panel-inset px-4 py-2.5">
            <span className="block text-2xs tracking-wider text-mist-500 uppercase">Position actuelle</span>
            <span className="mt-1 flex items-center justify-end gap-2 text-sm font-bold text-brand-200">
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-gain-400 shadow-[0_0_8px] shadow-gain-400/60 animate-pulse-soft"
              />
              Résidentiel &middot; {housing?.title ?? 'Sans logement'}
            </span>
          </div>
        }
      />

      {/* Visual 2D City Network Schematic (DES-010) */}
      <Panel className="relative overflow-hidden p-4 sm:p-6 bg-night-900/90 border border-brand-500/20 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-3 border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-brand-400 animate-pulse" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Plan Schématique des Districts de Youth City</h3>
          </div>
          <span className="text-3xs text-mist-400 hidden sm:inline">Clique sur un quartier pour y accéder instantanément</span>
        </div>

        <div className="relative w-full aspect-21/9 min-h-[220px] sm:min-h-[260px] rounded-2xl bg-night-950/80 border border-white/[0.06] overflow-hidden flex items-center justify-center p-2">
          {/* Subtle Grid / Roads Background */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" viewBox="0 0 800 320" fill="none">
            <path d="M 160 90 L 400 160 L 640 90" stroke="url(#cyan-glow)" strokeWidth="2" strokeDasharray="4 4" />
            <path d="M 160 230 L 400 160 L 640 230" stroke="url(#purple-glow)" strokeWidth="2" strokeDasharray="4 4" />
            <path d="M 160 90 L 160 230" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            <path d="M 640 90 L 640 230" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            <path d="M 400 60 L 400 260" stroke="rgba(124,58,237,0.3)" strokeWidth="1.5" strokeDasharray="2 4" />
            
            <circle cx="400" cy="160" r="90" stroke="rgba(124,58,237,0.2)" strokeWidth="1" strokeDasharray="6 6" />
            <circle cx="400" cy="160" r="140" stroke="rgba(99,102,241,0.1)" strokeWidth="1" />

            <defs>
              <linearGradient id="cyan-glow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="purple-glow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.8" />
              </linearGradient>
            </defs>
          </svg>

          {/* Interactive District Nodes */}
          <div className="relative z-10 w-full h-full max-w-4xl mx-auto grid grid-cols-3 grid-rows-3 gap-2 items-center place-items-center py-2">
            {/* Top Left: Campus */}
            <button
              type="button"
              onClick={() => selectDistrict('campus')}
              className="group flex flex-col items-center gap-1.5 p-2 rounded-xl transition-transform hover:scale-110 cursor-pointer"
            >
              <div className="size-11 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-300 grid place-items-center shadow-lg shadow-blue-500/20 group-hover:bg-blue-500/30">
                <GraduationCap className="size-5" />
              </div>
              <span className="text-[11px] font-bold text-white group-hover:text-blue-300">Campus District</span>
            </button>

            {/* Top Center: Résidentiel (Position courante) */}
            <button
              type="button"
              onClick={() => selectDistrict('residential')}
              className="group flex flex-col items-center gap-1.5 p-2 rounded-xl transition-transform hover:scale-110 cursor-pointer -translate-y-1"
            >
              <div className="relative size-12 rounded-xl bg-pink-500/20 border-2 border-pink-400/60 text-pink-300 grid place-items-center shadow-lg shadow-pink-500/25 group-hover:bg-pink-500/30">
                <Home className="size-5" />
                <span className="absolute -top-1 -right-1 size-3 rounded-full bg-gain-400 border-2 border-night-950 animate-ping" />
                <span className="absolute -top-1 -right-1 size-3 rounded-full bg-gain-400 border-2 border-night-950" />
              </div>
              <span className="text-[11px] font-bold text-white group-hover:text-pink-300 flex items-center gap-1">
                Résidentiel <span className="text-[9px] text-gain-400 font-semibold">(Actuel)</span>
              </span>
            </button>

            {/* Top Right: Business */}
            <button
              type="button"
              onClick={() => selectDistrict('business')}
              className="group flex flex-col items-center gap-1.5 p-2 rounded-xl transition-transform hover:scale-110 cursor-pointer"
            >
              <div className="size-11 rounded-xl bg-purple-500/20 border border-purple-400/40 text-purple-300 grid place-items-center shadow-lg shadow-purple-500/20 group-hover:bg-purple-500/30">
                <Briefcase className="size-5" />
              </div>
              <span className="text-[11px] font-bold text-white group-hover:text-purple-300">Business District</span>
            </button>

            {/* Mid Left: Market */}
            <button
              type="button"
              onClick={() => selectDistrict('market')}
              className="group flex flex-col items-center gap-1.5 p-2 rounded-xl transition-transform hover:scale-110 cursor-pointer"
            >
              <div className="size-11 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 grid place-items-center shadow-lg shadow-amber-500/20 group-hover:bg-amber-500/30">
                <ShoppingBag className="size-5" />
              </div>
              <span className="text-[11px] font-bold text-white group-hover:text-amber-300">Market District</span>
            </button>

            {/* Center: City Hub */}
            <button
              type="button"
              onClick={() => selectDistrict('cityhub')}
              className="group flex flex-col items-center gap-1.5 p-2.5 rounded-2xl transition-transform hover:scale-115 cursor-pointer ring-2 ring-brand-500/30 bg-surface-900/60"
            >
              <div className="size-13 rounded-2xl bg-brand-500/30 border-2 border-brand-400/70 text-brand-200 grid place-items-center shadow-xl shadow-brand-500/30 group-hover:bg-brand-500/40">
                <Users className="size-6" />
              </div>
              <span className="text-xs font-extrabold text-white group-hover:text-brand-300 tracking-wide">
                City Hub (Agora)
              </span>
            </button>

            {/* Mid Right: Startup Incubator */}
            <button
              type="button"
              onClick={() => selectDistrict('startup')}
              className="group flex flex-col items-center gap-1.5 p-2 rounded-xl transition-transform hover:scale-110 cursor-pointer"
            >
              <div className="size-11 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-300 grid place-items-center shadow-lg shadow-teal-500/20 group-hover:bg-teal-500/30">
                <Rocket className="size-5" />
              </div>
              <span className="text-[11px] font-bold text-white group-hover:text-teal-300">Startup District</span>
            </button>

            {/* Bottom: Finance (centered at bottom) */}
            <div className="col-start-2 flex justify-center">
              <button
                type="button"
                onClick={() => selectDistrict('finance')}
                className="group flex flex-col items-center gap-1.5 p-2 rounded-xl transition-transform hover:scale-110 cursor-pointer translate-y-1"
              >
                <div className="size-11 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 grid place-items-center shadow-lg shadow-emerald-500/20 group-hover:bg-emerald-500/30">
                  <Landmark className="size-5" />
                </div>
                <span className="text-[11px] font-bold text-white group-hover:text-emerald-300">Finance District</span>
              </button>
            </div>
          </div>
        </div>
      </Panel>

      <ul className="grid grid-cols-12 gap-4 sm:gap-5">
        {DISTRICTS.map((district) => {
          const IconComponent = ICON_MAP[district.icon as keyof typeof ICON_MAP] || Sparkles;
          const meta = getDistrictLiveMeta(district.id);

          return (
            <li key={district.id} className={district.gridArea}>
              <button
                type="button"
                onClick={() => selectDistrict(district.id)}
                className="panel group relative flex h-full w-full flex-col justify-between overflow-hidden p-5 text-left transition-[transform,border-color,box-shadow] duration-300 ease-soft hover:-translate-y-1.5 hover:border-brand-400/50 hover:shadow-panel-lg focus-visible:-translate-y-1.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-400"
              >
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-0 bg-linear-to-br ${district.gradient} opacity-20 transition-opacity duration-300 group-hover:opacity-40`}
                />

                <div className="relative">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <span
                      aria-hidden="true"
                      className={`grid size-12 shrink-0 place-items-center rounded-2xl border shadow-raise transition-transform duration-300 ease-spring group-hover:scale-105 ${district.accentBg}`}
                    >
                      <IconComponent className="size-6" />
                    </span>
                    <Badge tone="neutral" className="group-hover:border-brand-400/40">
                      {meta.tag}
                    </Badge>
                  </div>

                  <h3 className="flex items-center gap-1.5 text-base font-bold text-white transition-colors group-hover:text-brand-200 sm:text-lg">
                    {district.name}
                    <ArrowUpRight
                      className="size-4 -translate-x-1 text-brand-400 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </h3>
                  <p className="mt-1 mb-2 text-xs font-medium text-brand-400">{district.subtitle}</p>
                  <p className="line-clamp-2 text-xs leading-relaxed text-mist-400">{district.description}</p>
                </div>

                <div className="relative mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] pt-3.5">
                  <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-mist-300">
                    <span
                      aria-hidden="true"
                      className={`size-2 shrink-0 rounded-full ${
                        meta.active
                          ? 'bg-gain-400 shadow-[0_0_8px] shadow-gain-400/50'
                          : 'border border-mist-500 bg-transparent'
                      }`}
                    />
                    <span className="line-clamp-1">{meta.label}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-brand-400 transition-colors group-hover:text-brand-300 ml-auto">
                    Accéder
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <Panel tone="gain" className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex min-w-0 items-center gap-3">
          <IconChip tone="gain">
            <Sparkles />
          </IconChip>
          <p className="text-xs leading-relaxed text-mist-300">
            Tous les quartiers de <span className="font-bold text-white">YOUTH CITY</span> sont désormais interconnectés : Campus, Business, Startup District, City Hub, Market, Finance et Résidentiel.
          </p>
        </div>
        <Badge tone="gain">Cité 100% Active</Badge>
      </Panel>
    </div>
  );
};
