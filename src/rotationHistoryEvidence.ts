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
