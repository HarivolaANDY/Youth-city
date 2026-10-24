import React from 'react';
import { CheckCircle2, AlertTriangle, Info, Sparkles, Coins, X } from 'lucide-react';
import { useGameStore } from '../stores/useGameStore';

const TONE_STYLES = {
  success: {
    shell: 'border-gain-400/35 bg-night-900/92 text-mist-50',
    icon: 'text-gain-400',
    ring: 'group-hover:border-gain-400/60',
  },
  warning: {
    shell: 'border-warn-400/35 bg-night-900/92 text-mist-50',
    icon: 'text-warn-400',
    ring: 'group-hover:border-warn-400/60',
  },
  xp: {
    shell: 'border-brand-400/35 bg-night-900/92 text-mist-50',
    icon: 'text-brand-300',
    ring: 'group-hover:border-brand-400/60',
  },
  money: {
    shell: 'border-gain-400/35 bg-night-900/92 text-mist-50',
    icon: 'text-gain-400',
    ring: 'group-hover:border-gain-400/60',
  },
  info: {
    shell: 'border-white/12 bg-night-900/92 text-mist-50',
    icon: 'text-cool-400',
    ring: 'group-hover:border-white/25',
  },
} as const;

const ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  xp: Sparkles,
  money: Coins,
  info: Info,
} as const;

export const ToastContainer: React.FC = () => {
  const { notifications, removeNotification } = useGameStore();

  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      aria-relevant="additions"
      className="pointer-events-none fixed top-20 right-3 z-50 flex w-[min(22rem,calc(100vw-1.5rem))] flex-col gap-2.5 sm:right-6"
    >
      {notifications.map((n) => {
        const Icon = ICONS[n.type];

        return (
          <div
            key={n.id}
            className={`group pointer-events-auto flex animate-toast-in items-start justify-between gap-3 rounded-xl border px-3.5 py-3 shadow-panel-lg backdrop-blur-xl transition-colors ${TONE_STYLES[n.type].shell} ${TONE_STYLES[n.type].ring}`}
          >
            <div className="flex min-w-0 items-start gap-2.5">
              <Icon className={`mt-0.5 size-4 shrink-0 ${TONE_STYLES[n.type].icon}`} aria-hidden="true" />
              <div className="min-w-0">
                <p className="block text-xs font-bold">{n.title}</p>
                <p className="mt-0.5 block text-2xs leading-snug opacity-85">{n.message}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeNotification(n.id)}
              aria-label={`Fermer la notification : ${n.title}`}
              className="-mt-0.5 -mr-0.5 grid size-6 shrink-0 place-items-center rounded-md opacity-55 transition-all hover:bg-white/10 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-400 active:scale-90"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
