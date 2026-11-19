import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Apple,
  Coffee,
  Utensils,
  Laptop,
  Shirt,
  Bus,
  Armchair,
  CheckCircle2,
  Zap,
  Heart,
  Package,
  Sparkles,
  Wallet,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { useGameStore } from '../../stores/useGameStore';
import { MARKET_ITEMS } from '../../data/mockData';
import { api } from '../../services/api';
import type { MarketItem } from '../../types/game';
import { ViewHeader } from '../../components/ui/ViewHeader';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatNumber } from '../../lib/format';

const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingBag,
  Apple,
  Coffee,
  Utensils,
  Laptop,
  Shirt,
  Bus,
  Armchair,
};

type CategoryFilter = 'all' | 'food' | 'equipment' | 'transport' | 'lifestyle';

const CATEGORY_TABS: { id: CategoryFilter; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'Tous les rayons', icon: Package },
  { id: 'food', label: 'Alimentation & Vitalité', icon: Utensils },
  { id: 'equipment', label: 'Équipement Pro & High-Tech', icon: Laptop },
  { id: 'transport', label: 'Mobilité Urbaine', icon: Bus },
  { id: 'lifestyle', label: 'Confort Foyer & Déco', icon: Armchair },
];

export const MarketView: React.FC = () => {
  const { citizen, buyMarketItem } = useGameStore();
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [items, setItems] = useState<MarketItem[]>(MARKET_ITEMS);
  const [loadingItemKey, setLoadingItemKey] = useState<string | null>(null);

  // Sync market catalog from backend if reachable
  useEffect(() => {
    let isMounted = true;
    api.getMarketItems().then((backendItems) => {
      if (isMounted && backendItems && backendItems.length > 0) {
        setItems(backendItems);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handlePurchase = async (item: MarketItem) => {
    setLoadingItemKey(item.id);
    try {
      await buyMarketItem(item.id);
    } finally {
      setLoadingItemKey(null);
    }
  };

  const filteredItems =
    selectedCategory === 'all' ? items : items.filter((item) => item.category === selectedCategory);

  const ownedItemKeys = citizen.inventory || [];
  const ownedItems = items.filter((it) => ownedItemKeys.includes(it.id));

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* View Header */}
      <ViewHeader
        headingId="market-heading"
        tone="brand"
        badgeIcon={<ShoppingBag className="size-3.5" />}
        badgeLabel="Commerce & Équipements"
        title="Market District"
        description="Boutique urbaine : alimentation réparatrice, équipements professionnels et confort de vie."
      />

      {/* Citizen Vital Status & Resources Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Énergie */}
        <Panel className="relative overflow-hidden p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                <Zap className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-mist-400">Énergie Vitale</span>
            </div>
            <span className={`text-base font-bold ${citizen.energy < 30 ? 'text-rose-400' : 'text-mist-100'}`}>
              {citizen.energy}%
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                citizen.energy < 30 ? 'bg-rose-500' : citizen.energy < 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${citizen.energy}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-mist-400">
            {citizen.energy < 30 ? '⚠️ Épuisement ! Mange un repas chaud.' : 'Rechargeable via les repas du Market.'}
          </p>
        </Panel>

        {/* Bien-être */}
        <Panel className="relative overflow-hidden p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-iris-500/10 text-iris-400">
                <Heart className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-mist-400">Bien-être</span>
            </div>
            <span className="text-base font-bold text-mist-100">{citizen.wellbeing}%</span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-iris-500 transition-all duration-500"
              style={{ width: `${citizen.wellbeing}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-mist-400">Boosté par le confort et les équipements.</p>
        </Panel>

        {/* Portefeuille */}
        <Panel className="relative overflow-hidden p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <Wallet className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-mist-400">Solde Courant</span>
            </div>
            <Badge tone="gain">Disponible</Badge>
          </div>
          <div className="mt-2">
            <span className="text-lg font-bold text-emerald-400">{formatNumber(citizen.money)}</span>
            <span className="ml-1 text-xs text-mist-400">MGA</span>
          </div>
          <p className="mt-1 text-xs text-mist-400">Crédité par tes missions et ton emploi.</p>
        </Panel>

        {/* Équipements possédés */}
        <Panel className="relative overflow-hidden p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400">
                <Package className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-mist-400">Équipements</span>
            </div>
            <span className="text-base font-bold text-brand-400">{ownedItemKeys.length} / 4</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            {['item-laptop', 'item-suit', 'item-transport-pass', 'item-desk-chair'].map((key) => {
              const owned = ownedItemKeys.includes(key);
              return (
                <div
                  key={key}
                  className={`h-2 flex-1 rounded-full ${
                    owned ? 'bg-brand-500 shadow-sm shadow-brand-500/50' : 'bg-white/10'
                  }`}
                  title={key}
                />
              );
            })}
          </div>
          <p className="mt-2 text-xs text-mist-400">Équipements actifs dans l'inventaire.</p>
        </Panel>
      </div>

      {/* Rayons / Category Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/[0.08] pb-4">
        {CATEGORY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedCategory === tab.id;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 ${
                isActive
                  ? 'border border-brand-400/30 bg-brand-500/15 text-white shadow-sm shadow-brand-500/20'
                  : 'border border-white/5 bg-night-800/60 text-mist-300 hover:border-white/15 hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-brand-400' : 'text-mist-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Layout: Catalog Grid + Citizen Inventory Sidebar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Catalog Items (2 cols on large screen) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-mist-200">
              Articles disponibles ({filteredItems.length})
            </h3>
            <span className="text-xs text-mist-400">Prix affichés en Ariary (MGA)</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filteredItems.map((item) => {
              const Icon = ICON_MAP[item.icon] || ShoppingBag;
              const isOwned = !item.isConsumable && ownedItemKeys.includes(item.id);
              const canAfford = citizen.money >= item.price;
              const isLoading = loadingItemKey === item.id;

              return (
                <Panel
                  key={item.id}
                  className={`flex flex-col justify-between p-5 transition-all duration-200 ${
                    isOwned ? 'border-brand-500/30 bg-brand-950/10' : 'hover:border-white/15'
                  }`}
                >
                  <div>
                    {/* Header item card */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-night-900 text-brand-300">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge tone={item.isConsumable ? 'warn' : 'iris'}>
                          {item.isConsumable ? 'Consommable' : 'Permanent'}
                        </Badge>
                        {isOwned && (
                          <Badge tone="gain" icon={<CheckCircle2 className="size-3" />}>
                            Possédé
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="mt-3">
                      <h4 className="text-sm font-bold text-mist-100">{item.name}</h4>
                      <p className="mt-1 text-xs leading-relaxed text-mist-400">{item.description}</p>
                    </div>

                    {/* Bonuses & Perks */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {item.energyBonus > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                          <Zap className="h-3 w-3" />
                          +{item.energyBonus}% Énergie
                        </span>
                      )}
                      {item.wellbeingBonus > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-iris-500/20 bg-iris-500/10 px-2 py-0.5 text-[11px] font-semibold text-iris-300">
                          <Heart className="h-3 w-3" />
                          +{item.wellbeingBonus}% Bien-être
                        </span>
                      )}
                      {!item.isConsumable && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-300">
                          <Sparkles className="h-3 w-3" />
                          Bonus passif
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pricing and Action button */}
                  <div className="mt-5 border-t border-white/[0.06] pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-mist-400">Prix :</span>
                      <span className="text-sm font-bold text-mist-100">
                        {formatNumber(item.price)} <span className="text-xs font-normal text-mist-400">MGA</span>
                      </span>
                    </div>

                    {isOwned ? (
                      <Button variant="secondary" size="sm" block disabled className="opacity-70">
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
                        Équipé dans l'inventaire
                      </Button>
                    ) : (
                      <Button
                        variant={canAfford ? 'primary' : 'secondary'}
                        size="sm"
                        block
                        disabled={!canAfford || isLoading}
                        onClick={() => handlePurchase(item)}
                      >
                        {isLoading ? (
                          'Transaction en cours…'
                        ) : !canAfford ? (
                          'Fonds insuffisants'
                        ) : item.isConsumable ? (
                          'Consommer & Recharger'
                        ) : (
                          'Acheter l’équipement'
                        )}
                      </Button>
                    )}
                  </div>
                </Panel>
              );
            })}
          </div>
        </div>

        {/* Citizen Inventory & Active Perks Sidebar */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-mist-200">
            Mon Inventaire & Avantages
          </h3>

          <Panel className="p-5 space-y-4">
            <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/20 text-brand-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-mist-100">Équipements du Citoyen</h4>
                <p className="text-xs text-mist-400">
                  {ownedItems.length} équipement{ownedItems.length > 1 ? 's' : ''} débloqué{ownedItems.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {ownedItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-5 text-center">
                <Package className="mx-auto h-8 w-8 text-mist-500" />
                <p className="mt-2 text-xs font-medium text-mist-300">Aucun équipement permanent</p>
                <p className="mt-1 text-[11px] text-mist-500">
                  Acheter un PC ou une tenue professionnelle te donne des avantages pour tes candidatures et projets.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {ownedItems.map((it) => {
                  const Icon = ICON_MAP[it.icon] || Package;
                  return (
                    <div
                      key={it.id}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-night-900/80 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-mist-100">{it.name}</p>
                          <p className="text-[10px] text-emerald-400">Actif dans le profil citoyen</p>
                        </div>
                      </div>
                      <Badge tone="brand">Possédé</Badge>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Practical Guide Tips (§11, §19) */}
            <div className="rounded-xl border border-white/5 bg-night-950/40 p-4">
              <div className="flex items-start gap-2">
                <HelpCircle className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="text-xs font-semibold text-cyan-300">Conseil de gestion urbaine</h5>
                  <p className="text-[11px] leading-relaxed text-mist-400">
                    Garde toujours au moins 10 000 MGA de marge pour tes repas d'urgence. Un citoyen dont l'énergie tombe sous les 20% ne peut plus travailler ni étudier !
                  </p>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};
