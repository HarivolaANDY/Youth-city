import React, { useState } from 'react';
import {
  ShieldAlert,
  BarChart3,
  Users,
  Coins,
  GraduationCap,
  Rocket,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCw,
  Send,
  Award,
  Sparkles,
  ShieldCheck,
  Ban,
  Filter,
} from 'lucide-react';
import { useGameStore } from '../stores/useGameStore';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge, type BadgeTone } from './ui/Badge';
import { IconChip } from './ui/IconChip';
import { controlClass } from './ui/control';
import { formatNumber } from '../lib/format';
import type { ModerationReason, ModerationStatus, ModerationAction } from '../types/game';

const REASON_LABELS: Record<ModerationReason, { label: string; tone: BadgeTone }> = {
  harassment: { label: 'Harcèlement / Haine', tone: 'risk' },
  spam: { label: 'Spam / Liens externes', tone: 'warn' },
  inappropriate: { label: 'Contenu inapproprié', tone: 'risk' },
  fraud: { label: 'Fraude simulée / Bot', tone: 'warn' },
  other: { label: 'Éthique & Autre', tone: 'iris' },
};

const STATUS_LABELS: Record<ModerationStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: 'En attente', tone: 'warn' },
  investigating: { label: 'En examen', tone: 'iris' },
  resolved: { label: 'Traité & Résolu', tone: 'gain' },
  dismissed: { label: 'Sans suite', tone: 'neutral' },
};

const ACTION_LABELS: Record<ModerationAction, { label: string; color: string }> = {
  none: { label: 'Aucune sanction', color: 'text-mist-400' },
  warning: { label: 'Avertissement officiel', color: 'text-amber-400 font-semibold' },
  quarantine: { label: 'Mise en quarantaine', color: 'text-amber-300 font-semibold' },
  ban: { label: 'Suspension de compte', color: 'text-rose-400 font-bold' },
};

export const AdminBackOfficeModal: React.FC = () => {
  const {
    user,
    isAdminModalOpen,
    toggleAdminModal,
    adminOverview,
    moderationReports,
    fetchAdminData,
    resolveModerationReport,
    createModerationReport,
    grantAdminStipend,
    citizen,
    day,
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<'analytics' | 'moderation' | 'citizens'>('analytics');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // New report form state
  const [showReportForm, setShowReportForm] = useState(false);
  const [newReason, setNewReason] = useState<ModerationReason>('spam');
  const [newTargetName, setNewTargetName] = useState('Salon Général');
  const [newTargetType, setNewTargetType] = useState('chat_message');
  const [newDetails, setNewDetails] = useState('');

  // Grant stipend form state
  const [stipendRecipientId, setStipendRecipientId] = useState<string>(String(citizen.id));
  const [stipendAmount, setStipendAmount] = useState<number>(50000);
  const [stipendReason, setStipendReason] = useState<string>("Bourse d'encouragement pédagogique Youth City");
  const [isSubmittingStipend, setIsSubmittingStipend] = useState(false);

  if (!isAdminModalOpen) return null;

  if (!user?.is_staff) {
    return (
      <Modal
        open={isAdminModalOpen}
        onClose={() => toggleAdminModal(false)}
        labelledBy="admin-denied-title"
        size="md"
      >
        <div className="p-6 text-center space-y-4 bg-night-950 text-white">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
            <ShieldAlert className="size-8" />
          </div>
          <div>
            <h3 id="admin-denied-title" className="text-lg font-bold text-white">
              Accès Restreint aux Administrateurs
            </h3>
            <p className="mt-2 text-sm text-mist-400">
              La console de supervision et de modération requiert un compte doté des privilèges d'administration (<code className="text-amber-300">is_staff</code>).
            </p>
          </div>
          <div className="pt-2">
            <Button variant="secondary" onClick={() => toggleAdminModal(false)}>
              Fermer
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAdminData();
    setIsRefreshing(false);
  };

  const handleActionClick = async (reportId: number, action: ModerationAction, newStatus: ModerationStatus) => {
    let note = '';
    if (action === 'warning') note = 'Avertissement officiel envoyé avec rappel des règles citoyennes.';
    else if (action === 'quarantine') note = 'Contenu retiré de la visibilité publique pour révision.';
    else if (action === 'ban') note = 'Compte suspendu pour manquements répétés à la charte.';
    else if (newStatus === 'dismissed') note = 'Signalement classé sans suite après analyse des logs.';

    await resolveModerationReport(reportId, {
      action,
      status: newStatus,
      notes: note,
    });
  };

  const handleSubmitNewReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDetails.trim()) return;

    const res = await createModerationReport({
      targetType: newTargetType,
      targetId: `target-${Date.now()}`,
      targetName: newTargetName,
      reason: newReason,
      details: newDetails.trim(),
    });

    if (res.success) {
      setNewDetails('');
      setShowReportForm(false);
    }
  };

  const handleGrantStipend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stipendAmount <= 0) return;
    setIsSubmittingStipend(true);

    const parsedId = Number(stipendRecipientId);
    await grantAdminStipend({
      characterId: isNaN(parsedId) ? undefined : parsedId,
      amount: stipendAmount,
      reason: stipendReason.trim() || "Bourse d'encouragement pédagogique",
    });

    setIsSubmittingStipend(false);
  };

  const overview = adminOverview?.overview || {
    totalCitizens: 1,
    totalMoneyCirculation: citizen.money,
    totalSavings: citizen.savings,
    avgWealth: citizen.money + citizen.savings,
    totalCompletedCourses: (citizen.completedCourses || []).length,
    totalCertifications: (citizen.certifications || []).length,
    totalStartups: 1,
    fundedStartups: 0,
    totalHackathonParticipations: citizen.completedChallenges,
    totalGuilds: 5,
    pendingReports: 0,
    resolvedReports: 0,
    economicHealthScore: 85,
  };

  const filteredReports = moderationReports.filter((r) => {
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });

  const pendingCount = moderationReports.filter((r) => r.status === 'pending').length;

  return (
    <Modal
      open={isAdminModalOpen}
      onClose={() => toggleAdminModal(false)}
      labelledBy="admin-backoffice-title"
      describedBy="admin-backoffice-description"
      size="2xl"
    >
      {/* Modal Header */}
      <div className="relative border-b border-white/10 bg-night-900/90 p-5 backdrop-blur-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <IconChip tone="warn" size="md">
              <ShieldAlert />
            </IconChip>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="admin-backoffice-title" className="text-xl font-bold tracking-tight text-white">
                  Console d'Administration & Modération
                </h2>
                <Badge tone="warn">SUPERVISEUR</Badge>
              </div>
              <p id="admin-backoffice-description" className="text-xs text-mist-400">
                Supervision pédagogique, éthique et analytics d'impact en temps réel (§43, §45, §46)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              aria-label="Actualiser les indicateurs"
            >
              <RotateCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-4 flex gap-2 overflow-x-auto border-t border-white/5 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeTab === 'analytics'
                ? 'bg-brand-500/20 text-brand-300 ring-1 ring-brand-400/30'
                : 'text-mist-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <BarChart3 className="size-4" />
            <span>Impact & KPIs (§46)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('moderation')}
            className={`relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeTab === 'moderation'
                ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/30'
                : 'text-mist-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <ShieldCheck className="size-4" />
            <span>File de Modération (§43)</span>
            {pendingCount > 0 && (
              <span className="grid size-5 place-items-center rounded-full bg-amber-500 text-[10px] font-bold text-night-950">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('citizens')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeTab === 'citizens'
                ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/30'
                : 'text-mist-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Users className="size-4" />
            <span>Citoyens & Bourses (§45)</span>
          </button>
        </div>
      </div>

      {/* Modal Content */}
      <div className="max-h-[70vh] overflow-y-auto p-5 space-y-6">
        {/* ========================================================= */}
        {/* TAB 1: ANALYTICS D'IMPACT PÉDAGOGIQUE (§46)               */}
        {/* ========================================================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Health index card */}
            <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-night-900 to-brand-950/40 p-5 shadow-inner">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-emerald-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                      Indice Global de Santé Économique & Inclusion
                    </span>
                  </div>
                  <h3 className="mt-1 text-2xl font-black tracking-tight text-white">
                    {overview.economicHealthScore} / 100
                  </h3>
                  <p className="mt-0.5 text-xs text-mist-300">
                    Calculé en temps réel selon le taux d'épargne citoyenne, la réussite aux formations et la vitalité entrepreneuriale.
                  </p>
                </div>
                <div className="w-full md:w-56 space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-mist-400">Résilience globale</span>
                    <span className="text-emerald-300 font-bold">
                      {overview.economicHealthScore >= 80 ? 'Excellente' : 'En progrès'}
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-night-950 border border-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                      style={{ width: `${overview.economicHealthScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-mist-400">Masse Monétaire</span>
                  <Coins className="size-4 text-amber-400" />
                </div>
                <div className="mt-2 text-xl font-bold text-white">
                  {formatNumber(overview.totalMoneyCirculation)} <span className="text-xs text-amber-400">MGA</span>
                </div>
                <div className="mt-1 text-[11px] text-mist-400">
                  Épargne mobilisée : <strong className="text-mist-200">{formatNumber(overview.totalSavings)} MGA</strong>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-mist-400">Citoyens Actifs</span>
                  <Users className="size-4 text-cyan-400" />
                </div>
                <div className="mt-2 text-xl font-bold text-white">{overview.totalCitizens}</div>
                <div className="mt-1 text-[11px] text-mist-400">
                  Richesse moy. : <strong className="text-mist-200">{formatNumber(overview.avgWealth)} MGA</strong>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-mist-400">Formations Réussies</span>
                  <GraduationCap className="size-4 text-emerald-400" />
                </div>
                <div className="mt-2 text-xl font-bold text-white">{overview.totalCompletedCourses}</div>
                <div className="mt-1 text-[11px] text-mist-400">
                  Certifications : <strong className="text-emerald-300">{overview.totalCertifications} délivrées</strong>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-mist-400">Écosystème Startup</span>
                  <Rocket className="size-4 text-brand-400" />
                </div>
                <div className="mt-2 text-xl font-bold text-white">{overview.totalStartups}</div>
                <div className="mt-1 text-[11px] text-mist-400">
                  Subventionnées : <strong className="text-brand-300">{overview.fundedStartups} incubées</strong>
                </div>
              </div>
            </div>

            {/* Impact Details Panels */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-night-900/60 p-4 space-y-3">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Award className="size-4 text-brand-400" />
                  <span>Engagement Communautaire & Hackathons</span>
                </h4>
                <div className="space-y-2 text-xs text-mist-300">
                  <div className="flex justify-between border-b border-white/5 py-1.5">
                    <span>Participations aux Hackathons 48h</span>
                    <strong className="text-white">{overview.totalHackathonParticipations} équipes</strong>
                  </div>
                  <div className="flex justify-between border-b border-white/5 py-1.5">
                    <span>Guildes thématiques actives</span>
                    <strong className="text-white">{overview.totalGuilds} guildes</strong>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span>Dossiers de modération traités</span>
                    <strong className="text-emerald-400">{overview.resolvedReports} clôturés</strong>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-night-900/60 p-4 space-y-3">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Coins className="size-4 text-amber-400" />
                  <span>Règle Pédagogique d'Inclusion (§46)</span>
                </h4>
                <p className="text-xs leading-relaxed text-mist-300">
                  Youth City n'intègre aucun mécanisme de casino, de pay-to-win ni de monnaie réelle. Tous les MGA sont des points d'apprentissage simulant le coût de la vie à Antananarivo pour former les jeunes à la prévoyance et à l'autonomie.
                </p>
                <div className="rounded-lg bg-white/[0.03] p-2.5 text-[11px] text-amber-300 border border-amber-500/20">
                  💡 Objectif pédagogique : encourager le passage de l'aide temporaire vers des revenus durables via le Campus District et le travail.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: FILE DE MODÉRATION CITOYENNE (§43)                 */}
        {/* ========================================================= */}
        {activeTab === 'moderation' && (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">
                  Signalements Citoyens & Modération Bienveillante
                </h3>
                <p className="text-xs text-mist-400">
                  Traitez les signalements éthiques pour garantir un environnement inclusif et respectueux.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReportForm(!showReportForm)}
                >
                  <AlertTriangle className="size-3.5 text-amber-400" />
                  <span>{showReportForm ? 'Fermer le formulaire' : 'Nouveau Signalement Test'}</span>
                </Button>
              </div>
            </div>

            {/* Test report creation form */}
            {showReportForm && (
              <form
                onSubmit={handleSubmitNewReport}
                className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-3 animate-fade-in"
              >
                <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                  Déposer un signalement (Simulation citoyenne)
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="text-[11px] text-mist-400 block mb-1">Motif</label>
                    <select
                      value={newReason}
                      onChange={(e) => setNewReason(e.target.value as ModerationReason)}
                      className={controlClass}
                    >
                      <option value="spam">Spam / Pub non autorisée</option>
                      <option value="harassment">Harcèlement ou propos haineux</option>
                      <option value="inappropriate">Contenu inapproprié</option>
                      <option value="fraud">Fraude économique simulée</option>
                      <option value="other">Autre manquement éthique</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-mist-400 block mb-1">Cible concernée</label>
                    <input
                      type="text"
                      value={newTargetName}
                      onChange={(e) => setNewTargetName(e.target.value)}
                      placeholder="Nom du canal, projet ou citoyen"
                      className={controlClass}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-mist-400 block mb-1">Type de cible</label>
                    <select
                      value={newTargetType}
                      onChange={(e) => setNewTargetType(e.target.value)}
                      className={controlClass}
                    >
                      <option value="chat_message">Message Chat / Entraide</option>
                      <option value="project_pitch">Pitch Projet Startup</option>
                      <option value="citizen_profile">Profil Joueur</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-mist-400 block mb-1">Description des faits constatés</label>
                  <textarea
                    value={newDetails}
                    onChange={(e) => setNewDetails(e.target.value)}
                    placeholder="Expliquez clairement le comportement non conforme..."
                    rows={2}
                    className={controlClass}
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="ghost" size="sm" type="button" onClick={() => setShowReportForm(false)}>
                    Annuler
                  </Button>
                  <Button variant="primary" size="sm" type="submit">
                    <Send className="size-3.5" />
                    <span>Transmettre le signalement</span>
                  </Button>
                </div>
              </form>
            )}

            {/* Filter buttons */}
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Filter className="size-3.5 text-mist-400" />
              <span className="text-xs text-mist-400">Filtrer :</span>
              {(['all', 'pending', 'investigating', 'resolved', 'dismissed'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                    statusFilter === st
                      ? 'bg-white/10 text-white font-medium'
                      : 'text-mist-400 hover:text-white'
                  }`}
                >
                  {st === 'all' ? 'Tous' : STATUS_LABELS[st].label}
                </button>
              ))}
            </div>

            {/* Reports List */}
            {filteredReports.length === 0 ? (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center text-sm text-mist-400">
                <CheckCircle2 className="mx-auto size-8 text-emerald-400 mb-2" />
                Aucun signalement dans cette file.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReports.map((report) => {
                  const reasonInfo = REASON_LABELS[report.reason] || { label: report.reason, tone: 'neutral' as BadgeTone };
                  const statusInfo = STATUS_LABELS[report.status] || { label: report.status, tone: 'neutral' as BadgeTone };
                  const actionInfo = ACTION_LABELS[report.actionTaken] || { label: report.actionTaken, color: 'text-mist-400' };

                  return (
                    <div
                      key={report.id}
                      className="rounded-xl border border-white/10 bg-night-900/80 p-4 space-y-3 transition-colors hover:border-white/20"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono text-mist-400">#{report.id}</span>
                          <Badge tone={reasonInfo.tone}>{reasonInfo.label}</Badge>
                          <Badge tone={statusInfo.tone}>{statusInfo.label}</Badge>
                          <span className="text-xs font-medium text-white">{report.targetName}</span>
                          <span className="text-[11px] text-mist-400">({report.targetType})</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-mist-400">
                          <Clock className="size-3" />
                          <span>{report.createdAt}</span>
                          <span>• par {report.reporterName}</span>
                        </div>
                      </div>

                      <p className="text-xs leading-relaxed text-mist-200 bg-black/30 p-2.5 rounded-lg border border-white/5">
                        "{report.details}"
                      </p>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs pt-1">
                        <div className="text-mist-400">
                          Sanction : <span className={actionInfo.color}>{actionInfo.label}</span>
                          {report.moderatorNotes && (
                            <span className="block text-[11px] text-mist-300 italic">
                              Note modérateur : {report.moderatorNotes}
                            </span>
                          )}
                        </div>

                        {report.status !== 'resolved' && report.status !== 'dismissed' && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleActionClick(report.id, 'warning', 'resolved')}
                            >
                              <AlertTriangle className="size-3 text-amber-400" />
                              <span>Avertir</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleActionClick(report.id, 'quarantine', 'resolved')}
                            >
                              Quarantaine
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleActionClick(report.id, 'ban', 'resolved')}
                            >
                              <Ban className="size-3 text-rose-400" />
                              <span>Suspendre</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleActionClick(report.id, 'none', 'dismissed')}
                            >
                              Classer sans suite
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: CITOYENS & BOURSES ADMINISTRATIVES (§45)            */}
        {/* ========================================================= */}
        {activeTab === 'citizens' && (
          <div className="space-y-6">
            {/* Grant Stipend Form */}
            <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 via-night-900 to-night-950 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Coins className="size-4 text-cyan-400" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-cyan-300">
                  Octroi d'une Bourse Administrative Citoyenne (§45)
                </h3>
              </div>
              <p className="text-xs text-mist-300">
                Allouez des bourses d'encouragement ou des subventions d'urgence pour soutenir l'effort d'un citoyen ou encourager un parcours méritant.
              </p>

              <form onSubmit={handleGrantStipend} className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="text-[11px] text-mist-400 block mb-1">Citoyen Bénéficiaire</label>
                    <select
                      value={stipendRecipientId}
                      onChange={(e) => setStipendRecipientId(e.target.value)}
                      className={controlClass}
                    >
                      <option value={String(citizen.id)}>{citizen.name} (Joueur Actuel - Niv. {citizen.level})</option>
                      {(adminOverview?.recentCitizens || [])
                        .filter((c) => String(c.id) !== String(citizen.id))
                        .map((c) => (
                          <option key={c.id} value={String(c.id)}>
                            {c.name} (Niv. {c.level} - {c.title})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-mist-400 block mb-1">Montant de la bourse (MGA)</label>
                    <input
                      type="number"
                      step={5000}
                      min={5000}
                      value={stipendAmount}
                      onChange={(e) => setStipendAmount(Number(e.target.value))}
                      className={controlClass}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-mist-400 block mb-1">Motif Pédagogique</label>
                    <input
                      type="text"
                      value={stipendReason}
                      onChange={(e) => setStipendReason(e.target.value)}
                      placeholder="Motif de l'encouragement"
                      className={controlClass}
                      required
                    />
                  </div>
                </div>

                {/* Quick preset buttons */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-mist-400">Montants rapides :</span>
                  {[25000, 50000, 100000, 200000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setStipendAmount(amt)}
                      className={`rounded px-2.5 py-1 text-xs border transition-colors ${
                        stipendAmount === amt
                          ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 font-semibold'
                          : 'border-white/10 bg-white/5 text-mist-300 hover:text-white'
                      }`}
                    >
                      {formatNumber(amt)} MGA
                    </button>
                  ))}
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    disabled={isSubmittingStipend}
                  >
                    <Coins className="size-3.5" />
                    <span>Accorder la Bourse de {formatNumber(stipendAmount)} MGA</span>
                  </Button>
                </div>
              </form>
            </div>

            {/* Recent citizens overview */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white">
                Citoyens Récents & Situation Économique
              </h4>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {/* Active player card */}
                <div className="rounded-xl border border-brand-500/40 bg-brand-950/20 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-white text-sm">{citizen.name}</h5>
                      <span className="text-xs text-brand-300 font-medium">Niveau {citizen.level} • {citizen.title}</span>
                    </div>
                    <Badge tone="brand">ACTIF</Badge>
                  </div>
                  <div className="text-xs space-y-1 text-mist-300 pt-1 border-t border-white/5">
                    <div className="flex justify-between">
                      <span>Trésorerie</span>
                      <strong className="text-amber-400">{formatNumber(citizen.money)} MGA</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Épargne</span>
                      <strong className="text-mist-200">{formatNumber(citizen.savings)} MGA</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Jour & Temps</span>
                      <strong className="text-mist-200">Jour {day}</strong>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => {
                      setStipendRecipientId(String(citizen.id));
                      setStipendAmount(50000);
                      const parsedId = Number(citizen.id);
                      grantAdminStipend({
                        characterId: isNaN(parsedId) ? undefined : parsedId,
                        amount: 50000,
                        reason: "Bourse d'encouragement pédagogique direct",
                      });
                    }}
                  >
                    +50 000 MGA (Aide directe)
                  </Button>
                </div>

                {/* Additional citizens */}
                {(adminOverview?.recentCitizens || [])
                  .filter((c) => String(c.id) !== String(citizen.id))
                  .map((cit) => (
                    <div key={cit.id} className="rounded-xl border border-white/10 bg-night-900/60 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-bold text-white text-sm">{cit.name}</h5>
                          <span className="text-xs text-mist-400">Niveau {cit.level} • {cit.title}</span>
                        </div>
                        <Badge tone="neutral">{cit.currentJob}</Badge>
                      </div>
                      <div className="text-xs space-y-1 text-mist-300 pt-1 border-t border-white/5">
                        <div className="flex justify-between">
                          <span>Trésorerie</span>
                          <strong className="text-amber-400">{formatNumber(cit.money)} MGA</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Épargne</span>
                          <strong className="text-mist-200">{formatNumber(cit.savings)} MGA</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Formations suivies</span>
                          <strong className="text-emerald-400">{cit.completedCoursesCount} validées</strong>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => {
                          grantAdminStipend({
                            characterId: cit.id,
                            amount: 50000,
                            reason: `Bourse de soutien pour ${cit.name}`,
                          });
                        }}
                      >
                        +50 000 MGA (Aide)
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Footer */}
      <div className="border-t border-white/10 bg-night-950 px-5 py-3 flex items-center justify-between text-xs text-mist-400">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Système de modération actif • Traçabilité auditable</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => toggleAdminModal(false)}>
          Fermer la console
        </Button>
      </div>
    </Modal>
  );
};
