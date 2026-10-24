import React, { useState, useEffect } from 'react';
import {
  Users,
  Trophy,
  Award,
  Sparkles,
  CheckCircle2,
  Code,
  Palette,
  Rocket,
  TrendingUp,
  Leaf,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  DollarSign,
  Crown,
  MessageSquare,
  Send,
  Search,
  ArrowUpRight,
} from 'lucide-react';
import { useGameStore } from '../../stores/useGameStore';
import { formatNumber } from '../../lib/format';
import { api } from '../../services/api';
import { DEFAULT_CITIZEN_DIRECTORY, DEFAULT_CITIZEN_MESSAGES } from '../../data/mockData';
import type { Hackathon, DirectoryCitizen, CitizenMessage } from '../../types/game';

const GUILD_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Code,
  Palette,
  Rocket,
  TrendingUp,
  Leaf,
  Users,
};

export const CityHubView: React.FC = () => {
  const {
    citizen,
    guilds,
    hackathons,
    leaderboard,
    joinGuild,
    leaveGuild,
    participateHackathon,
    setActiveTab,
    addNotification,
  } = useGameStore();

  const [activeSubTab, setActiveSubTab] = useState<'guilds' | 'hackathons' | 'leaderboard' | 'directory'>('guilds');
  const [selectedHackathon, setSelectedHackathon] = useState<Hackathon | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Annuaire & Messagerie Directe (§29)
  const [directoryCitizens, setDirectoryCitizens] = useState<DirectoryCitizen[]>(DEFAULT_CITIZEN_DIRECTORY);
  const [messages, setMessages] = useState<CitizenMessage[]>(DEFAULT_CITIZEN_MESSAGES);
  const [selectedContact, setSelectedContact] = useState<DirectoryCitizen | null>(
    DEFAULT_CITIZEN_DIRECTORY.find((c) => !c.isMe) || null
  );
  const [messageInput, setMessageInput] = useState('');
  const [contextTag, setContextTag] = useState<'collaboration' | 'mentoring' | 'guild' | 'general'>('collaboration');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    let mounted = true;
    api.getCitizenDirectory()
      .then((data) => {
        if (mounted && Array.isArray(data) && data.length > 0) {
          setDirectoryCitizens(data);
          setSelectedContact((prev) => prev || data.find((c) => !c.isMe) || data[0]);
        }
      })
      .catch(() => {});

    api.getCitizenMessages()
      .then((data) => {
        if (mounted && Array.isArray(data) && data.length > 0) {
          setMessages(data);
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const handleSelectContact = (peer: DirectoryCitizen) => {
    setSelectedContact(peer);
    api.getCitizenMessages(peer.id)
      .then((thread) => {
        if (Array.isArray(thread) && thread.length > 0) {
          setMessages((prev) => {
            const others = prev.filter((m) => m.senderId !== peer.id && m.recipientId !== peer.id);
            return [...others, ...thread];
          });
        }
      })
      .catch(() => {});

    setDirectoryCitizens((prev) =>
      prev.map((c) => (c.id === peer.id ? { ...c, unreadMessagesCount: 0 } : c))
    );
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedContact || isSending) return;

    const content = messageInput.trim();
    setIsSending(true);

    try {
      const res = await api.sendCitizenMessage({
        recipientId: selectedContact.id,
        content,
        contextTag,
      });

      if (res && !('error' in res) && res.success && res.message) {
        setMessages((prev) => [...prev, res.message]);
        const reply = res.autoReply;
        if (reply) {
          setMessages((prev) => [...prev, reply]);
          addNotification(
            `Message de ${selectedContact.name}`,
            reply.content.slice(0, 60) + '...',
            'info'
          );
        } else {
          addNotification('Message envoyé', 'Ton message citoyen a été transmis.', 'success');
        }
        setMessageInput('');
      } else {
        // Fallback local
        const myCitizenId = typeof citizen.id === 'number' ? citizen.id : (Number(citizen.id) || 1);
        const localSent: CitizenMessage = {
          id: Date.now(),
          senderId: myCitizenId,
          senderName: citizen.name,
          senderAvatar: citizen.avatarSeed,
          recipientId: selectedContact.id,
          recipientName: selectedContact.name,
          content,
          contextTag,
          isRead: true,
          createdAt: 'À l\'instant',
          isFromMe: true,
        };
        const localReply: CitizenMessage = {
          id: Date.now() + 1,
          senderId: selectedContact.id,
          senderName: selectedContact.name,
          senderAvatar: selectedContact.avatarSeed,
          recipientId: myCitizenId,
          recipientName: citizen.name,
          content: `Salut ${citizen.name} ! Bien reçu ton message. Travaillons ensemble sur notre prochain projet au City Hub !`,
          contextTag,
          isRead: false,
          createdAt: 'À l\'instant',
          isFromMe: false,
        };
        setMessages((prev) => [...prev, localSent, localReply]);
        setMessageInput('');
        addNotification('Message envoyé', 'Ton message citoyen a été transmis.', 'success');
      }
    } catch {
      addNotification('Message envoyé', 'Enregistré localement.', 'info');
    } finally {
      setIsSending(false);
    }
  };

  const totalUnread = directoryCitizens.reduce((acc, c) => acc + (c.unreadMessagesCount || 0), 0);

  const filteredCitizens = directoryCitizens.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesQ =
      c.name.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.guildName.toLowerCase().includes(q);

    if (!matchesQ) return false;
    if (filterCat === 'all') return true;
    if (filterCat === 'tech') return c.guildName.toLowerCase().includes('dev') || c.title.toLowerCase().includes('tech') || c.title.toLowerCase().includes('dév');
    if (filterCat === 'design') return c.guildName.toLowerCase().includes('design') || c.title.toLowerCase().includes('design');
    if (filterCat === 'finance') return c.guildName.toLowerCase().includes('finance') || c.title.toLowerCase().includes('compt');
    if (filterCat === 'social') return c.guildName.toLowerCase().includes('impact') || c.guildName.toLowerCase().includes('green') || c.title.toLowerCase().includes('social');
    return true;
  });

  const threadMessages = selectedContact
    ? messages.filter((m) => m.senderId === selectedContact.id || m.recipientId === selectedContact.id)
    : [];

  // Hackathon Modal state
  const [teamName, setTeamName] = useState(`Team ${citizen.name}`);
  const [submissionPitch, setSubmissionPitch] = useState('');
  const [modalError, setModalError] = useState('');

  const myGuild = guilds.find((g) => g.isJoined);

  const handleJoinGuild = async (guildKey: string) => {
    setIsSubmitting(true);
    await joinGuild(guildKey);
    setIsSubmitting(false);
  };

  const handleLeaveGuild = async (guildKey: string) => {
    setIsSubmitting(true);
    await leaveGuild(guildKey);
    setIsSubmitting(false);
  };

  const handleHackathonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHackathon) return;
    setModalError('');

    if (submissionPitch.trim().length < 15) {
      setModalError('Le pitch de votre projet doit faire au moins 15 caractères.');
      return;
    }
    if (citizen.energy < 20) {
      setModalError('Énergie insuffisante pour un sprint de 48h (min. 20%). Repose-toi au Foyer !');
      return;
    }

    setIsSubmitting(true);
    const res = await participateHackathon(selectedHackathon.key || selectedHackathon.id, {
      teamName: teamName.trim() || `Team ${citizen.name}`,
      submissionPitch: submissionPitch.trim(),
      teamMembers: [
        `${citizen.name} (Team Lead & Dev)`,
        'Aina R. (UI/UX Designer)',
        'Hery T. (Business & Pitch)',
      ],
    });
    setIsSubmitting(false);

    if (res.success) {
      setSelectedHackathon(null);
      setSubmissionPitch('');
    } else if (res.error) {
      setModalError(res.error);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-iris-500/20 bg-linear-to-br from-iris-950/40 via-surface-900 to-surface-950 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-iris-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 h-48 w-48 rounded-full bg-brand-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-iris-400/30 bg-iris-500/10 text-xs font-semibold text-iris-300">
              <Users className="h-3.5 w-3.5" />
              <span>City Hub & Dimension Sociale (§13, §30, §31, §33)</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Guildes Métiers & Hackathons d'Équipe
            </h1>
            <p className="text-sm md:text-base text-mist-300 max-w-2xl leading-relaxed">
              Découvre la force du collectif : adhère à une communauté thématique pour accélérer ton apprentissage,
              relève des défis collaboratifs de 48h et monte dans le classement citoyen bienveillant de Youth City.
            </p>
          </div>

          {/* Active Guild Badge in Header */}
          {myGuild && (
            <div className="p-4 rounded-2xl border border-iris-500/30 bg-iris-500/10 backdrop-blur-md flex items-center gap-3 shrink-0">
              <div className="p-2.5 rounded-xl bg-iris-500/20 text-iris-300">
                {(() => {
                  const Icon = GUILD_ICONS[myGuild.icon] || Users;
                  return <Icon className="h-5 w-5" />;
                })()}
              </div>
              <div>
                <div className="text-[11px] font-semibold text-iris-400 uppercase tracking-wider">Ta Guilde Active</div>
                <div className="text-sm font-bold text-white">{myGuild.name}</div>
                <div className="text-[11px] text-gain-400 font-medium">+{myGuild.xpBonusPercent}% XP bonus</div>
              </div>
            </div>
          )}
        </div>

        {/* Subtabs Switcher */}
        <div className="mt-8 pt-5 border-t border-white/[0.08] flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveSubTab('guilds')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
              activeSubTab === 'guilds'
                ? 'border-iris-500/50 bg-iris-500/20 text-iris-200 shadow-sm'
                : 'border-white/[0.06] bg-white/[0.02] text-mist-400 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Guildes Métiers ({guilds.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('hackathons')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
              activeSubTab === 'hackathons'
                ? 'border-iris-500/50 bg-iris-500/20 text-iris-200 shadow-sm'
                : 'border-white/[0.06] bg-white/[0.02] text-mist-400 hover:text-white'
            }`}
          >
            <Trophy className="h-4 w-4" />
            <span>Hackathons 48h ({hackathons.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('leaderboard')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
              activeSubTab === 'leaderboard'
                ? 'border-iris-500/50 bg-iris-500/20 text-iris-200 shadow-sm'
                : 'border-white/[0.06] bg-white/[0.02] text-mist-400 hover:text-white'
            }`}
          >
            <Award className="h-4 w-4" />
            <span>Classement Citoyen</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('directory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
              activeSubTab === 'directory'
                ? 'border-iris-500/50 bg-iris-500/20 text-iris-200 shadow-sm'
                : 'border-white/[0.06] bg-white/[0.02] text-mist-400 hover:text-white'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Annuaire &amp; Messagerie (§29)</span>
            {totalUnread > 0 && (
              <span className="rounded-full bg-brand-500 px-1.5 py-0.2 text-3xs font-extrabold text-white animate-pulse">
                {totalUnread}
              </span>
            )}
          </button>
        </div>
      </section>

      {/* --- SUBTAB 1: GUILDES THÉMATIQUES (§30) --- */}
      {activeSubTab === 'guilds' && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Communautés & Guildes Professionnelles</h2>
              <p className="text-xs text-mist-400">Rejoindre une guilde t'accorde des bonus d'apprentissage permanents.</p>
            </div>
            <div className="text-xs text-mist-400">
              {myGuild ? (
                <span className="text-iris-300 font-semibold">1 adhésion active</span>
              ) : (
                <span className="text-amber-400 font-semibold">Aucune guilde rejointe</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guilds.map((guild) => {
              const Icon = GUILD_ICONS[guild.icon] || Users;
              const isCurrent = guild.isJoined;

              return (
                <div
                  key={guild.id || guild.key}
                  className={`p-6 rounded-2xl border transition-all flex flex-col justify-between gap-5 backdrop-blur-md relative overflow-hidden ${
                    isCurrent
                      ? 'border-iris-500/50 bg-linear-to-br from-iris-950/40 to-surface-900 shadow-lg shadow-iris-500/10'
                      : 'border-white/[0.08] bg-surface-900/60 hover:border-white/[0.15]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="p-3 rounded-xl bg-iris-500/10 border border-iris-500/20 text-iris-300">
                        <Icon className="h-6 w-6" />
                      </div>
                      {isCurrent ? (
                        <span className="px-2.5 py-1 rounded-full bg-gain-500/20 border border-gain-500/30 text-gain-300 font-bold text-[10px] flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Membre Actif
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-mist-400 flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {guild.memberCount} membres
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white">{guild.name}</h3>
                      <p className="text-xs italic text-iris-400/90 mt-0.5">"{guild.motto}"</p>
                    </div>

                    <p className="text-xs text-mist-300 leading-relaxed">
                      {guild.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/[0.06] space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-mist-400">Bonus de progression :</span>
                      <span className="font-bold text-gain-400">+{guild.xpBonusPercent}% XP</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-mist-400">Badge débloqué :</span>
                      <span className="font-semibold text-iris-300 flex items-center gap-1">
                        <Award className="h-3.5 w-3.5" />
                        {guild.badgeReward}
                      </span>
                    </div>

                    {isCurrent ? (
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleLeaveGuild(guild.key || guild.id)}
                        className="w-full py-2.5 px-4 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold text-xs transition-all cursor-pointer"
                      >
                        Quitter la guilde
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleJoinGuild(guild.key || guild.id)}
                        className="w-full py-2.5 px-4 rounded-xl bg-iris-600 hover:bg-iris-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-iris-600/20 cursor-pointer"
                      >
                        <span>{myGuild ? 'Changer pour cette guilde' : 'Rejoindre la guilde (+50 XP)'}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* --- SUBTAB 2: HACKATHONS & CHALLENGES COLLABORATIFS (§13, §31) --- */}
      {activeSubTab === 'hackathons' && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Hackathons 48h & Défis Inter-Quartiers</h2>
              <p className="text-xs text-mist-400">Monte une équipe pluridisciplinaire, soumets votre prototype et remporte des primes en Ariary.</p>
            </div>
            <div className="text-xs text-mist-400">
              <span className="text-brand-300 font-semibold">{citizen.completedChallenges} défis complétés</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {hackathons.map((hackathon) => {
              const part = hackathon.myParticipation;

              return (
                <div
                  key={hackathon.id || hackathon.key}
                  className={`p-6 rounded-2xl border transition-all flex flex-col justify-between gap-5 backdrop-blur-md relative overflow-hidden ${
                    part
                      ? 'border-gain-500/40 bg-surface-900/90 shadow-xl'
                      : 'border-white/[0.08] bg-surface-900/60 hover:border-white/[0.15]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-3 py-1 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-[11px] font-bold">
                        {hackathon.theme}
                      </span>
                      <span className="text-xs text-mist-400 flex items-center gap-1 shrink-0">
                        <Clock className="h-3.5 w-3.5 text-amber-400" />
                        {hackathon.durationHours}h sprint
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white">{hackathon.title}</h3>
                      <p className="text-xs text-mist-300 leading-relaxed mt-2">
                        {hackathon.description}
                      </p>
                    </div>

                    {/* Criteria Tags */}
                    <div className="pt-2">
                      <div className="text-[11px] font-semibold text-mist-400 mb-1.5">Critères du jury :</div>
                      <div className="flex flex-wrap gap-1.5">
                        {hackathon.evaluationCriteria.map((crit, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-surface-950 border border-white/[0.06] text-[10px] text-mist-300"
                          >
                            {crit}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/[0.06] space-y-3">
                    {/* Prize pool stats */}
                    <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-surface-950/60 border border-white/[0.04]">
                      <div>
                        <div className="text-[10px] text-mist-400 uppercase font-medium">Récompense XP</div>
                        <div className="text-sm font-extrabold text-brand-300 flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5" />
                          +{hackathon.xpPool} XP
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-mist-400 uppercase font-medium">Prix d'Équipe</div>
                        <div className="text-sm font-extrabold text-gain-300 flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5" />
                          {formatNumber(hackathon.prizeMoney)} MGA
                        </div>
                      </div>
                    </div>

                    {part ? (
                      <div className="p-3 rounded-xl border border-gain-500/30 bg-gain-500/10 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white">{part.teamName}</span>
                          <span className="font-extrabold text-gain-300">{part.score}/100</span>
                        </div>
                        <p className="text-[11px] text-mist-300 leading-tight">
                          "{part.feedback}"
                        </p>
                        <div className="text-[10px] font-semibold text-gain-400 pt-1">
                          ✓ Gains perçus : +{part.awardedXp} XP | +{formatNumber(part.awardedMoney)} MGA
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedHackathon(hackathon);
                          setModalError('');
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-linear-to-r from-brand-500 to-iris-600 hover:from-brand-400 hover:to-iris-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-brand-500/20 cursor-pointer"
                      >
                        <Trophy className="h-4 w-4" />
                        <span>Participer avec une équipe (48h)</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* --- SUBTAB 3: CLASSEMENT BIENVEILLANT (§33) --- */}
      {activeSubTab === 'leaderboard' && (
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Classements Citoyens & Émulation Positive</h2>
            <p className="text-xs text-mist-400">
              Conformément au cahier des charges (§33), ces classements thématiques valorisent l'entraide,
              les compétences et la rigueur d'épargne sans pression anxiogène.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Citizens by XP & Impact */}
            <div className="p-6 rounded-2xl border border-white/[0.08] bg-surface-900/80 backdrop-blur-md shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-400" />
                  <span>Citoyens les Plus Actifs (XP & Accomplissements)</span>
                </h3>
                <span className="text-xs text-mist-400">Antananarivo</span>
              </div>

              <div className="space-y-2">
                {(leaderboard?.topCitizens || [
                  { id: 1, name: citizen.name, title: citizen.title, level: citizen.level, xp: citizen.xp, completedChallenges: citizen.completedChallenges, completedProjects: citizen.completedProjects, savings: citizen.savings },
                  { id: 2, name: 'Aina Razafy', title: 'Designer Senior UI/UX', level: 6, xp: 2150, completedChallenges: 4, completedProjects: 2, savings: 350000 },
                  { id: 3, name: 'Hery Andria', title: 'Développeur Fullstack', level: 5, xp: 1840, completedChallenges: 3, completedProjects: 1, savings: 280000 },
                  { id: 4, name: 'Mialy Rakoto', title: 'Porteuse de Projet AgriTech', level: 4, xp: 1420, completedChallenges: 2, completedProjects: 1, savings: 190000 },
                ]).map((cit, idx) => (
                  <div
                    key={cit.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      cit.name === citizen.name
                        ? 'border-brand-500/40 bg-brand-500/10 text-white font-bold'
                        : 'border-white/[0.04] bg-surface-950/40 text-mist-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`h-6 w-6 rounded-full flex items-center justify-center font-extrabold text-[11px] ${
                        idx === 0 ? 'bg-amber-400 text-surface-950' : idx === 1 ? 'bg-slate-300 text-surface-950' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-surface-800 text-mist-400'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{cit.name}</span>
                          {cit.name === citizen.name && (
                            <span className="px-1.5 py-0.2 rounded-md bg-brand-500/20 text-brand-300 text-[10px]">Toi</span>
                          )}
                        </div>
                        <div className="text-[11px] text-mist-400">{cit.title} &bull; Niv. {cit.level}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-extrabold text-brand-300">{formatNumber(cit.xp)} XP</div>
                      <div className="text-[10px] text-mist-500">{cit.completedChallenges} défis réussis</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Guilds */}
            <div className="p-6 rounded-2xl border border-white/[0.08] bg-surface-900/80 backdrop-blur-md shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-iris-400" />
                  <span>Guildes les Plus Engagées</span>
                </h3>
                <span className="text-xs text-mist-400">Communautés</span>
              </div>

              <div className="space-y-2">
                {(leaderboard?.topGuilds || guilds.map(g => ({
                  id: g.key,
                  name: g.name,
                  category: g.category,
                  memberCount: g.memberCount,
                  motto: g.motto,
                }))).map((gld, idx) => (
                  <div
                    key={gld.id}
                    className="p-3.5 rounded-xl border border-white/[0.04] bg-surface-950/40 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-6 w-6 rounded-full bg-iris-500/20 text-iris-300 flex items-center justify-center font-bold text-[11px]">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-white">{gld.name}</div>
                        <div className="text-[11px] text-mist-400 italic">"{gld.motto}"</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-iris-300">{gld.memberCount} membres</div>
                      <div className="text-[10px] text-gain-400">Activité forte</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* --- SUBTAB 4: ANNUAIRE CITOYEN & MESSAGERIE DIRECTE (§29) --- */}
      {activeSubTab === 'directory' && (
        <section className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">Annuaire Citoyen &amp; Messagerie Sociale Directe</h2>
                <span className="rounded-full bg-iris-500/20 px-2 py-0.5 text-3xs font-bold text-iris-300">§29</span>
              </div>
              <p className="text-xs text-mist-400 max-w-2xl mt-1">
                Favorise l'apprentissage collaboratif et l'émulation positive : contacte tes pairs, constitue une équipe pluridisciplinaire et partage des recommandations sans les dérives des réseaux traditionnels.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-mist-400">
                <strong className="text-white">{filteredCitizens.length}</strong> citoyen(s) répertorié(s)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Colonne Gauche : Annuaire Citoyen */}
            <div className="lg:col-span-5 space-y-4">
              {/* Barre de recherche et filtres thématiques */}
              <div className="p-4 rounded-2xl border border-white/[0.08] bg-surface-900/80 backdrop-blur-md space-y-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist-500" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, rôle ou spécialité..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-white/[0.08] bg-surface-950 text-white placeholder-mist-600 text-xs focus:outline-hidden focus:border-iris-500"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 text-2xs">
                  {[
                    { key: 'all', label: 'Tous' },
                    { key: 'tech', label: 'Tech' },
                    { key: 'design', label: 'Design' },
                    { key: 'finance', label: 'Finance' },
                    { key: 'social', label: 'Social & Green' },
                  ].map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setFilterCat(cat.key)}
                      className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        filterCat === cat.key
                          ? 'border-iris-400/50 bg-iris-500/20 text-iris-200 font-bold'
                          : 'border-white/[0.06] bg-white/[0.02] text-mist-400 hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Liste scrollable des citoyens de l'annuaire */}
              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {filteredCitizens.map((peer) => {
                  const isSelected = selectedContact?.id === peer.id;
                  return (
                    <div
                      key={peer.id}
                      onClick={() => handleSelectContact(peer)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-iris-400/60 bg-iris-500/15 shadow-lg shadow-iris-950/40'
                          : 'border-white/[0.06] bg-surface-900/60 hover:border-white/[0.12] hover:bg-surface-900'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-linear-to-br from-iris-600/30 to-brand-600/30 border border-white/[0.1] flex items-center justify-center font-bold text-white text-sm shrink-0">
                            {peer.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{peer.name}</span>
                              {peer.isMe && (
                                <span className="rounded bg-brand-500/20 px-1.5 py-0.2 text-3xs font-semibold text-brand-300">Moi</span>
                              )}
                              <span className="text-2xs text-warn-400 font-bold">Niv. {peer.level}</span>
                            </div>
                            <p className="text-xs text-mist-400 line-clamp-1">{peer.title}</p>
                          </div>
                        </div>

                        {peer.unreadMessagesCount > 0 && (
                          <span className="rounded-full bg-brand-500 px-2 py-0.5 text-3xs font-extrabold text-white animate-pulse shrink-0">
                            {peer.unreadMessagesCount} non-lu
                          </span>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-white/[0.04] flex items-center justify-between text-2xs text-mist-400">
                        <span className="flex items-center gap-1 text-iris-300 font-medium">
                          <Users className="h-3 w-3" />
                          {peer.guildName}
                        </span>
                        <span>{peer.certificationsCount} certif(s)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Colonne Droite : Fil de Conversation & Envoi */}
            <div className="lg:col-span-7">
              {selectedContact ? (
                <div className="rounded-2xl border border-white/[0.08] bg-surface-900/90 backdrop-blur-md flex flex-col h-[660px] shadow-2xl overflow-hidden">
                  {/* Header Contact */}
                  <div className="p-4 border-b border-white/[0.08] bg-surface-950/60 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-linear-to-br from-brand-500/30 to-iris-500/30 border border-white/[0.1] flex items-center justify-center font-bold text-white text-base shrink-0">
                        {selectedContact.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-sm">{selectedContact.name}</h3>
                          <span className="flex items-center gap-1 text-2xs text-emerald-400 font-semibold">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            Citoyen actif
                          </span>
                        </div>
                        <p className="text-2xs text-mist-400 truncate">{selectedContact.title} • {selectedContact.guildName}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('passport')}
                      className="px-2.5 py-1 rounded-lg border border-white/[0.08] hover:border-iris-400/40 text-mist-300 hover:text-white text-2xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                    >
                      <span>Career Passport</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Messages Scrollable */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    {threadMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-mist-400 space-y-2">
                        <MessageSquare className="h-8 w-8 text-iris-400/40" />
                        <p className="text-xs font-medium">Aucun échange antérieur avec {selectedContact.name}.</p>
                        <p className="text-2xs max-w-xs text-mist-500">
                          Propose un projet, demande un conseil ou prépare une équipe de travail pour le City Hub !
                        </p>
                      </div>
                    ) : (
                      threadMessages.map((msg) => {
                        const isMine = msg.isFromMe;
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} space-y-1`}
                          >
                            <div className="flex items-center gap-2 text-3xs text-mist-500">
                              <span>{isMine ? 'Moi' : msg.senderName}</span>
                              <span>•</span>
                              <span>{msg.createdAt}</span>
                              <span className="rounded bg-white/[0.05] px-1 py-0.2 text-mist-400 uppercase font-semibold">
                                {msg.contextTag}
                              </span>
                            </div>

                            <div
                              className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                                isMine
                                  ? 'bg-linear-to-r from-brand-600 to-iris-600 text-white rounded-tr-xs shadow-md shadow-brand-950/40'
                                  : 'bg-surface-950 border border-white/[0.08] text-mist-200 rounded-tl-xs'
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Saisie de message direct (§29) */}
                  <form onSubmit={handleSendMessage} className="p-3.5 border-t border-white/[0.08] bg-surface-950/80 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2 text-2xs">
                      <span className="text-mist-500 font-semibold">Objet :</span>
                      {[
                        { key: 'collaboration', label: '🤝 Projet' },
                        { key: 'mentoring', label: '💡 Mentorat' },
                        { key: 'guild', label: '🛡️ Guilde' },
                        { key: 'general', label: '💬 Échange' },
                      ].map((tag) => (
                        <button
                          key={tag.key}
                          type="button"
                          onClick={() => setContextTag(tag.key as any)}
                          className={`px-2 py-0.5 rounded-md border text-3xs font-medium transition-colors cursor-pointer ${
                            contextTag === tag.key
                              ? 'border-iris-400 bg-iris-500/20 text-white font-bold'
                              : 'border-white/[0.06] text-mist-400 hover:text-white'
                          }`}
                        >
                          {tag.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={500}
                        placeholder={`Écrire à ${selectedContact.name} (max 500 car.)...`}
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-surface-900 text-white placeholder-mist-600 text-xs focus:outline-hidden focus:border-iris-500"
                      />
                      <button
                        type="submit"
                        disabled={!messageInput.trim() || isSending}
                        className="px-4 py-2.5 rounded-xl bg-linear-to-r from-brand-500 to-iris-600 hover:from-brand-400 hover:to-iris-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer shadow-md shadow-brand-500/20"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Envoyer</span>
                      </button>
                    </div>
                    <div className="flex justify-between items-center text-3xs text-mist-500 px-1">
                      <span>Apprentissage collaboratif (§29) — Filtre éthique OWASP actif</span>
                      <span>{messageInput.length}/500</span>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/[0.08] bg-surface-900/60 p-12 text-center h-[660px] flex flex-col items-center justify-center space-y-3">
                  <Users className="h-12 w-12 text-iris-400/40" />
                  <h3 className="text-base font-bold text-white">Sélectionne un citoyen dans l'annuaire</h3>
                  <p className="text-xs text-mist-400 max-w-sm">
                    Consulte les compétences de tes concitoyens et engage la discussion pour créer des synergies professionnelles.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Participation Modal */}
      {selectedHackathon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-brand-500/30 bg-surface-900 p-6 md:p-8 shadow-2xl space-y-6 animate-scale-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Trophy className="h-6 w-6 text-brand-400" />
                <h2 className="text-xl font-extrabold text-white">Soumettre le Projet Hackathon</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHackathon(null)}
                aria-label="Fermer la modale"
                className="text-mist-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-surface-950 border border-white/[0.06] text-xs text-mist-300">
              <strong className="text-white">{selectedHackathon.title}</strong> &bull; {selectedHackathon.theme} (Sprint 48h)
            </div>

            <form onSubmit={handleHackathonSubmit} className="space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-mist-300 mb-1.5">Nom de votre Équipe</label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/[0.08] bg-surface-950 text-white placeholder-mist-600 text-sm focus:outline-hidden focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-mist-300 mb-1.5">Membres de l'Équipe Pluridisciplinaire</label>
                <div className="p-3 rounded-xl bg-surface-950/60 border border-white/[0.06] space-y-1.5 text-xs text-mist-300">
                  <div className="flex items-center gap-2 text-white font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 text-gain-400" />
                    <span>{citizen.name} (Team Lead & Développeur)</span>
                  </div>
                  <div className="flex items-center gap-2 text-mist-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-gain-400" />
                    <span>Aina R. (Designer UI/UX & Ergonomie)</span>
                  </div>
                  <div className="flex items-center gap-2 text-mist-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-gain-400" />
                    <span>Hery T. (Business Model & Pitch)</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-mist-300 mb-1.5">Descriptif du Prototype & Pitch</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Décrivez votre solution technique, le problème résolu et l'impact direct à Madagascar..."
                  value={submissionPitch}
                  onChange={(e) => setSubmissionPitch(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/[0.08] bg-surface-950 text-white placeholder-mist-600 text-sm focus:outline-hidden focus:border-brand-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs text-amber-300">
                <span className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" />
                  Coût en énergie : 20%
                </span>
                <span>Énergie disponible : {citizen.energy}%</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedHackathon(null)}
                  className="px-4 py-2.5 rounded-xl border border-white/[0.08] text-mist-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || citizen.energy < 20}
                  className="px-6 py-2.5 rounded-xl bg-linear-to-r from-brand-500 to-iris-600 hover:from-brand-400 hover:to-iris-500 text-white text-xs font-extrabold flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-brand-500/20"
                >
                  {isSubmitting ? 'Évaluation par le jury...' : 'Soumettre au Jury'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
