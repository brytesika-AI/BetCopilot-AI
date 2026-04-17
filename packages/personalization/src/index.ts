import { footer, userPreferenceProfileSchema, type UserPreferenceProfile } from "@betcopilot/core-schemas";

export const createDefaultProfile = (userId: string): UserPreferenceProfile =>
  userPreferenceProfileSchema.parse({
    userId,
    favoriteTeams: [],
    preferredBetTypes: [],
    bankrollStyle: "balanced",
    sessionMemory: [],
    footer
  });

export const appendSessionMemory = (profile: UserPreferenceProfile, note: string): UserPreferenceProfile =>
  userPreferenceProfileSchema.parse({
    ...profile,
    sessionMemory: [...profile.sessionMemory, note].slice(-20)
  });
