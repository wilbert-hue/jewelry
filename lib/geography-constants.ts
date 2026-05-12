/**
 * Region → countries hierarchy for the jewelry dashboard (matches `public/data` / segmentation JSON).
 */

export const REGION_TO_COUNTRIES_FALLBACK: Record<string, string[]> = {
  'North America': ['U.S.', 'Canada'],
  Europe: ['Belgium', 'Russia', 'Rest of Europe'],
  'Asia Pacific': [
    'China',
    'India',
    'Japan',
    'South Korea',
    'Singapore',
    'Thailand',
    'Indonesia',
    'Australia',
    'Rest of Asia Pacific',
  ],
  'Latin America': ['Brazil', 'Argentina', 'Mexico', 'Rest of Latin America'],
  'Middle East': ['UAE', 'Saudi Arabia', 'Qatar', 'Rest of Middle East'],
  Africa: ['South Africa', 'Nigeria', 'Egypt', 'Rest Of Africa'],
}

/** Top-level regions shown in geography pickers / matrix heuristics */
export const JEWELRY_MAIN_REGIONS = Object.keys(REGION_TO_COUNTRIES_FALLBACK)

/**
 * Labels treated as “regional” geographies in charts (includes legacy names for stale filters).
 */
export const REGIONAL_GEOGRAPHY_LABELS = [
  ...JEWELRY_MAIN_REGIONS,
  'Global',
  'Middle East & Africa',
  'Middle East',
  'ASEAN',
  'SAARC Region',
  'CIS Region',
]

/** Rough weights when apportioning Global-only rows across regions (matrix / bubble fallbacks). */
export const JEWELRY_REGION_MARKET_SHARE_HINTS: Record<string, number> = {
  'North America': 0.26,
  Europe: 0.2,
  'Asia Pacific': 0.28,
  'Latin America': 0.12,
  'Middle East': 0.14,
  Africa: 0.12,
  'Middle East & Africa': 0.14,
  ASEAN: 0.06,
  'SAARC Region': 0.05,
  'CIS Region': 0.03,
}
