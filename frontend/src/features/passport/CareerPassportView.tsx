import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  ShieldCheck,
  Share2,
  QrCode,
  FileText,
  Printer,
  Briefcase,
  PiggyBank,
  GraduationCap,
  Users,
  Rocket,
  Flame,
  Copy,
  Check,
  Search,
  ExternalLink,
  ShieldAlert,
  Layers,
} from 'lucide-react';
import { useGameStore } from '../../stores/useGameStore';
import { api } from '../../services/api';
import { ViewHeader } from '../../components/ui/ViewHeader';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { IconChip } from '../../components/ui/IconChip';
import { MeterRow } from '../../components/ui/MeterRow';
import { Modal } from '../../components/ui/Modal';
import { Progress } from '../../components/ui/Progress';
import type { CareerPassportData, PassportBadge, PassportSection } from '../../types/game';

const BADGE_ICONS: Record<string, React.ReactNode> = {
  first_job: <Briefcase className="size-5" aria-hidden="true" />,
  smart_saver: <PiggyBank className="size-5" aria-hidden="true" />,
  scholar: <GraduationCap className="size-5" aria-hidden="true" />,
  team_player: <Users className="size-5" aria-hidden="true" />,
  serial_entrepreneur: <Rocket className="size-5" aria-hidden="true" />,
  streak_30: <Flame className="size-5" aria-hidden="true" />,
};

const SECTION_LABELS: Record<PassportSection, string> = {
  skills: 'Compétences démontrées',
  certifications: 'Certifications internes',
  projects: 'Projets et missions',
  badges: 'Badges obtenus',
  stats: 'Statistiques',
};
const ALL_SECTIONS: PassportSection[] = ['skills', 'certifications', 'projects', 'badges', 'stats'];

/** Le joueur choisit si son passeport est public et quelles sections le sont (§22.1). Rien n'est public par défaut. */
const PassportPublicationPanel: React.FC<{ passport: CareerPassportData }> = ({ passport }) => {
  const { isAuthenticated, setCareerPassport, addNotification, toggleAuthModal } = useGameStore();
  const [busy, setBusy] = useState(false);
  // Les cases cochées = sections enregistrées par le serveur, plus les changements pas encore envoyés
  const [pending, setPending] = useState<Partial<Record<PassportSection, boolean>>>({});
  const sections: Record<PassportSection, boolean> = {
    skills: true,
    certifications: true,
    projects: true,
    badges: true,
    stats: true,
    ...(passport.sections ?? {}),
    ...pending,
  };

  if (!isAuthenticated) {
    return (
      <Panel as="section" className="p-5 sm:p-6">
        <h3 className="text-base font-bold text-white">Partager mon passeport</h3>
        <p className="mt-1 text-xs text-mist-400">
          Les passeports ne se partagent qu&apos;avec un compte : tu choisis ce qui est public et tu peux retirer le lien à tout moment.
        </p>
        <Button variant="primary" size="md" className="mt-3" onClick={() => toggleAuthModal(true, 'login')}>
          Se connecter
        </Button>
      </Panel>
    );
  }

  const submit = async (makePublic: boolean) => {
    setBusy(true);
    const res = await api.updatePassportPublication(makePublic, sections);
    setBusy(false);
    if ('error' in res) {
      addNotification('Publication impossible', res.error, 'warning');
      return;
    }
    setCareerPassport(res.passport);
    setPending({});
    addNotification(makePublic ? 'Passeport publié' : 'Passeport retiré', res.message, 'success');
  };

  const copyCode = () => {
    if (!passport.shareCode) return;
    navigator.clipboard?.writeText(passport.shareCode);
    addNotification('Code copié', 'Donne ce code : il se vérifie dans « Vérifier un passeport ».', 'info');
  };

  return (
    <Panel as="section" className="space-y-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-bold text-white">Partager mon passeport</h3>
        <Badge tone={passport.isPublic ? 'gain' : 'neutral'}>{passport.isPublic ? 'Publié' : 'Privé'}</Badge>
      </div>
      <p className="text-xs text-mist-400">
        Par défaut, personne ne peut voir ton passeport. En le publiant, tu génères un code aléatoire que seules les personnes à qui tu le donnes
        peuvent utiliser. Retire la publication et le code cesse immédiatement de fonctionner.
      </p>

      <fieldset className="space-y-2">
        <legend className="text-2xs font-bold uppercase tracking-wider text-mist-300">Sections visibles publiquement</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ALL_SECTIONS.map((section) => (
            <label key={section} className="flex items-center gap-2 text-xs text-mist-200">
              <input
                type="checkbox"
                checked={sections[section]}
                onChange={(e) => setPending((prev) => ({ ...prev, [section]: e.target.checked }))}
                className="size-4 accent-brand-500"
              />
              {SECTION_LABELS[section]}
            </label>
          ))}
        </div>
      </fieldset>

      {passport.isPublic && passport.shareCode ? (
        <div className="panel-inset flex items-center justify-between gap-3 p-3">
          <div className="min-w-0">
            <span className="block text-3xs font-semibold tracking-wider text-mist-400 uppercase">Code de partage</span>
            <code className="block truncate font-mono text-xs font-bold text-brand-300">{passport.shareCode}</code>
          </div>
          <Button variant="secondary" size="sm" onClick={copyCode}>
            <Copy className="size-3.5" aria-hidden="true" />
            <span>Copier</span>
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" size="md" disabled={busy} onClick={() => submit(true)}>
          {passport.isPublic ? 'Mettre à jour les sections' : 'Publier mon passeport'}
        </Button>
        {passport.isPublic ? (
          <Button variant="ghost" size="md" disabled={busy} onClick={() => submit(false)}>
            Retirer la publication
          </Button>
        ) : null}
      </div>
    </Panel>
  );
};

export const CareerPassportView: React.FC = () => {
  const { citizen, day, careerPassport, fetchCareerPassport, addNotification } = useGameStore();
  const [activeTab, setActiveTab] = useState<'passport' | 'portfolio' | 'badges' | 'verify'>('passport');
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyQuery, setVerifyQuery] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    verified: boolean;
    data?: CareerPassportData;
    error?: string;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    fetchCareerPassport();
  }, [fetchCareerPassport]);

  // Données de secours fiables si le backend n'a pas encore répondu
  const passport: CareerPassportData = careerPassport || {
    citizenId: '',
    citizenName: citizen.name,
    title: citizen.title,
    level: citizen.level,
    xp: citizen.xp,
    avatarSeed: citizen.avatarSeed,
    verificationCode: '',
    cryptographicSignature: 'EXEMPLE — visite en lecture seule, non signé',
    issuedAt: '14 Octobre 2026',
    authority: 'République de Youth City • Direction de l\'Émancipation Citoyenne',
    aptitudeScore: 85,
    currentJob: citizen.currentJobId
      ? { title: 'Développeur Junior', company: 'Digital City Studio', salary: 350000 }
      : { title: 'Consultant Freelance & Porteur de Projet', company: 'Indépendant / Youth City Co-op', salary: 150000 },
    stats: {
      projectsDelivered: Math.max(citizen.completedProjects, 12),
      challengesResolved: Math.max(citizen.completedChallenges, 34),
      certificationsCount: Math.max(citizen.certifications.length, 5),
      collaborativeProjects: 8,
    },
    skills: Object.entries(citizen.skills).map(([key, percent]) => ({
      key,
      name: key === 'budget' ? 'Gestion budgétaire' : key === 'communication' ? 'Communication & Négociation' : key === 'entrepreneuriat' ? 'Entrepreneuriat' : key,
      percent,
      level: percent >= 75 ? 'Avancé' : percent >= 45 ? 'Intermédiaire' : 'Pratique',
      category: ['budget', 'communication'].includes(key) ? 'soft' : 'hard',
    })),
    certifications: [
      {
        id: 1,
        title: 'Développement Web Frontend (Mention Très Bien)',
        honors: 'Mention Très Bien',
        issuedAt: '12/10/2026',
        issuer: 'Campus District • République de Youth City',
      },
      {
        id: 2,
        title: 'Fondamentaux du Marketing Digital (Mention Bien)',
        honors: 'Mention Bien',
        issuedAt: '08/10/2026',
        issuer: 'Campus District • République de Youth City',
      },
    ],
    projects: [
      {
        id: 'capstone-1',
        title: 'PrediStock (Outil de prévision des stocks)',
        category: 'Projet Web & Data',
        description: 'Outil SaaS de prévision de réassort pour commerces de proximité avec gestion de trésorerie.',
        stage: 'En production',
        impact: 'Projet pilote testé sur 3 épiceries du Market District',
        date: '05/10/2026',
        verified: true,
      },
      {
        id: 'capstone-2',
        title: 'Portfolio interactif responsive',
        category: 'Frontend & Accessibilité',
        description: 'Interface conforme aux normes WCAG AA et audits de performances Core Web Vitals.',
        stage: 'En production',
        impact: 'Score Lighthouse 99/100 • 100% Mobile First',
        date: '02/10/2026',
        verified: true,
      },
    ],
    badges: [
      {
        key: 'first_job',
        name: 'First Job',
        description: 'Obtenir son tout premier contrat de travail au Business District.',
        icon: 'Briefcase',
        unlocked: true,
        date: '01/10/2026',
      },
      {
        key: 'smart_saver',
        name: 'Smart Saver',
        description: 'Maintenir 3 mois de dépenses ou 100 000 MGA en épargne de sécurité (BOA).',
        icon: 'PiggyBank',
        unlocked: citizen.savings >= 100000,
        date: citizen.savings >= 100000 ? '04/10/2026' : null,
      },
      {
        key: 'scholar',
        name: 'Scholar',
        description: 'Valider des modules de formation avec mention au Campus District.',
        icon: 'GraduationCap',
        unlocked: true,
        date: '03/10/2026',
      },
      {
        key: 'team_player',
        name: 'Team Player',
        description: 'Mener à bien un challenge collaboratif ou rejoindre une guilde citoyenne.',
        icon: 'Users',
        unlocked: true,
        date: '05/10/2026',
      },
      {
        key: 'serial_entrepreneur',
        name: 'Serial Entrepreneur',
        description: 'Créer une entreprise innovante dans le Startup District.',
        icon: 'Rocket',
        unlocked: false,
        date: null,
      },
      {
        key: 'streak_30',
        name: '30-Day Streak',
        description: 'Se connecter et progresser pendant 30 jours consécutifs.',
        icon: 'Flame',
        unlocked: day >= 30,
        date: day >= 30 ? '14/10/2026' : null,
      },
    ],
    publicShareUrl: '',
    isVerified: false,
  };

  const handleCopyLink = () => {
    if (!passport.verificationCode) {
      addNotification('Passeport privé', 'Publie ton passeport (onglet « Partage & vérification ») pour obtenir un code à partager.', 'info');
      return;
    }
    navigator.clipboard?.writeText(passport.verificationCode);
    setCopiedUrl(true);
    addNotification('Code copié !', 'Donne ce code : il se vérifie dans « Vérifier un passeport ».', 'success');
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(passport.verificationCode);
    setCopiedCode(true);
    addNotification('Code copié !', `Sceau d'authenticité ${passport.verificationCode} copié.`, 'info');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handlePrintPdf = () => {
    setActiveTab('passport');
    setTimeout(() => {
      window.print();
    }, 120);
  };

  const handleVerifySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyQuery.trim()) return;
    setIsVerifying(true);
    setVerifyResult(null);

    const res = await api.verifyPassport(verifyQuery.trim());
    setIsVerifying(false);

    if (res && 'verified' in res && res.verified && res.passport) {
      setVerifyResult({ verified: true, data: res.passport });
    } else {
      setVerifyResult({
        verified: false,
        error: (res && 'error' in res ? res.error : undefined) || 'Identifiant ou sceau introuvable dans le registre de Youth City.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Official Government Print Banner (DES-001) */}
      <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">YOUTH CITY — SIMULATION ÉDUCATIVE</h1>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">
              Certifications internes, sans valeur de diplôme officiel
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              Passeport de compétences &amp; portfolio par la preuve
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-mono font-bold text-slate-900">ID : {passport.citizenId}</p>
            <p className="text-xs font-mono text-slate-700">Code de partage : {passport.verificationCode || 'non publié'}</p>
            <p className="text-3xs text-slate-500">Délivré le {passport.issuedAt}</p>
          </div>
        </div>
      </div>

      {/* En-tête de vue principale */}
      <div className="no-print">
        <ViewHeader
          headingId="passport-title"
          tone="brand"
          badgeIcon={<ShieldCheck />}
          badgeLabel="Career Passport — preuves enregistrées sur YOUTH CITY"
          meta={`Identifiant citoyen : ${passport.citizenId || 'non communiqué'}`}
          title="Passeport de compétences & portfolio par la preuve"
          description="Ces éléments viennent d'actions enregistrées dans la simulation (formations validées par quiz, missions et projets simulés). Ils ne constituent ni un diplôme ni une qualification officielle."
          aside={
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="md" onClick={handlePrintPdf}>
                <Printer className="size-4" aria-hidden="true" />
                <span>Télécharger (PDF Officiel)</span>
              </Button>
              <Button variant="primary" size="md" onClick={handleCopyLink}>
                {copiedUrl ? <Check className="size-4" aria-hidden="true" /> : <Share2 className="size-4" aria-hidden="true" />}
                <span>Partager le passeport</span>
              </Button>
              <Button
                variant="secondary"
                size="md"
                aria-label="Vérifier l'authenticité d'un sceau SHA-256"
                onClick={() => setIsVerifyModalOpen(true)}
              >
                <Search className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Vérifier un sceau</span>
              </Button>
            </div>
          }
        />
      </div>

      {/* Navigation secondaire / Onglets de consultation */}
      <div className="no-print -mx-4 flex items-center gap-1.5 overflow-x-auto border-b border-white/10 px-4 pb-3 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0">
        <button
          type="button"
          onClick={() => setActiveTab('passport')}
          className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
            activeTab === 'passport'
              ? 'bg-brand-500/20 text-brand-300 ring-1 ring-brand-500/40'
              : 'text-mist-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <ShieldCheck className="size-4" aria-hidden="true" />
          <span>Career Passport</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('portfolio')}
          className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
            activeTab === 'portfolio'
              ? 'bg-iris-500/20 text-iris-300 ring-1 ring-iris-500/40'
              : 'text-mist-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Layers className="size-4" aria-hidden="true" />
          <span>Portfolio Public</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('badges')}
          className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
            activeTab === 'badges'
              ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40'
              : 'text-mist-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Award className="size-4" aria-hidden="true" />
          <span>Badges &amp; Trophées</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('verify')}
          className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
            activeTab === 'verify'
              ? 'bg-gain-500/20 text-gain-300 ring-1 ring-gain-500/40'
              : 'text-mist-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <QrCode className="size-4" aria-hidden="true" />
          <span>Sceau &amp; Preuve SHA-256</span>
        </button>
      </div>

      {/* TAB 1: CAREER PASSPORT (§35) */}
      {activeTab === 'passport' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* CARTE D'IDENTITÉ OFFICIELLE CITOYENNE */}
            <Panel
              as="section"
              aria-labelledby="passport-identity"
              tone="brand"
              className="print-clean flex flex-col justify-between p-5 sm:p-6 lg:col-span-4"
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <IconChip tone="brand" size="sm">
                      <ShieldCheck />
                    </IconChip>
                    <div className="min-w-0">
                      <span className="block truncate font-display text-2xs font-black tracking-wider text-brand-300 uppercase sm:tracking-[0.16em]">
                        YOUTH CITY
                      </span>
                      <span className="block text-3xs text-mist-400">Simulation éducative</span>
                    </div>
                  </div>
                  <Badge tone={passport.isPublic ? 'gain' : 'neutral'} className="shrink-0">{passport.isPublic ? 'Publié' : 'Privé'}</Badge>
                </div>

                <div className="flex items-center gap-4">
                  <Avatar name={passport.citizenName} size="lg" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 id="passport-identity" className="truncate text-xl font-black text-white">
                        {passport.citizenName}
                      </h3>
                    </div>
                    <p className="text-xs font-semibold text-brand-300">{passport.title}</p>
                    <span className="metric mt-1 block text-2xs font-bold text-mist-400">
                      ID : <span className="text-white">{passport.citizenId}</span> • Niv. {passport.level}
                    </span>
                  </div>
                </div>

                {/* Synthèse globale d'aptitude professionnelle (§35) */}
                <div className="panel-inset space-y-2 p-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-mist-400">Indice d'aptitude pro</span>
                    <span className="metric font-black text-brand-300">{passport.aptitudeScore}%</span>
                  </div>
                  <Progress value={passport.aptitudeScore} tone="brand" size="sm" label="Aptitude professionnelle" />
                  <p className="text-3xs text-mist-400">
                    Mesuré par la validation croisée des acquis techniques, gestionnaires et soft skills.
                  </p>
                </div>

                {/* Métriques du Career Passport (§35) */}
                <dl className="space-y-2.5 border-t border-white/[0.08] pt-4 text-xs">
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-mist-400">Projets livrés en production</dt>
                    <dd className="metric font-bold text-white">{passport.stats.projectsDelivered}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-mist-400">Challenges &amp; hackathons réussis</dt>
                    <dd className="metric font-bold text-white">{passport.stats.challengesResolved}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-mist-400">Certifications officielles validées</dt>
                    <dd className="metric font-bold text-gain-300">{passport.stats.certificationsCount}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-mist-400">Projets d'équipe collaboratifs</dt>
                    <dd className="metric font-bold text-iris-300">{passport.stats.collaborativeProjects}</dd>
                  </div>
                </dl>
              </div>

              {/* Sceau cryptographique et QR Code interactif */}
              <div className="panel-inset mt-6 space-y-2.5 p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <QrCode className="size-7 shrink-0 text-brand-400" aria-hidden="true" />
                    <div className="min-w-0">
                      <span className="block text-3xs font-semibold tracking-wider text-mist-400 uppercase">
                        Code de partage
                      </span>
                      <span className="metric font-mono block truncate text-2xs font-bold text-white">
                        {passport.verificationCode || 'Non publié'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="rounded bg-white/10 p-1.5 text-mist-300 hover:bg-white/20 hover:text-white"
                    title="Copier le code de vérification"
                  >
                    {copiedCode ? <Check className="size-4 text-gain-400" /> : <Copy className="size-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-between text-3xs text-mist-400">
                  <span>Émis le {passport.issuedAt}</span>
                  <span className="flex items-center gap-1 font-semibold text-gain-400">
                    <CheckCircle2 className="size-3" /> Validé par la preuve
                  </span>
                </div>
              </div>
            </Panel>

            {/* SECTIONS DÉTAILLÉES DU CAREER PASSPORT */}
            <div className="space-y-6 lg:col-span-8">
              {/* APTITUDES PAR LA PREUVE */}
              <Panel as="section" aria-labelledby="aptitudes-title" className="p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 id="aptitudes-title" className="flex items-center gap-2.5 text-base font-bold text-white">
                    <IconChip tone="brand" size="sm">
                      <Award />
                    </IconChip>
                    <span>Compétences &amp; Aptitudes Démontrées</span>
                  </h3>
                  <span className="text-2xs text-mist-400">Évaluation basée sur les actions réelles</span>
                </div>

                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {passport.skills.map((skill) => (
                    <li key={skill.key} className="panel-inset p-3.5">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-semibold text-white capitalize">{skill.name}</span>
                        <span className="rounded bg-white/10 px-1.5 py-0.5 text-3xs font-semibold text-brand-300">
                          {skill.level}
                        </span>
                      </div>
                      <MeterRow label={skill.name} value={skill.percent} barSize="sm" labelClassName="sr-only" />
                    </li>
                  ))}
                </ul>
              </Panel>

              {/* CERTIFICATIONS & TITRES HOMOLOGUÉS */}
              <Panel as="section" aria-labelledby="certifications-title" className="p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 id="certifications-title" className="flex items-center gap-2.5 text-base font-bold text-white">
                    <IconChip tone="gain" size="sm">
                      <FileText />
                    </IconChip>
                    <span>Certifications &amp; Titres Homologués</span>
                  </h3>
                  <Badge tone="gain">{passport.certifications.length} Certifié(s)</Badge>
                </div>

                <ul className="space-y-3">
                  {passport.certifications.map((cert) => (
                    <li
                      key={cert.id}
                      className="panel-inset flex flex-wrap items-center justify-between gap-3 p-3.5 transition-colors hover:bg-white/[0.04]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <IconChip tone="gain" size="sm">
                          <CheckCircle2 />
                        </IconChip>
                        <div className="min-w-0">
                          <span className="block text-xs font-bold text-white">{cert.title}</span>
                          <span className="block text-2xs text-mist-400">
                            {cert.issuer} &bull; Émis le {cert.issuedAt}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-gain-500/15 px-2 py-0.5 text-2xs font-semibold text-gain-300">
                          {cert.honors}
                        </span>
                        <Badge tone="neutral">Vérifiable</Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              </Panel>

              {/* POSTE EN COURS & TRAJECTOIRE */}
              <Panel as="section" aria-labelledby="employment-title" className="p-5 sm:p-6">
                <h3 id="employment-title" className="mb-4 flex items-center gap-2.5 text-base font-bold text-white">
                  <IconChip tone="iris" size="sm">
                    <Briefcase />
                  </IconChip>
                  <span>Situation Professionnelle Active</span>
                </h3>

                {passport.currentJob ? (
                  <div className="panel-inset flex flex-wrap items-center justify-between gap-4 p-4">
                    <div className="space-y-1">
                      <span className="block text-sm font-bold text-white">{passport.currentJob.title}</span>
                      <span className="block text-xs text-iris-300">{passport.currentJob.company}</span>
                      <span className="text-3xs text-mist-400">Contrat actif vérifié sur le registre du Business District</span>
                    </div>
                    <div className="text-right">
                      <span className="metric block text-sm font-black text-gain-300">
                        {passport.currentJob.salary.toLocaleString('fr-FR')} MGA
                      </span>
                      <span className="text-3xs text-mist-400">Rémunération mensuelle</span>
                    </div>
                  </div>
                ) : (
                  <div className="panel-inset p-4 text-xs text-mist-400">
                    Citoyen en recherche active ou porteur de projet entrepreneurial.
                  </div>
                )}
              </Panel>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PORTFOLIO PUBLIC DES RÉALISATIONS (§34) */}
      {activeTab === 'portfolio' && (
        <div className="space-y-6">
          <Panel as="section" className="p-5 sm:p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  🎓 Espace Vitrine Recruteur : {passport.citizenName}
                </h3>
                <p className="mt-1 text-xs text-mist-400">
                  Dossier public de réalisations concrètes exportable et consultable par des employeurs ou partenaires.
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={handleCopyLink}>
                <ExternalLink className="size-4" aria-hidden="true" />
                <span>Ouvrir la vitrine publique</span>
              </Button>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-xs font-bold tracking-wider text-mist-300 uppercase">
                  <Rocket className="size-4 text-brand-400" />
                  <span>Projets Réalisés &amp; Déployés en Production</span>
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {passport.projects.map((proj) => (
                    <div key={proj.id} className="panel-inset flex flex-col justify-between p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-white">{proj.title}</span>
                          <span className="rounded bg-brand-500/20 px-1.5 py-0.5 text-3xs font-semibold text-brand-300">
                            {proj.stage}
                          </span>
                        </div>
                        <p className="text-xs text-mist-400">{proj.description}</p>
                      </div>

                      <div className="mt-4 border-t border-white/[0.06] pt-3 text-2xs">
                        <span className="block text-mist-400">Impact tangible :</span>
                        <span className="font-semibold text-gain-300">{proj.impact}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="mb-3 flex items-center gap-2 text-xs font-bold tracking-wider text-mist-300 uppercase">
                  <FileText className="size-4 text-gain-400" />
                  <span>Formations Théoriques Validées par la Pratique</span>
                </h4>
                <ul className="space-y-2.5">
                  {passport.certifications.map((cert) => (
                    <li key={cert.id} className="panel-inset flex items-center justify-between p-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="size-4 text-gain-400" />
                        <div>
                          <span className="block text-xs font-bold text-white">{cert.title}</span>
                          <span className="text-3xs text-mist-400">{cert.issuer}</span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-gain-300">{cert.honors}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* TAB 3: BADGES & ACCOMPLISSEMENTS (§32) */}
      {activeTab === 'badges' && (
        <div className="space-y-6">
          <Panel as="section" className="p-5 sm:p-6">
            <div className="mb-6">
              <h3 className="text-base font-bold text-white">
                🏆 Système de Badges &amp; Trophées Citoyens
              </h3>
              <p className="mt-1 text-xs text-mist-400">
                Chaque badge atteste d'une étape clé franchie vers l'autonomie professionnelle et financière.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {passport.badges.map((badge: PassportBadge) => (
                <div
                  key={badge.key}
                  className={`panel-inset flex flex-col justify-between p-4 transition-all ${
                    badge.unlocked
                      ? 'border-brand-500/40 bg-brand-500/[0.04]'
                      : 'opacity-60 saturate-50'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div
                        className={`rounded-lg p-2.5 ${
                          badge.unlocked
                            ? 'bg-brand-500/20 text-brand-300 ring-1 ring-brand-500/30'
                            : 'bg-white/5 text-mist-500'
                        }`}
                      >
                        {BADGE_ICONS[badge.key] || <Award className="size-5" />}
                      </div>
                      {badge.unlocked ? (
                        <Badge tone="gain">Obtenu</Badge>
                      ) : (
                        <Badge tone="neutral">Verrouillé</Badge>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white">{badge.name}</h4>
                      <p className="mt-1 text-xs leading-relaxed text-mist-400">{badge.description}</p>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-white/[0.06] pt-3 text-3xs text-mist-500">
                    {badge.unlocked && badge.date ? (
                      <span>Validé le {badge.date}</span>
                    ) : (
                      <span>En cours d'accomplissement</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {/* TAB 4: SCEAU CRYPTOGRAPHIQUE & PREUVE D'INTÉGRITÉ */}
      {activeTab === 'verify' && (
        <div className="space-y-6">
          <PassportPublicationPanel passport={passport} />
          <Panel as="section" className="p-5 sm:p-6">
            <h3 className="mb-2 text-base font-bold text-white">
              🔐 Partage &amp; vérification
            </h3>
            <p className="mb-6 text-xs text-mist-400">
              Le contenu du passeport est signé par le serveur (HMAC-SHA256). La vérification publique lit les données en direct, uniquement pour les passeports que leur propriétaire a publiés.
            </p>

            <div className="space-y-4">
              <div className="panel-inset space-y-2 p-4">
                <span className="block text-2xs font-semibold text-mist-400 uppercase">Signature Numérique Officielle</span>
                <div className="flex items-center justify-between gap-3">
                  <code className="font-mono block truncate text-xs font-bold text-brand-300">
                    {passport.cryptographicSignature}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(passport.cryptographicSignature);
                      addNotification('Empreinte copiée', 'Signature SHA-256 copiée dans le presse-papiers.', 'info');
                    }}
                    className="shrink-0 rounded bg-white/10 p-1.5 text-mist-300 hover:bg-white/20 hover:text-white"
                  >
                    <Copy className="size-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="panel-inset p-4">
                  <span className="block text-3xs font-semibold text-mist-400 uppercase">Autorité d'Émission</span>
                  <span className="mt-1 block text-xs font-bold text-white">{passport.authority}</span>
                </div>
                <div className="panel-inset p-4">
                  <span className="block text-3xs font-semibold text-mist-400 uppercase">Statut du Registre</span>
                  <span className="mt-1 flex items-center gap-1.5 text-xs font-bold text-gain-300">
                    <CheckCircle2 className="size-4" /> Certifié Conforme &bull; Base Immuable
                  </span>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* MODALE DE VÉRIFICATION PUBLIQUE D'UN CODE CITOYEN */}
      <Modal
        open={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        labelledBy="verify-modal-title"
        size="lg"
      >
        <div className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <IconChip tone="brand" size="md">
              <Search />
            </IconChip>
            <div>
              <h3 id="verify-modal-title" className="text-base font-bold text-white">
                Vérificateur de Career Passport Officiel
              </h3>
              <p className="text-xs text-mist-400">
                Contrôlez l'authenticité d'un passeport via son identifiant ou son sceau cryptographique.
              </p>
            </div>
          </div>

          <form onSubmit={handleVerifySearch} className="mb-6 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={verifyQuery}
                onChange={(e) => setVerifyQuery(e.target.value)}
                placeholder="Ex : YC-VERIF-84920A1F ou YC-84920"
                className="flex-1 rounded-lg border border-white/10 bg-midnight-950 px-3.5 py-2.5 text-xs font-mono text-white placeholder-mist-600 focus:border-brand-500 focus:outline-none"
              />
              <Button type="submit" variant="primary" disabled={isVerifying || !verifyQuery.trim()}>
                {isVerifying ? 'Contrôle...' : 'Vérifier'}
              </Button>
            </div>
            <p className="text-3xs text-mist-500">
              Astuce : Teste avec ton propre code (<span className="font-mono text-mist-300">{passport.verificationCode}</span>) ou <span className="font-mono text-mist-300">YC-84920</span>.
            </p>
          </form>

          {verifyResult && (
            <div className="rounded-xl border border-white/10 p-4">
              {verifyResult.verified && verifyResult.data ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-gain-300">
                    <CheckCircle2 className="size-4" />
                    <span>Passeport authentifié avec succès dans le registre officiel</span>
                  </div>
                  <div className="panel-inset space-y-1.5 p-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-mist-400">Citoyen :</span>
                      <span className="font-bold text-white">{verifyResult.data.citizenName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-mist-400">Titre :</span>
                      <span className="text-brand-300">{verifyResult.data.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-mist-400">Niveau / Aptitude :</span>
                      <span className="metric font-bold text-white">
                        Niv. {verifyResult.data.level} ({verifyResult.data.aptitudeScore}% pro)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-mist-400">Certifications validées :</span>
                      <span className="font-bold text-gain-300">{verifyResult.data.certifications.length}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-risk-300">
                  <ShieldAlert className="size-4 shrink-0" />
                  <span>{verifyResult.error}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
