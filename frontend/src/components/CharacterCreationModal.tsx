import React, { useState } from 'react';
import {
  Sparkles,
  GraduationCap,
  Hammer,
  PiggyBank,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Code,
  TrendingUp,
  Briefcase,
  Zap,
  Wallet,
  ShieldCheck,
} from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { IconChip } from './ui/IconChip';
import { Avatar } from './ui/Avatar';
import { useGameStore } from '../stores/useGameStore';
import type { CharacterArchetype, CharacterVocation } from '../types/game';
import { formatNumber } from '../lib/format';

interface AvatarOption {
  seed: string;
  label: string;
  role: string;
}

const AVATAR_OPTIONS: AvatarOption[] = [
  { seed: 'felix', label: 'Félix', role: 'Dev & Code' },
  { seed: 'anita', label: 'Anita', role: 'Étudiante' },
  { seed: 'alex', label: 'Alex', role: 'Créatif Tech' },
  { seed: 'sam', label: 'Sam', role: 'Gestionnaire' },
  { seed: 'zoe', label: 'Zoé', role: 'Entrepreneuse' },
  { seed: 'rado', label: 'Rado', role: 'Leader' },
];

interface ArchetypeCard {
  id: CharacterArchetype;
  name: string;
  tagline: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'brand' | 'warn' | 'gain';
  money: number;
  savings: number;
  energy: number;
  highlights: string[];
}

const ARCHETYPES: ArchetypeCard[] = [
  {
    id: 'ambitious_student',
    name: "L'Étudiant Ambitieux",
    tagline: 'Apprentissage continu & Carrière qualifiée',
    description: "Prêt à s'investir sur le Campus pour obtenir des certifications et décrocher un job qualifié.",
    icon: GraduationCap,
    tone: 'brand',
    money: 200000,
    savings: 100000,
    energy: 85,
    highlights: ['Communication 30%', 'JavaScript 25%', 'Git 20%'],
  },
  {
    id: 'resourceful_self_taught',
    name: "L'Autodidacte Débrouillard",
    tagline: 'Missions concrètes & Esprit Maker',
    description: "Formé sur le tas et orienté résultat. Préfère l'action rapide et la création de valeur.",
    icon: Hammer,
    tone: 'warn',
    money: 280000,
    savings: 20000,
    energy: 75,
    highlights: ['Entrepreneuriat 35%', 'JavaScript 30%', 'Git 25%'],
  },
  {
    id: 'pragmatic_saver',
    name: 'Le Pragmatique Économe',
    tagline: 'Rigueur budgétaire & Sécurité financière',
    description: "Adepte de la règle 50/30/20. Bâtit un matelas de sécurité avant de prendre des risques.",
    icon: PiggyBank,
    tone: 'gain',
    money: 180000,
    savings: 170000,
    energy: 80,
    highlights: ['Budget & Épargne 35%', 'Communication 25%', 'Entrepreneuriat 20%'],
  },
];

interface VocationOption {
  id: CharacterVocation;
  title: string;
  district: string;
  icon: React.ComponentType<{ className?: string }>;
  mission: string;
}

const VOCATIONS: VocationOption[] = [
  {
    id: 'tech',
    title: 'Numérique & Code Web',
    district: 'Campus District',
    icon: Code,
    mission: 'Visiter le Campus et valider le module Développeur Web Junior (HTML/CSS/JS).',
  },
  {
    id: 'finance',
    title: 'Finance & Épargne Sécurisée',
    district: 'Finance District',
    icon: TrendingUp,
    mission: 'Déposer tes premières économies sur le Livret BOA pour générer 3.5% annuels.',
  },
  {
    id: 'business',
    title: 'Emploi & Carrière Terrain',
    district: 'Business District',
    icon: Briefcase,
    mission: 'Effectuer ton premier quart de travail et sécuriser ton premier loyer.',
  },
];

interface CharacterCreationContentProps {
  onClose: () => void;
}

const CharacterCreationContent: React.FC<CharacterCreationContentProps> = ({ onClose }) => {
  const { customizeCharacter, citizen } = useGameStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState(citizen?.name || 'Emmanuel');
  const [avatarSeed, setAvatarSeed] = useState(citizen?.avatarSeed || 'felix');
  const [selectedArchetype, setSelectedArchetype] = useState<CharacterArchetype>('ambitious_student');
  const [selectedVocation, setSelectedVocation] = useState<CharacterVocation>('tech');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeArchetypeCard = ARCHETYPES.find((a) => a.id === selectedArchetype) || ARCHETYPES[0];
  const activeVocationCard = VOCATIONS.find((v) => v.id === selectedVocation) || VOCATIONS[0];

  const handleNext = () => {
    if (step === 1) {
      if (name.trim().length < 2) {
        setError('Le prénom doit comporter au moins 2 caractères.');
        return;
      }
      setError(null);
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await customizeCharacter({
        name: name.trim(),
        avatarSeed,
        archetype: selectedArchetype,
        vocation: selectedVocation,
      });
      if (!res.success) {
        setError(res.error || 'Erreur lors de la personnalisation.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="border-b border-white/[0.08] bg-white/[0.02] px-6 py-5 pr-14">
        <div className="flex items-center gap-3">
          <IconChip tone="brand" className="size-11">
            <Sparkles className="size-5" />
          </IconChip>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 id="char-creation-title" className="text-base font-extrabold text-white">
                Passeport Citoyen &amp; Création d'Avatar
              </h2>
              <Badge tone="brand" variant="square">
                §14 &amp; §47
              </Badge>
            </div>
            <p id="char-creation-desc" className="text-2xs text-mist-400 mt-0.5">
              Étape {step} sur 3 &mdash; Configure ton identité, ton profil et ta première ambition urbaine.
            </p>
          </div>
        </div>

        {/* Stepper indicator */}
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
          {[
            { num: 1, label: 'Identité & Avatar' },
            { num: 2, label: 'Archétype de départ' },
            { num: 3, label: 'Vocation & Départ' },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2 flex-1">
              <div
                className={`flex size-6 shrink-0 items-center justify-center rounded-full text-2xs font-bold transition-all ${
                  step === s.num
                    ? 'bg-brand-500 text-white shadow-brand ring-2 ring-brand-400/30'
                    : step > s.num
                    ? 'bg-gain-500 text-white'
                    : 'bg-white/10 text-mist-400'
                }`}
              >
                {step > s.num ? <CheckCircle2 className="size-3.5" /> : s.num}
              </div>
              <span
                className={`text-2xs font-semibold truncate hidden sm:inline ${
                  step === s.num ? 'text-white' : 'text-mist-400'
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto no-scrollbar">
        {error && (
          <div role="alert" className="rounded-lg border border-risk-500/30 bg-risk-500/10 p-3 text-xs text-risk-300">
            {error}
          </div>
        )}

        {/* STEP 1: Identité & Avatar */}
        {step === 1 && (
          <div className="space-y-5 animate-rise-in">
            <div className="flex flex-col sm:flex-row items-center gap-5 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <Avatar name={name} seed={avatarSeed} size="xl" />
              <div className="flex-1 w-full space-y-1 text-center sm:text-left">
                <label htmlFor="char-name-input" className="block text-2xs font-bold uppercase tracking-wider text-mist-300">
                  Prénom de ton Citoyen <span className="text-risk-400">*</span>
                </label>
                <input
                  id="char-name-input"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Emmanuel, Aina, Rado, Mialy…"
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm font-semibold text-white placeholder:text-mist-500 focus:border-brand-400 focus:bg-white/[0.06] focus:outline-none"
                />
                <p className="text-2xs text-mist-400">
                  Ce prénom apparaîtra dans le Cockpit, sur tes diplômes du Campus et dans les fiches de paie.
                </p>
              </div>
            </div>

            <div>
              <p className="text-2xs font-bold uppercase tracking-wider text-mist-300 mb-2.5">
                Choisis un style visuel d'Avatar :
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {AVATAR_OPTIONS.map((opt) => {
                  const isSelected = avatarSeed === opt.seed;
                  return (
                    <button
                      key={opt.seed}
                      type="button"
                      onClick={() => setAvatarSeed(opt.seed)}
                      className={`flex flex-col items-center gap-2 rounded-xl p-3 border transition-all text-center ${
                        isSelected
                          ? 'border-brand-400 bg-brand-500/15 ring-2 ring-brand-400/40 shadow-brand'
                          : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                      }`}
                    >
                      <Avatar name={name} seed={opt.seed} size="md" />
                      <span className="text-2xs font-bold text-white truncate w-full">{opt.label}</span>
                      <span className="text-3xs text-mist-400 -mt-1 truncate w-full">{opt.role}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Archétype Citoyen (§14, §47) */}
        {step === 2 && (
          <div className="space-y-4 animate-rise-in">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-mist-300">
                Choisis ton profil de départ dans Youth City :
              </h3>
              <p className="text-2xs text-mist-400 mt-0.5">
                Ton archétype détermine ta dotation en MGA, ton niveau d'énergie initial et tes compétences de base.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {ARCHETYPES.map((arch) => {
                const Icon = arch.icon;
                const isSelected = selectedArchetype === arch.id;

                return (
                  <button
                    key={arch.id}
                    type="button"
                    onClick={() => setSelectedArchetype(arch.id)}
                    className={`flex flex-col justify-between rounded-xl p-4 border text-left transition-all ${
                      isSelected
                        ? 'border-brand-400 bg-brand-500/10 ring-2 ring-brand-400/40 shadow-brand'
                        : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <IconChip tone={arch.tone} className="size-10">
                          <Icon className="size-5" />
                        </IconChip>
                        {isSelected && <Badge tone="brand">Sélectionné</Badge>}
                      </div>

                      <h4 className="text-sm font-bold text-white">{arch.name}</h4>
                      <p className="text-3xs text-brand-300 font-semibold mt-0.5">{arch.tagline}</p>
                      <p className="text-2xs text-mist-400 mt-2 line-clamp-3">{arch.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-1.5 w-full text-2xs">
                      <div className="flex items-center justify-between text-mist-300">
                        <span className="flex items-center gap-1.5">
                          <Wallet className="size-3 text-gain-400" />
                          Solde courant :
                        </span>
                        <span className="font-bold text-white">{formatNumber(arch.money)} MGA</span>
                      </div>
                      <div className="flex items-center justify-between text-mist-300">
                        <span className="flex items-center gap-1.5">
                          <PiggyBank className="size-3 text-iris-400" />
                          Épargne BOA :
                        </span>
                        <span className="font-bold text-iris-300">{formatNumber(arch.savings)} MGA</span>
                      </div>
                      <div className="flex items-center justify-between text-mist-300">
                        <span className="flex items-center gap-1.5">
                          <Zap className="size-3 text-energy-400" />
                          Énergie de départ :
                        </span>
                        <span className="font-bold text-energy-300">{arch.energy}%</span>
                      </div>

                      <div className="pt-2 flex flex-wrap gap-1">
                        {arch.highlights.map((h, i) => (
                          <span key={i} className="rounded bg-white/[0.06] px-1.5 py-0.5 text-3xs text-mist-300 font-mono">
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: Vocation Initiale & Confirmation */}
        {step === 3 && (
          <div className="space-y-5 animate-rise-in">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-mist-300">
                Choisis ta première orientation citoyenne (§47) :
              </h3>
              <p className="text-2xs text-mist-400 mt-0.5">
                Cette orientation fixera ton premier objectif guidé dans la ville. Tu pourras ensuite explorer librement tous les autres quartiers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {VOCATIONS.map((voc) => {
                const Icon = voc.icon;
                const isSelected = selectedVocation === voc.id;

                return (
                  <button
                    key={voc.id}
                    type="button"
                    onClick={() => setSelectedVocation(voc.id)}
                    className={`flex flex-col rounded-xl p-4 border text-left transition-all ${
                      isSelected
                        ? 'border-brand-400 bg-brand-500/10 ring-2 ring-brand-400/40 shadow-brand'
                        : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <IconChip tone="brand" className="size-9">
                        <Icon className="size-4" />
                      </IconChip>
                      <span className="text-3xs font-semibold text-brand-300">{voc.district}</span>
                    </div>

                    <h4 className="text-xs font-bold text-white">{voc.title}</h4>
                    <p className="text-2xs text-mist-400 mt-1.5 flex-1">{voc.mission}</p>
                  </button>
                );
              })}
            </div>

            {/* Recap card */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-gain-300">
                <ShieldCheck className="size-4 text-gain-400" />
                <span>Récapitulatif de ton Citoyen Youth City :</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-2xs">
                <div>
                  <span className="text-mist-400 block text-3xs">Avatar &amp; Prénom</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Avatar name={name} seed={avatarSeed} size="sm" />
                    <span className="font-bold text-white truncate">{name}</span>
                  </div>
                </div>
                <div>
                  <span className="text-mist-400 block text-3xs">Archétype</span>
                  <span className="font-bold text-brand-300 block mt-1">{activeArchetypeCard.name}</span>
                </div>
                <div>
                  <span className="text-mist-400 block text-3xs">Capital de départ</span>
                  <span className="font-bold text-gain-300 block mt-1">
                    {formatNumber(activeArchetypeCard.money + activeArchetypeCard.savings)} MGA
                  </span>
                </div>
                <div>
                  <span className="text-mist-400 block text-3xs">Première Mission</span>
                  <span className="font-bold text-white block mt-1 truncate">{activeVocationCard.title}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer controls */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-3">
          {step > 1 ? (
            <Button variant="ghost" onClick={handlePrev} disabled={loading}>
              <ArrowLeft className="size-4" />
              <span>Précédent</span>
            </Button>
          ) : (
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              Passer la personnalisation
            </Button>
          )}

          {step < 3 ? (
            <Button variant="primary" onClick={handleNext}>
              <span>Continuer</span>
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button variant="primary" onClick={handleFinish} disabled={loading}>
              <Sparkles className="size-4" />
              <span>{loading ? 'Création en cours…' : 'Valider & Entrer dans la Ville'}</span>
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export const CharacterCreationModal: React.FC = () => {
  const { isCharacterCreationOpen, toggleCharacterCreation } = useGameStore();

  return (
    <Modal
      open={isCharacterCreationOpen}
      onClose={() => toggleCharacterCreation(false)}
      labelledBy="char-creation-title"
      describedBy="char-creation-desc"
      size="lg"
    >
      {isCharacterCreationOpen ? (
        <CharacterCreationContent onClose={() => toggleCharacterCreation(false)} />
      ) : null}
    </Modal>
  );
};
