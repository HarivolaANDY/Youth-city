export type DistrictId = 
  | 'campus' 
  | 'business' 
  | 'residential' 
  | 'finance' 
  | 'market' 
  | 'startup' 
  | 'cityhub';

export type TimeSlot = 
  | 'Matin (08:00)' 
  | 'Après-midi (14:00)' 
  | 'Soir (18:00)' 
  | 'Nuit (22:00)';

export interface Citizen {
  id: string;
  name: string;
  avatarSeed: string;
  title: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  energy: number; // 0 - 100
  wellbeing: number; // 0 - 100
  money: number; // MGA virtuels (Ariary)
  savings: number; // Épargne MGA
  currentObjective: {
    title: string;
    target: string;
    progress: number; // 0 - 100
  };
  currentHousingId: string;
  currentJobId: string | null;
  skills: Record<string, number>; // ex: { 'javascript': 65, 'react': 40, 'git': 50, 'budget': 70, 'communication': 65 }
  completedCourses: string[];
  certifications: string[];
  completedProjects: number;
  completedChallenges: number;
  inventory: string[];
}

export interface MarketItem {
  id: string;
  name: string;
  category: 'food' | 'equipment' | 'transport' | 'lifestyle';
  price: number;
  energyBonus: number;
  wellbeingBonus: number;
  description: string;
  isConsumable: boolean;
  icon: string;
  isOwned?: boolean;
}

export interface District {
  id: DistrictId;
  name: string;
  subtitle: string;
  icon: string;
  badge: string;
  description: string;
  colorHex: string;
  gradient: string;
  accentBg: string;
  gridArea: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Course {
  id: string;
  title: string;
  category: 'Tech' | 'Business' | 'Design' | 'Finance';
  durationDays: number;
  cost: number;
  xpReward: number;
  skillsAwarded: Record<string, number>;
  description: string;
  certificationName: string;
  modules: {
    title: string;
    lessonSummary: string;
    quiz: QuizQuestion;
  }[];
}

export interface Job {
  id: string;
  title: string;
  company: string;
  salary: number; // par mois virtuel
  energyPerShift: number;
  requirements: {
    skillKey: string;
    skillName: string;
    requiredPercent: number;
  }[];
  minExperience: string;
  description: string;
  interviewQuestion: string;
  sampleAnswers: {
    text: string;
    score: number;
    feedback: string;
  }[];
}

export interface Housing {
  id: string;
  title: string;
  rentMonthly: number;
  comfortStars: number;
  energyRecoveryPerNight: number;
  description: string;
  features: string[];
}

export interface DilemmaOption {
  id: string;
  text: string;
  costMoney: number;
  costEnergy: number;
  gainXp: number;
  impactSkills?: Record<string, number>;
  consequenceText: string;
}

export interface Dilemma {
  id: string;
  title: string;
  scenario: string;
  icon: string;
  options: DilemmaOption[];
}

export interface Transaction {
  id: string;
  timestamp: string;
  label: string;
  amount: number;
  type: 'income' | 'expense' | 'savings_in' | 'savings_out';
  category: string;
}

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'xp' | 'money';
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  date_joined?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
  citizen: Citizen;
}

export type CharacterArchetype = 'ambitious_student' | 'resourceful_self_taught' | 'pragmatic_saver';
export type CharacterVocation = 'tech' | 'finance' | 'business';

export interface CharacterCustomizationPayload {
  name: string;
  avatarSeed?: string;
  archetype: CharacterArchetype;
  vocation: CharacterVocation;
}


