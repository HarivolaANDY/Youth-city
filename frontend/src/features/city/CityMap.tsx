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
  const { selectDistrict, citizen, startupProjects } = useGameStore();

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
        return { label: 'Hackathons & Guildes V2', active: false, tag: 'Communauté' };
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

                <div className="relative mt-5 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-3.5">
                  <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-mist-300">
                    <span
                      aria-hidden="true"
                      className={`size-2 shrink-0 rounded-full ${
                        meta.active
                          ? 'bg-gain-400 shadow-[0_0_8px] shadow-gain-400/50'
                          : 'border border-mist-500 bg-transparent'
                      }`}
                    />
                    <span className="truncate">{meta.label}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-brand-400 transition-colors group-hover:text-brand-300">
                    Accéder
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <Panel tone="neutral" className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex min-w-0 items-center gap-3">
          <IconChip tone="brand">
            <Sparkles />
          </IconChip>
          <p className="text-xs leading-relaxed text-mist-400">
            Le district <span className="font-bold text-mist-200">City Hub</span> (Guildes & Hackathons multijoueurs) arrive dans le prochain module du jeu.
          </p>
        </div>
        <Badge tone="warn">Bientôt disponible</Badge>
      </Panel>
    </div>
  );
};
