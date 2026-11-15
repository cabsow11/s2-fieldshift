import type { Crop, Field } from './engine';

export type HistoryEvidenceStatus = 'DECLARED_ONLY' | 'MISSING';
export interface HistoricalRotationAssessment {
  sequence: [Crop, Crop];
  previousCrop: Crop | null;
  historyStatus: HistoryEvidenceStatus;
  repeatsPreviousCrop: boolean | null;
  immediateRepetitionWithinSequence: boolean;
  benefitEstablished: false;
  outcome: 'EXCLUDED_BY_EXPLORER_SCOPE' | 'FIELD_VERIFICATION_REQUIRED';
  notes: string[];
}

const knownCrops: Crop[] = ['Millet', 'Groundnut', 'Cowpea', 'Sorghum'];
export function parseRotationId(value: string): [Crop, Crop] {
  const parts = value.split('-');
  if (parts.length !== 2 || !parts.every(p => knownCrops.includes(p as Crop))) {
    throw new Error(`Invalid crop rotation: ${value}`);
  }
  return [parts[0] as Crop, parts[1] as Crop];
}

/** Descriptive checks only: no transfer of literature into numeric yield or soil benefits. */
export function assessRotationHistory(id: string, field: Field): HistoricalRotationAssessment {
  const sequence = parseRotationId(id);
  const previousCrop = field.previous;
  if (previousCrop !== null && !knownCrops.includes(previousCrop)) throw new Error('Invalid previous crop');
  const immediateRepetitionWithinSequence = sequence[0] === sequence[1];
  const repeatsPreviousCrop = previousCrop === null ? null : previousCrop === sequence[0];
  return {
    sequence, previousCrop,
    historyStatus: previousCrop === null ? 'MISSING' : 'DECLARED_ONLY',
    repeatsPreviousCrop, immediateRepetitionWithinSequence,
    benefitEstablished: false,
    outcome: immediateRepetitionWithinSequence ? 'EXCLUDED_BY_EXPLORER_SCOPE' : 'FIELD_VERIFICATION_REQUIRED',
    notes: [
      previousCrop === null ? 'Previous-season crop has not been supplied.' : 'Previous-season crop is farmer-declared, not independently checked.',
      repeatsPreviousCrop === true ? 'The first proposed crop repeats the declared previous crop; evaluate local management implications.' : 'No numerical soil carry-over benefit is established.',
      'No multi-year yield, nitrogen, soil-organic-carbon or causal rotation effects are inferred.',
      'Historical satellite precipitation is not evidence of the effect of a crop sequence.'
    ]
  };
}

/** Daily historical NASA POWER descriptors. `rain` is in mm/day; this is not a field observation. */
export interface HistoricalDay {
  date: string;
  rain: number;
  tmean?: number;
  tmax?: number;
  tmin?: number;
  solar?: number;
  etoHG?: number;
}
export interface HistoricalSeason {
  year: number;
  start: string;
  end: string;
  days: number;
  totalRainMm: number;
  wetDays: number;
  longestDryDays: number;
  meanTemperatureC: number | null;
}
export interface HistoricalPair { first: HistoricalSeason; second: HistoricalSeason }

/**
 * Builds overlapping, consecutive-year June 1–September 30 pairs from historical
 * POWER estimates. Only complete 122-day seasons are used. These are descriptions
 * of observed historical climates, NOT counterfactual yields or forecasts.
 */
export function buildHistoricalPairs(history: readonly HistoricalDay[], wetThresholdMm = 1): HistoricalPair[] {
  if (!Number.isFinite(wetThresholdMm) || wetThresholdMm < 0) throw new Error('Invalid wet-day threshold');
  const byDate = new Map<string, HistoricalDay>();
  for (const day of history) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date) ||
        new Date(day.date + 'T00:00:00Z').toISOString().slice(0, 10) !== day.date ||
        !Number.isFinite(day.rain) || day.rain < 0 || byDate.has(day.date)) {
      throw new Error('Invalid, missing or duplicate historical daily observation');
    }
    byDate.set(day.date, day);
  }
  const years = [...new Set(history.map(d => Number(d.date.slice(0, 4))))].sort((a, b) => a - b);
  const seasons = new Map<number, HistoricalSeason>();
  for (const year of years) {
    const start = Date.UTC(year, 5, 1);
    let totalRainMm = 0, wetDays = 0, longestDryDays = 0, dryRun = 0, tempSum = 0, tempCount = 0;
    let complete = true;
    for (let i = 0; i < 122; i++) {
      const date = new Date(start + i * 86400000).toISOString().slice(0, 10);
      const d = byDate.get(date);
      if (!d) { complete = false; break; }
      totalRainMm += d.rain;
      if (d.rain >= wetThresholdMm) { wetDays++; dryRun = 0; }
      else { dryRun++; longestDryDays = Math.max(longestDryDays, dryRun); }
      if (d.tmean !== undefined && Number.isFinite(d.tmean)) { tempSum += d.tmean; tempCount++; }
    }
    if (complete) seasons.set(year, {
      year, start: `${year}-06-01`, end: `${year}-09-30`, days: 122,
      totalRainMm, wetDays, longestDryDays,
      meanTemperatureC: tempCount === 122 ? tempSum / 122 : null
    });
  }
  const pairs: HistoricalPair[] = [];
  for (const year of years) {
    const first = seasons.get(year), second = seasons.get(year + 1);
    if (first && second) pairs.push({ first, second });
  }
  return pairs;
}

/**
 * Labelled climatic exposure for a crop order. No crop-specific response is
 * known, so these objects must not be interpreted as agronomic effect sizes.
 */
export function rotationExposure(first: Crop, second: Crop, field: Field, windows: readonly HistoricalPair[]) {
  if (!knownCrops.includes(first) || !knownCrops.includes(second)) throw new Error('Unknown crop');
  return {
    rotation: [first, second] as [Crop, Crop],
    previousCrop: field.previous,
    pairs: windows.map(pair => ({
      firstCrop: first, secondCrop: second,
      first: pair.first, second: pair.second,
      causalEffectIdentified: false as const,
      yieldDifference: null as null,
    })),
    warnings: [
      'The two positions are historical climate descriptions, not measured crop outcomes.',
      'Adjacent two-year windows overlap and are not statistically independent.',
      'Climate differences do not identify a causal effect of rotation order.'
    ]
  };
}
