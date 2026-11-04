import React, { useEffect, useRef, useState } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';
import { useGameStore } from '../stores/useGameStore';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { IconChip } from './ui/IconChip';
import { controlClass } from '../lib/control';
import { formatNumber } from '../lib/format';
import { sanitizeUserInputForAgent, MAX_USER_INPUT_LENGTH } from '../lib/guidance';
import { api } from '../services/api';

interface Message {
  sender: 'nova' | 'user';
  text: string;
}

const QUICK_PROMPTS = [
  'Comment équilibrer mon budget ?',
  'Quel job me recommandes-tu ?',
  'Comment monter de niveau plus vite ?',
];

export const NovaMentorModal: React.FC = () => {
  const { isNovaModalOpen, toggleNovaModal, citizen } = useGameStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'nova',
      text: `Bonjour ${citizen.name} ! Je suis NOVA, ton mentor de vie et de carrière sur Youth City. Je suis là pour t'aider à arbitrer tes dépenses, choisir tes formations et réussir ta transition vers l'autonomie. De quoi aimerais-tu parler aujourd'hui ?`,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [typing, setTyping] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const replyTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const node = threadRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, typing, isNovaModalOpen]);

  useEffect(() => () => window.clearTimeout(replyTimer.current), []);

  if (!isNovaModalOpen) return null;

  const handleSend = (textToSend?: string) => {
    const rawText = (textToSend || inputText).trim();
    if (!rawText) return;

    // OWASP LLM01 Guardrail : Sanitization et détection d'injection
    const sanitization = sanitizeUserInputForAgent(rawText);
    const text = sanitization.cleanText;

    setMessages((prev) => [...prev, { sender: 'user', text }]);
    setInputText('');
    setTyping(true);

    api.chatWithNova(text).then((res) => {
      let reply = '';
      if (res && 'reply' in res) {
        reply = res.reply;
      } else if (sanitization.isSuspect) {
        reply = `⚠️ Alerte Garde-Fou : ${sanitization.reason || "Requête non autorisée."} En tant que mentor de Youth City, mes règles de jeu, valeurs éthiques et directives d'apprentissage ne peuvent pas être contournées. Repartons sur un conseil constructif pour ta carrière !`;
      } else {
        const lower = text.toLowerCase();

        if (lower.includes('budget') || lower.includes('argent') || lower.includes('épargne')) {
          reply = `Actuellement, tu as ${formatNumber(citizen.money)} MGA de trésorerie et ${formatNumber(citizen.savings)} MGA d'épargne. C'est un bon début ! Veille à toujours conserver au moins 2 mois de loyer en réserve pour ne pas être pris au dépourvu lors d'imprévus.`;
        } else if (lower.includes('travail') || lower.includes('job') || lower.includes('carrière') || lower.includes('emploi')) {
          if (!citizen.currentJobId) {
            reply = `Tu n'as pas encore de contrat de travail actif. Si ton score en JavaScript est supérieur à 50%, fonce au Business District pour postuler chez TechSolutions. Le salaire de 450 000 MGA par mois t'apportera une solide autonomie !`;
          } else {
            reply = `Tu occupes déjà un poste ! Pense à effectuer tes shifts régulièrement sans épuiser ta jauge d'énergie. Si tu tombes sous 20% d'énergie, ta productivité et ton bien-être chuteront.`;
          }
        } else if (lower.includes('formation') || lower.includes('campus') || lower.includes('apprendre') || lower.includes('cours')) {
          reply = `La formation continue est la clé : chaque module validé augmente directement ta valeur marchande dans le Business District. Je te conseille d'obtenir le Certificat Développeur Web Junior au Campus.`;
        } else {
          reply = `C'est une excellente question pour ton développement citoyen. Mon conseil : équilibre toujours tes 3 piliers : Compétences (Campus), Stabilité financière (Business & Finance) et Énergie vitale (Repos au Résidentiel).`;
        }
      }

      setTyping(false);
      setMessages((prev) => [...prev, { sender: 'nova', text: reply }]);
    }).catch(() => {
      setTyping(false);
    });
  };

  return (
    <Modal open onClose={() => toggleNovaModal(false)} labelledBy="nova-title" size="md">
      <div className="flex items-center gap-3 border-b border-white/[0.07] bg-white/[0.02] px-5 py-4 pr-14">
          <IconChip
            tone="brand"
            className="border-brand-400/30 bg-linear-to-br from-brand-600 to-iris-600 text-brand-200 shadow-brand"
          >
            <Bot />
          </IconChip>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="nova-title" className="text-sm font-black text-white">
              NOVA &mdash; AI Life Mentor
            </h2>
            <Badge tone="gain" variant="square">
              <span className="size-1 rounded-full bg-gain-400 animate-pulse-soft" aria-hidden="true" />
              En ligne
            </Badge>
          </div>
          <p className="text-2xs text-mist-400">Coach personnalisé &amp; orientation de carrière</p>
        </div>
      </div>

      <div
        ref={threadRef}
        role="log"
        aria-live="polite"
        aria-label="Conversation avec NOVA"
        className="min-h-[240px] flex-1 space-y-3 overflow-y-auto px-4 py-4"
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'nova' && (
        <IconChip tone="brand" className="border-brand-400/30 bg-linear-to-br from-brand-600 to-iris-600 text-brand-200 shadow-brand">
          <Bot />
        </IconChip>
            )}

            <div
              className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'rounded-tr-sm bg-linear-to-br from-brand-600 to-iris-600 text-white shadow-raise'
                  : 'rounded-tl-sm border border-white/[0.08] bg-night-900/70 text-mist-200'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex items-start gap-2.5" aria-hidden="true">
            <IconChip tone="brand" size="sm" className="mt-1">
              <Bot />
            </IconChip>
            <span className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-white/[0.08] bg-night-900/70 px-4 py-3">
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className="size-1.5 rounded-full bg-brand-300 animate-pulse-soft"
                  style={{ animationDelay: `${dot * 160}ms` }}
                />
              ))}
            </span>
          </div>
        )}
      </div>

      <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto border-t border-white/[0.06] bg-night-900/40 px-4 py-2.5">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => handleSend(prompt)}
            className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-2xs font-medium text-mist-300 transition-colors hover:border-brand-400/40 hover:bg-brand-500/12 hover:text-brand-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 active:scale-95"
          >
            {prompt}
          </button>
        ))}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 border-t border-white/[0.07] bg-night-900/50 p-3.5"
      >
        <label htmlFor="nova-input" className="sr-only">
          Pose ta question à NOVA
        </label>
        <input
          id="nova-input"
          type="text"
          maxLength={MAX_USER_INPUT_LENGTH}
          value={inputText}
          onChange={(event) => setInputText(event.target.value)}
          placeholder="Pose une question à NOVA..."
          autoComplete="off"
          className={`h-10 min-w-0 flex-1 px-3.5 text-xs placeholder:text-mist-500 ${controlClass}`}
        />
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={!inputText.trim()}
          aria-label="Envoyer le message à NOVA"
          className="h-10 w-10 shrink-0 px-0"
        >
          <Send className="size-4" aria-hidden="true" />
        </Button>
      </form>

      <p className="flex items-center gap-1.5 px-4 pb-3 text-2xs text-mist-500">
        <Sparkles className="size-3 shrink-0" aria-hidden="true" />
        Réponses simulées par un mentor IA pédagogique, sans conseil financier réel.
      </p>
    </Modal>
  );
};
