import React, { useState } from 'react';
import { User, Lock, Mail, Sparkles, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { IconChip } from './ui/IconChip';
import { Badge } from './ui/Badge';
import { useGameStore } from '../stores/useGameStore';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, authMode, toggleAuthModal, login, register } = useGameStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [citizenName, setCitizenName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [guardianConsent, setGuardianConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const birthYearNumber = Number(birthYear);
  const hasValidYear = Number.isInteger(birthYearNumber) && birthYearNumber >= currentYear - 100 && birthYearNumber <= currentYear;
  const isMinor = hasValidYear && currentYear - birthYearNumber < 18;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (authMode === 'register') {
      if (!hasValidYear) {
        setError("Indique une année de naissance valide (4 chiffres).");
        return;
      }
      if (!acceptTerms) {
        setError("Accepte les conditions d'utilisation pour créer ton compte.");
        return;
      }
      if (isMinor && !guardianConsent) {
        setError("Un accord de ton représentant légal est requis pour les moins de 18 ans.");
        return;
      }
    }
    setLoading(true);

    try {
      if (authMode === 'login') {
        const res = await login(username, password);
        if (!res.success) {
          setError(res.error || 'Identifiant ou mot de passe incorrect.');
        } else {
          resetFields();
        }
      } else {
        const res = await register({
          username,
          email: email.trim() || undefined,
          password,
          citizenName: citizenName.trim() || undefined,
          birthYear: birthYearNumber,
          acceptTerms,
          guardianConsent: isMinor ? guardianConsent : undefined,
        });
        if (!res.success) {
          setError(res.error || "Erreur lors de la création du compte.");
        } else {
          resetFields();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const resetFields = () => {
    setUsername('');
    setPassword('');
    setEmail('');
    setCitizenName('');
    setBirthYear('');
    setAcceptTerms(false);
    setGuardianConsent(false);
    setError(null);
  };

  const handleClose = () => {
    toggleAuthModal(false);
    resetFields();
  };

  return (
    <Modal
      open={isAuthModalOpen}
      onClose={handleClose}
      labelledBy="auth-modal-title"
      describedBy="auth-modal-desc"
      size="md"
    >
      <div className="border-b border-white/[0.08] bg-white/[0.02] px-6 py-5 pr-14">
        <div className="flex items-center gap-3">
          <IconChip tone="brand" className="size-11">
            <User className="size-5" />
          </IconChip>
          <div>
            <div className="flex items-center gap-2">
              <h2 id="auth-modal-title" className="text-base font-extrabold text-white">
                {authMode === 'login' ? 'Connexion Citoyenne' : 'Rejoindre Youth City'}
              </h2>
              <Badge tone="brand" variant="square">
                §42 &amp; §47
              </Badge>
            </div>
            <p id="auth-modal-desc" className="text-2xs text-mist-400 mt-0.5">
              {authMode === 'login'
                ? 'Accède à ton avatar et synchronise ta progression en direct.'
                : 'Crée ton profil pour bâtir ta carrière et ton patrimoine en toute autonomie.'}
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="mt-4 flex rounded-lg border border-white/[0.08] bg-night-900 p-1">
          <button
            type="button"
            onClick={() => {
              toggleAuthModal(true, 'login');
              setError(null);
            }}
            className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 ${
              authMode === 'login'
                ? 'bg-linear-to-r from-brand-600 to-iris-600 text-white shadow-brand'
                : 'text-mist-400 hover:text-white'
            }`}
          >
            Se connecter
          </button>
          <button
            type="button"
            onClick={() => {
              toggleAuthModal(true, 'register');
              setError(null);
            }}
            className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 ${
              authMode === 'register'
                ? 'bg-linear-to-r from-brand-600 to-iris-600 text-white shadow-brand'
                : 'text-mist-400 hover:text-white'
            }`}
          >
            Créer un compte
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-risk-500/30 bg-risk-500/10 p-3 text-xs text-risk-300 animate-pop-in"
          >
            <AlertCircle className="size-4 shrink-0 mt-0.5 text-risk-400" aria-hidden="true" />
            <p>{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="auth-username" className="block text-2xs font-bold uppercase tracking-wider text-mist-300">
            Nom d'utilisateur <span className="text-risk-400">*</span>
          </label>
          <div className="relative mt-1">
            <input
              id="auth-username"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ex: emmanuel26"
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 pl-10 text-xs text-white placeholder:text-mist-500 focus:border-brand-400 focus:bg-white/[0.06] focus:outline-none"
            />
            <User className="absolute left-3 top-3 size-4 text-mist-500" aria-hidden="true" />
          </div>
        </div>

        {authMode === 'register' && (
          <>
            <div>
              <label htmlFor="auth-citizen-name" className="block text-2xs font-bold uppercase tracking-wider text-mist-300">
                Prénom de votre avatar citoyen
              </label>
              <div className="relative mt-1">
                <input
                  id="auth-citizen-name"
                  type="text"
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  placeholder="Ex: Emmanuel, Aina, Rado…"
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 pl-10 text-xs text-white placeholder:text-mist-500 focus:border-brand-400 focus:bg-white/[0.06] focus:outline-none"
                />
                <Sparkles className="absolute left-3 top-3 size-4 text-mist-500" aria-hidden="true" />
              </div>
              <p className="mt-1 text-2xs text-mist-500">
                Ce prénom s'affichera dans le cockpit et sur ton passeport de compétences.
              </p>
            </div>

            <div>
              <label htmlFor="auth-email" className="block text-2xs font-bold uppercase tracking-wider text-mist-300">
                Adresse e-mail <span className="text-mist-500 font-normal">(optionnel)</span>
              </label>
              <div className="relative mt-1">
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@exemple.com"
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 pl-10 text-xs text-white placeholder:text-mist-500 focus:border-brand-400 focus:bg-white/[0.06] focus:outline-none"
                />
                <Mail className="absolute left-3 top-3 size-4 text-mist-500" aria-hidden="true" />
              </div>
            </div>
          </>
        )}

        <div>
          <label htmlFor="auth-password" className="block text-2xs font-bold uppercase tracking-wider text-mist-300">
            Mot de passe <span className="text-risk-400">*</span>
          </label>
          <div className="relative mt-1">
            <input
              id="auth-password"
              type="password"
              required
              minLength={6}
              autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 pl-10 text-xs text-white placeholder:text-mist-500 focus:border-brand-400 focus:bg-white/[0.06] focus:outline-none"
            />
            <Lock className="absolute left-3 top-3 size-4 text-mist-500" aria-hidden="true" />
          </div>
          {authMode === 'register' && (
            <p className="mt-1 text-2xs text-mist-500">Au moins 6 caractères pour sécuriser ton compte.</p>
          )}
        </div>

        {authMode === 'register' && (
          <div className="space-y-3">
            <div>
              <label htmlFor="auth-birth-year" className="block text-2xs font-bold uppercase tracking-wider text-mist-300">
                Année de naissance <span className="text-risk-400">*</span>
              </label>
              <input
                id="auth-birth-year"
                type="number"
                inputMode="numeric"
                required
                min={currentYear - 100}
                max={currentYear}
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                placeholder="Ex: 2002"
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs text-white placeholder:text-mist-500 focus:border-brand-400 focus:bg-white/[0.06] focus:outline-none"
              />
              <p className="mt-1 text-2xs text-mist-500">
                Sert uniquement à adapter la protection de ton compte (messages, visibilité). Seule l'année est conservée.
              </p>
            </div>

            {isMinor && (
              <label className="flex items-start gap-2 rounded-lg border border-warn-400/30 bg-warn-500/10 p-3 text-2xs text-mist-200">
                <input
                  type="checkbox"
                  checked={guardianConsent}
                  onChange={(e) => setGuardianConsent(e.target.checked)}
                  className="mt-0.5 size-4 shrink-0 accent-brand-500"
                />
                <span>
                  Je déclare que mon représentant légal est d'accord pour que j'utilise Youth City. Mon profil sera masqué par défaut et je ne pourrai
                  échanger directement qu'avec d'autres personnes de moins de 18 ans.
                </span>
              </label>
            )}

            <label className="flex items-start gap-2 text-2xs text-mist-300">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-brand-500"
              />
              <span>
                J'accepte les conditions d'utilisation. Youth City est une simulation éducative : l'argent, les offres et les certifications
                y sont virtuels et n'ont aucune valeur officielle.
              </span>
            </label>
          </div>
        )}

        {authMode === 'register' && (
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-2xs text-mist-400 space-y-1">
            <div className="flex items-center gap-1.5 text-gain-300 font-semibold">
              <CheckCircle2 className="size-3.5 text-gain-400" aria-hidden="true" />
              <span>Avantages du compte citoyen :</span>
            </div>
            <p>• Sauvegarde permanente de ta trésorerie MGA et de tes cours Campus.</p>
            <p>• Possibilité de reprendre ta partie sur n'importe quel appareil.</p>
          </div>
        )}

        <div className="pt-2 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={handleClose} disabled={loading}>
            Continuer en invité
          </Button>

          <Button variant="primary" type="submit" disabled={loading}>
            <span>{loading ? 'Chargement…' : authMode === 'login' ? 'Se connecter' : 'Valider mon inscription'}</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </form>
    </Modal>
  );
};
