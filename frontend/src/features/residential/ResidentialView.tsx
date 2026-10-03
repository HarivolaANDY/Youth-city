import React from 'react';
import { Home, Zap, Moon, CheckCircle2, BedDouble } from 'lucide-react';
import { HOUSINGS } from '../../data/mockData';
import { useGameStore } from '../../stores/useGameStore';
import { ViewHeader } from '../../components/ui/ViewHeader';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { IconChip } from '../../components/ui/IconChip';
import { formatNumber } from '../../lib/format';

export const ResidentialView: React.FC = () => {
  const { citizen, changeHousing, restAndSleep } = useGameStore();

  return (
    <div className="space-y-5 sm:space-y-6">
      <ViewHeader
        headingId="residential-title"
        tone="iris"
        badgeIcon={<Home />}
        badgeLabel="Residential District"
        meta="Cadre de vie & repos"
        title="Choisis ton logement & préserve ton énergie"
        description="Ton logement détermine la vitesse à laquelle ton énergie se régénère chaque nuit. Attention toutefois : un logement trop cher pèse lourdement sur tes charges mensuelles !"
        aside={
          <Button variant="iris" size="lg" onClick={() => restAndSleep()} className="shrink-0">
            <Moon className="size-4" aria-hidden="true" />
            <span>Faire une sieste / Dormir</span>
          </Button>
        }
      />

      <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {HOUSINGS.map((housing) => {
          const isCurrent = citizen.currentHousingId === housing.id;
          const affordable = citizen.money >= housing.rentMonthly;

          return (
            <li key={housing.id} className="h-full">
              <Panel
                as="article"
                aria-labelledby={`housing-${housing.id}`}
                tone={isCurrent ? 'iris' : 'neutral'}
                className={`flex h-full flex-col p-5 transition-[transform,border-color] duration-300 ease-soft hover:-translate-y-1 ${
                  isCurrent ? 'shadow-iris' : 'hover:border-iris-400/40'
                }`}
              >
                <div>
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <span
                      role="img"
                      aria-label={`${housing.comfortStars} étoiles sur 5`}
                      className="text-sm text-warn-300"
                    >
                      {'★'.repeat(housing.comfortStars)}
                      <span className="text-mist-500/40">{'★'.repeat(5 - housing.comfortStars)}</span>
                    </span>
                    {isCurrent && (
                      <Badge tone="iris" icon={<CheckCircle2 />}>
                        Foyer actuel
                      </Badge>
                    )}
                  </div>

                  <IconChip tone="iris" className="mb-3">
                    <BedDouble />
                  </IconChip>

                  <h3 id={`housing-${housing.id}`} className="mb-1 text-base font-bold text-white">
                    {housing.title}
                  </h3>
                  <p className="metric mb-3 text-xs font-bold text-gain-400">
                    {formatNumber(housing.rentMonthly)} MGA / mois
                  </p>
                  <p className="mb-4 text-xs leading-relaxed text-mist-400">{housing.description}</p>

                  <ul className="mb-5 space-y-1.5 text-xs text-mist-300">
                    {housing.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-iris-400" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-auto">
                  <div className="mb-4 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-3.5 text-xs">
                    <span className="flex items-center gap-1 text-mist-500">
                      <Zap className="size-3.5 text-warn-400" aria-hidden="true" />
                      Récupération
                    </span>
                    <span className="metric font-bold text-warn-300">
                      +{housing.energyRecoveryPerNight}% / nuit
                    </span>
                  </div>

                  {!isCurrent && !affordable && (
                    <p className="mb-2 text-2xs text-risk-300">
                      Loyer supérieur à ta trésorerie actuelle : travaille ou économise avant d&rsquo;emménager.
                    </p>
                  )}

                  <Button
                    variant={isCurrent ? 'secondary' : affordable ? 'iris' : 'secondary'}
                    block
                    disabled={isCurrent}
                    onClick={() => changeHousing(housing.id)}
                  >
                    <Home className="size-4" aria-hidden="true" />
                    <span>{isCurrent ? 'Tu habites ici' : 'Emménager ici'}</span>
                  </Button>
                </div>
              </Panel>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
