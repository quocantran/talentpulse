import { apiRequest } from './api';

export interface BoostStatusResult {
  tier: 'FREE' | 'VERIFIED' | 'PREMIUM';
  isVerified: boolean;
  isPremium: boolean;
  isBoosted: boolean;
  canBoost: boolean;
  lastBoostedAt: string | null;
  boostExpiresAt: string | null;
  remainingCooldownSeconds: number;
  remainingCooldownText: string;
  boostLimitText: string;
}

export interface BoostProfileResult {
  message: string;
  lastBoostedAt: string;
  boostExpiresAt: string;
  isBoosted: boolean;
}

export const candidateApi = {
  getBoostStatus: (accessToken?: string | null) =>
    apiRequest<BoostStatusResult>('/users/candidate/boost-status', {
      method: 'GET',
      accessToken,
    }),

  boostProfile: (accessToken?: string | null) =>
    apiRequest<BoostProfileResult>('/users/candidate/boost-profile', {
      method: 'POST',
      accessToken,
    }),
};
