/**
 * Utility functions for Filter Presets
 * Handles dynamic calculation of top regions and segments
 */

import type { ComparisonData, DataRecord, FilterState } from './types'
import { REGION_TO_COUNTRIES_FALLBACK, JEWELRY_MAIN_REGIONS } from './geography-constants'

/** Parent regions only (excludes countries). Prefer API dimensions when present. */
function getRegionNames(data: ComparisonData | null): string[] {
  const fromData = data?.dimensions?.geographies?.regions
  if (fromData && fromData.length > 0) {
    return [...fromData]
  }
  return [...JEWELRY_MAIN_REGIONS]
}

/** All country-level names under the hierarchy (excludes region names). */
function getCountryNames(data: ComparisonData | null): string[] {
  const map = data?.dimensions?.geographies?.countries
  if (map && Object.keys(map).length > 0) {
    return [...new Set(Object.values(map).flat() as string[])]
  }
  return [...new Set(Object.values(REGION_TO_COUNTRIES_FALLBACK).flat())]
}

/**
 * Calculate top **regions** (parent geographies only) by summed market value for a year.
 * Uses the primary segment type only so totals are not inflated by mixing segment types.
 */
export function getTopRegionsByMarketValue(
  data: ComparisonData | null,
  year: number = 2023,
  topN: number = 3
): string[] {
  if (!data) return []

  const records = data.data.value.geography_segment_matrix
  const regionSet = new Set(getRegionNames(data))
  const segmentType = getFirstSegmentType(data)

  const geographyTotals = new Map<string, number>()

  records.forEach((record: DataRecord) => {
    const geography = record.geography
    if (geography === 'Global' || !regionSet.has(geography)) return
    if (segmentType && record.segment_type !== segmentType) return

    const value = record.time_series[year] || 0
    const currentTotal = geographyTotals.get(geography) || 0
    geographyTotals.set(geography, currentTotal + value)
  })

  return Array.from(geographyTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([geography]) => geography)
}

/**
 * Get all first-level segments for a given segment type
 * @param data - The comparison data
 * @param segmentType - The segment type to get segments for
 * @returns Array of first-level segment names
 */
export function getFirstLevelSegments(
  data: ComparisonData | null,
  segmentType: string
): string[] {
  if (!data) return []

  const segmentDimension = data.dimensions.segments[segmentType]
  if (!segmentDimension) return []

  const hierarchy = segmentDimension.hierarchy || {}
  const allSegments = segmentDimension.items || []

  // Find root segments (those that are parents but not children of any other segment)
  const allChildren = new Set(Object.values(hierarchy).flat())
  const firstLevelSegments: string[] = []

  // Add all segments that have children but are not children themselves
  Object.keys(hierarchy).forEach(parent => {
    if (!allChildren.has(parent) && hierarchy[parent].length > 0) {
      firstLevelSegments.push(parent)
    }
  })

  // Also add standalone segments that are neither parents nor children
  allSegments.forEach(segment => {
    if (!allChildren.has(segment) && !hierarchy[segment]) {
      firstLevelSegments.push(segment)
    }
  })

  return firstLevelSegments.sort()
}

/**
 * Get the first available segment type from the data
 * @param data - The comparison data
 * @returns The first segment type name or null
 */
export function getFirstSegmentType(data: ComparisonData | null): string | null {
  if (!data || !data.dimensions.segments) return null
  
  const segmentTypes = Object.keys(data.dimensions.segments)
  return segmentTypes.length > 0 ? segmentTypes[0] : null
}

/**
 * Top **regions** only (parent geographies), ranked by average CAGR for the primary segment type.
 */
export function getTopRegionsByCAGR(
  data: ComparisonData | null,
  topN: number = 2
): string[] {
  if (!data) return []

  const records = data.data.value.geography_segment_matrix
  const regionSet = new Set(getRegionNames(data))
  const segmentType = getFirstSegmentType(data)

  const geographyCAGRs = new Map<string, number[]>()

  records.forEach((record: DataRecord) => {
    const geography = record.geography
    if (geography === 'Global' || !regionSet.has(geography)) return
    if (segmentType && record.segment_type !== segmentType) return
    if (record.cagr === undefined || record.cagr === null) return

    const cagrs = geographyCAGRs.get(geography) || []
    cagrs.push(record.cagr)
    geographyCAGRs.set(geography, cagrs)
  })

  const avgCAGRs = Array.from(geographyCAGRs.entries()).map(([geography, cagrs]) => ({
    geography,
    avgCAGR: cagrs.reduce((a, b) => a + b, 0) / cagrs.length,
  }))

  return avgCAGRs
    .sort((a, b) => b.avgCAGR - a.avgCAGR)
    .slice(0, topN)
    .map(item => item.geography)
}

/**
 * Top **countries** only (excludes parent regions like "Asia Pacific"), ranked by average CAGR.
 */
export function getTopCountriesByCAGR(
  data: ComparisonData | null,
  topN: number = 5
): string[] {
  if (!data) return []

  const records = data.data.value.geography_segment_matrix
  const countrySet = new Set(getCountryNames(data))
  const regionSet = new Set(getRegionNames(data))
  const segmentType = getFirstSegmentType(data)

  const geographyCAGRs = new Map<string, number[]>()

  records.forEach((record: DataRecord) => {
    const geography = record.geography
    if (geography === 'Global') return
    if (regionSet.has(geography)) return
    if (!countrySet.has(geography)) return
    if (segmentType && record.segment_type !== segmentType) return
    if (record.cagr === undefined || record.cagr === null) return

    const cagrs = geographyCAGRs.get(geography) || []
    cagrs.push(record.cagr)
    geographyCAGRs.set(geography, cagrs)
  })

  const avgCAGRs = Array.from(geographyCAGRs.entries()).map(([geography, cagrs]) => ({
    geography,
    avgCAGR: cagrs.reduce((a, b) => a + b, 0) / cagrs.length,
  }))

  return avgCAGRs
    .sort((a, b) => b.avgCAGR - a.avgCAGR)
    .slice(0, topN)
    .map(item => item.geography)
}

/**
 * Create dynamic filter configuration for Top Market preset
 * @param data - The comparison data
 * @returns Partial FilterState with dynamic values
 */
export function createTopMarketFilters(data: ComparisonData | null): Partial<FilterState> {
  const topRegions = getTopRegionsByMarketValue(data, 2023, 3)
  const firstSegmentType = getFirstSegmentType(data)
  const firstLevelSegments = firstSegmentType
    ? getFirstLevelSegments(data, firstSegmentType)
    : []

  return {
    viewMode: 'geography-mode', // Geography on X-axis, segments as series
    geographies: topRegions,
    segments: firstLevelSegments,
    segmentType: firstSegmentType || 'By Product Type',
    yearRange: [2023, 2027],
    dataType: 'value'
  }
}

/**
 * Create dynamic filter configuration for Growth Leaders preset
 * Identifies top 2 regions with highest CAGR and uses first segment type with all first-level segments
 */
export function createGrowthLeadersFilters(data: ComparisonData | null): Partial<FilterState> {
  if (!data) return {
    viewMode: 'geography-mode',
    yearRange: [2025, 2031],
    dataType: 'value'
  }

  // Get top 2 regions with highest CAGR
  const topRegions = getTopRegionsByCAGR(data, 2)
  const firstSegmentType = getFirstSegmentType(data)
  const firstLevelSegments = firstSegmentType
    ? getFirstLevelSegments(data, firstSegmentType)
    : []

  return {
    viewMode: 'geography-mode', // Geography on X-axis, segments as series
    geographies: topRegions,
    segments: firstLevelSegments,
    segmentType: firstSegmentType || 'By Product Type',
    yearRange: [2025, 2031],
    dataType: 'value'
  }
}

/**
 * Create dynamic filter configuration for Emerging Markets preset
 * Identifies top 5 countries with highest CAGR and uses first segment type with all first-level segments
 */
export function createEmergingMarketsFilters(data: ComparisonData | null): Partial<FilterState> {
  if (!data) return {
    viewMode: 'geography-mode',
    yearRange: [2025, 2031],
    dataType: 'value'
  }

  // Get top 5 countries with highest CAGR
  const topCountries = getTopCountriesByCAGR(data, 5)
  const firstSegmentType = getFirstSegmentType(data)
  const firstLevelSegments = firstSegmentType
    ? getFirstLevelSegments(data, firstSegmentType)
    : []

  return {
    viewMode: 'geography-mode', // Geography on X-axis, segments as series
    geographies: topCountries,
    segments: firstLevelSegments,
    segmentType: firstSegmentType || 'By Product Type',
    yearRange: [2025, 2031],
    dataType: 'value'
  }
}
