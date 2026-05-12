/**
 * Segment types where generated data has no standalone “first level” row at aggregation_level 2
 * (only nested paths such as Offline → boutique). Default views must use leaf rows (level null).
 */
export const SEGMENT_TYPES_WITHOUT_LEVEL2_ROWS = new Set<string>(['By Distribution Channel'])

export function defaultAggLevelWhenNoSegmentSelected(segmentType: string): number | null {
  return SEGMENT_TYPES_WITHOUT_LEVEL2_ROWS.has(segmentType) ? null : 2
}
