/**
 * Stable alt-account (`APP_ALT_*`) family for AQPBT-12 and other alt-owner specs.
 * Created once in auth setup via `ensureBaselineFamily('alt')`.
 */
export const altBaselineFamily = {
  name: 'Bauchamps',
  addressText: 'Thornhill host note',
  /** Matches Profile → address visibility "Keep hidden" (PATCH `/api/v1/families`). */
  addressVisibility: 'hidden',
  children: [
    {
      role: 'boy5',
      firstName: 'Bauchamps-boy-5',
      gender: 'boy' as const,
      ageYears: 5,
      birthMonth: 6,
      avatarKey: 'fox',
    },
    {
      role: 'girl8',
      firstName: 'Bauchamps-girl-8',
      gender: 'girl' as const,
      ageYears: 8,
      birthMonth: 6,
      avatarKey: 'fox',
    },
  ],
} as const;
