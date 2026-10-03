import React from 'react';
import { Award, CheckCircle2, ShieldCheck, Share2, QrCode, FileText, Sparkles } from 'lucide-react';
import { useGameStore } from '../../stores/useGameStore';
import { ViewHeader } from '../../components/ui/ViewHeader';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { IconChip } from '../../components/ui/IconChip';
import { MeterRow } from '../../components/ui/MeterRow';

export const CareerPassportView: React.FC = () => {
  const { citizen } = useGameStore();

  const stats = [
    { label: 'Projets livrés', value: citizen.completedProjects, tone: 'text-white' },
    { label: 'Challenges validés', value: citizen.completedChallenges, tone: 'text-white' },
    { label: 'Certifications officielles', value: citizen.certifications.length, tone: 'text-gain-300' },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <ViewHeader
        headingId="passport-title"
        tone="brand"
        badgeIcon={<ShieldCheck />}
        badgeLabel="Career Passport vérifié"
        meta="Identifiant citoyen : #YC-84920"
        title="Passeport de compétences & portfolio par la preuve"
        description="Les compétences listées ici ne sont pas de simples déclarations : elles résultent de formations, de projets réels et d'évaluations validées dans la simulation Youth City."
        aside={
          <Button
            variant="primary"
            size="lg"
            onClick={() => alert('Lien public de ton portfolio copié dans le presse-papiers !')}
          >
            <Share2 className="size-4" aria-hidden="true" />
            <span>Partager mon passport</span>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Panel
          as="section"
          aria-labelledby="passport-identity"
          tone="brand"
          className="flex flex-col justify-between p-5 sm:p-6 lg:col-span-4"
        >
          <div className="space-y-5">
            <div className="flex items-center gap-3 border-b border-white/[0.07] pb-4">
              <IconChip tone="brand" size="sm">
                <ShieldCheck />
              </IconChip>
              <span className="font-display text-2xs font-black tracking-[0.16em] text-brand-300 uppercase">
                République de Youth City
              </span>
            </div>

            <div className="flex items-center gap-4">
              <Avatar name={citizen.name} size="lg" />
              <div className="min-w-0">
                <h3 id="passport-identity" className="truncate text-xl font-black text-white">
                  {citizen.name}
                </h3>
                <p className="text-xs font-semibold text-brand-300">{citizen.title}</p>
                <span className="mt-1 block text-2xs text-mist-500">Rang : niveau {citizen.level}</span>
              </div>
            </div>

            <dl className="space-y-2.5 border-t border-white/[0.07] pt-4 text-xs">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-baseline justify-between gap-3">
                  <dt className="text-mist-500">{stat.label}</dt>
                  <dd className={`metric font-bold ${stat.tone}`}>{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="panel-inset mt-6 flex items-center justify-between gap-3 p-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <QrCode className="size-8 shrink-0 text-brand-400" aria-hidden="true" />
              <div className="min-w-0">
                <span className="block text-2xs tracking-wider text-mist-500 uppercase">Sceau cryptographique</span>
                <span className="metric mt-0.5 block text-2xs font-bold text-mist-100">Validé — par la preuve</span>
              </div>
            </div>
            <CheckCircle2 className="size-5 shrink-0 text-gain-400" aria-hidden="true" />
          </div>
        </Panel>

        <div className="space-y-5 lg:col-span-8">
          <Panel as="section" aria-labelledby="aptitudes-title" className="p-5 sm:p-6">
            <h3 id="aptitudes-title" className="mb-4 flex items-center gap-2.5 text-base font-bold text-white">
              <IconChip tone="brand" size="sm">
                <Award />
              </IconChip>
              Aptitudes &amp; compétences démontrées
            </h3>

            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Object.entries(citizen.skills).map(([skill, val]) => (
                <li key={skill} className="panel-inset p-3">
                  <MeterRow label={skill} value={val} barSize="sm" labelClassName="capitalize" />
                </li>
              ))}
            </ul>
          </Panel>

          <Panel as="section" aria-labelledby="certifications-title" className="p-5 sm:p-6">
            <h3 id="certifications-title" className="mb-4 flex items-center gap-2.5 text-base font-bold text-white">
              <IconChip tone="gain" size="sm">
                <FileText />
              </IconChip>
              Certifications &amp; titres obtenus
            </h3>

            {citizen.certifications.length > 0 ? (
              <ul className="space-y-2.5">
                {citizen.certifications.map((cert, idx) => (
                  <li
                    key={idx}
                    className="panel-inset flex flex-wrap items-center justify-between gap-3 p-3.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <IconChip tone="gain" size="sm">
                        <CheckCircle2 />
                      </IconChip>
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-white">{cert}</span>
                        <span className="block text-2xs text-mist-500">
                          Délivré par le Campus District &bull; Vérifiable
                        </span>
                      </div>
                    </div>
                    <Badge tone="gain">Actif</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="panel-inset flex flex-col items-center gap-3 p-8 text-center">
                <IconChip tone="neutral" size="md" className="[&_svg]:size-5">
                  <Sparkles />
                </IconChip>
                <p className="max-w-sm text-xs leading-relaxed text-mist-500">
                  Aucune certification validée pour le moment. Suis une formation au Campus District pour en débloquer
                  une&nbsp;!
                </p>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
};
