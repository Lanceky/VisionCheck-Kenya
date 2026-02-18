/**
 * distanceService.ts
 * -------------------
 * Distance-measurement helpers for the VisionCheck distance calibration.
 *
 * • Distance test (3 m) — uses GPS (expo-location) to measure the
 *   straight-line distance between two tapped points.
 * • Near test (40 cm)   — uses a visual arm-length guide (no sensor).
 */

// ─── Distance targets ────────────────────────────────────────────────

export interface DistanceTarget {
  targetCm: number;
  toleranceCm: number;
  label: string;
}

export const DISTANCE_TARGETS = {
  /** Near-vision Jaeger test at ~40 cm */
  near: { targetCm: 40, toleranceCm: 5, label: '40 cm' } as DistanceTarget,
  /** 3-metre Snellen distance test */
  distance: { targetCm: 300, toleranceCm: 50, label: '3 metres' } as DistanceTarget,
} as const;

export type TestMode = keyof typeof DISTANCE_TARGETS;

// ─── Reading / instruction types ─────────────────────────────────────

export type Instruction = 'move_closer' | 'move_further' | 'hold_still' | 'too_far';

export interface DistanceReading {
  distanceCm: number;
  isInRange: boolean;
  instruction: Instruction;
}

// ─── GPS distance (Haversine) ────────────────────────────────────────

/**
 * Calculate the distance in **centimetres** between two GPS coordinates
 * using the Haversine formula.  Returns a float with full precision.
 */
export function haversineDistanceCm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6_371_000; // Earth radius in metres
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c * 100; // metres → cm (full precision, no rounding)
}

// ─── Evaluate distance reading ───────────────────────────────────────

/**
 * Given a measured distance, decide whether the user is in range
 * and what voice instruction to give.
 */
export function evaluateDistance(
  distanceCm: number,
  mode: TestMode,
): DistanceReading {
  const { targetCm, toleranceCm } = DISTANCE_TARGETS[mode];
  const diff = distanceCm - targetCm;

  if (Math.abs(diff) <= toleranceCm) {
    return { distanceCm, isInRange: true, instruction: 'hold_still' };
  }
  if (diff > toleranceCm) {
    return { distanceCm, isInRange: false, instruction: 'too_far' };
  }
  return { distanceCm, isInRange: false, instruction: 'move_further' };
}

/**
 * Human-readable voice prompt for each instruction.
 */
export const VOICE_PROMPTS: Record<Instruction, string> = {
  move_closer: 'Move the phone closer.',
  move_further: 'Keep moving away.',
  hold_still: 'Perfect distance. Hold steady.',
  too_far: 'Too far. Move the phone a little closer.',
};
