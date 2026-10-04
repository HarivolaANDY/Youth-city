import {
  LayoutDashboard,
  Map,
  GraduationCap,
  Briefcase,
  Landmark,
  Home,
  ShieldCheck,
  ShoppingBag,
  Rocket,
  Users,
} from 'lucide-react';

export const TABS = [
  { id: 'dashboard', label: 'Dashboard', short: 'Cockpit', icon: LayoutDashboard },
  { id: 'map', label: 'Carte Urbaine', short: 'Ville', icon: Map },
  { id: 'campus', label: 'Campus', short: 'Campus', icon: GraduationCap },
  { id: 'career', label: 'Carrière', short: 'Carrière', icon: Briefcase },
  { id: 'startup', label: 'Startup District', short: 'Startup', icon: Rocket },
  { id: 'cityhub', label: 'City Hub', short: 'Hub', icon: Users },
  { id: 'market', label: 'Market District', short: 'Boutique', icon: ShoppingBag },
  { id: 'finance', label: 'Finance', short: 'Finance', icon: Landmark },
  { id: 'residential', label: 'Résidentiel', short: 'Foyer', icon: Home },
  { id: 'passport', label: 'Passport', short: 'Passport', icon: ShieldCheck },
] as const;

export const MOBILE_ITEMS = ['dashboard', 'map', 'career', 'passport'] as const;

export const navItemClass = (isActive: boolean) =>
  isActive
    ? 'border border-brand-300/25 bg-linear-to-r from-brand-600 to-iris-600 text-white shadow-iris'
    : 'border border-transparent text-mist-400 hover:bg-white/[0.06] hover:text-mist-100';
