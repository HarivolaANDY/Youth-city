import type { StateCreator } from 'zustand';
import type { UiSlice } from './slices/ui';
import type { AuthSlice } from './slices/auth';
import type { CitizenSlice } from './slices/citizen';
import type { DilemmaSlice } from './slices/dilemma';
import type { CareerSlice } from './slices/career';
import type { CampusSlice } from './slices/campus';
import type { MarketSlice } from './slices/market';
import type { StartupSlice } from './slices/startup';
import type { HubSlice } from './slices/hub';
import type { AdminSlice } from './slices/admin';

export type GameState = UiSlice &
  AuthSlice &
  CitizenSlice &
  DilemmaSlice &
  CareerSlice &
  CampusSlice &
  MarketSlice &
  StartupSlice &
  HubSlice &
  AdminSlice;

export type Slice<T> = StateCreator<GameState, [], [], T>;

export type ActionResult = { success: boolean; error?: string };
