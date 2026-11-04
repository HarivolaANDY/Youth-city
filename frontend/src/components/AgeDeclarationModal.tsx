import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { IconChip } from './ui/IconChip';
import { useGameStore } from '../stores/useGameStore';
import { api } from '../services/api';

/**
 * Comptes créés avant la protection des mineurs : l'âge est inconnu, le compte est donc traité comme celui d'un mineur
 * (messages et visibilité restreints) tant que l'année de naissance n'est pas déclarée. La déclaration se fait une seule fois.
 */
export const AgeDeclarationModal: React.FC = () => {
  const { isAuthenticated, citizen, applyServerCitizen, addNotification } = useGameStore();
  const [dismissed, setDismissed] = useState(false);
  const [birthYear, setBirthYear] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [guardianConsent, setGuardianConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const open = isAuthenticated && citizen.needsAgeDeclaration === true && !dismissed;

  const currentYear = new Date().getFullYear();
  const yearNumber = Number(birthYear);
  const hasValidYear = Number.isInteger(yearNumber) && yearNumber >= currentYear - 100 && yearNumber <= currentYear;
  const isMinor = hasValidYear && currentYear - yearNumber < 18;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!hasValidYear) {
      setError('Indique une année de naissance valide (4 chiffres).');
      return;
    }
    if (!acceptTerms) {
      setError("Accepte les conditions d'utilisation pour continuer.");
      return;
    }
    if (isMinor && !guardianConsent) {
      setError("Un accord de ton représentant légal est requis pour les moins de 18 ans.");
      return;
    }
    setLoading(true);
    const res = await api.declareAge({
      birthYear: yearNumber,
      acceptTerms,
      guardianConsent: isMinor ? guardianConsent : undefined,
    });
    setLoading(false);
    if ('error' in res) {
      setError(res.error);
      return;
    }
    applyServerCitizen(res.citizen);
    addNotification('Profil à jour', res.message, 'success');
  };

  return (
    <Modal open={open} onClose={() => setDismissed(true)} labelledBy="age-declaration-title" describedBy="age-declaration-desc" size="md">
      {open ? (
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="flex items-center gap-3">
            <IconChip tone="brand" size="md">
              <ShieldCheck />
            </IconChip>
            <div>
              <h2 id="age-declaration-title" className="text-lg font-bold text-white">
                Complète ton profil
              </h2>
              <p id="age-declaration-desc" className="text-xs text-mist-400">
                Nous ne connaissons pas ton âge : en attendant, ton compte est protégé comme celui d&apos;un mineur (annuaire masqué, messages
                limités).
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="age-birth-year" className="block text-2xs font-bold uppercase tracking-wider text-mist-300">
              Année de naissance
            </label>
            <input
              id="age-birth-year"
              type="number"
              inputMode="numeric"
              required
              min={currentYear - 100}
              max={currentYear}
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              placeholder="Ex: 2002"
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs text-white placeholder:text-mist-500 focus:border-brand-400 focus:outline-none"
            />
            <p className="mt-1 text-2xs text-mist-500">Cette déclaration ne peut être faite qu&apos;une seule fois. Seule l&apos;année est conservée.</p>
          </div>

          {isMinor ? (
            <label className="flex items-start gap-2 rounded-lg border border-warn-400/30 bg-warn-500/10 p-3 text-2xs text-mist-200">
              <input
                type="checkbox"
                checked={guardianConsent}
                onChange={(e) => setGuardianConsent(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-brand-500"
              />
              <span>Je déclare que mon représentant légal est d&apos;accord pour que j&apos;utilise Youth City.</span>
            </label>
          ) : null}

          <label className="flex items-start gap-2 text-2xs text-mist-300">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-brand-500"
            />
            <span>J&apos;accepte les conditions d&apos;utilisation. Youth City est une simulation : l&apos;argent et les certifications y sont virtuels.</span>
          </label>

          {error ? (
            <p role="alert" className="rounded-lg border border-risk-400/30 bg-risk-500/10 px-3 py-2 text-xs text-risk-300">
              {error}
            </p>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" type="button" onClick={() => setDismissed(true)} disabled={loading}>
              Plus tard
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      ) : null}
    </Modal>
  );
};
