import type { Field } from './engine';
import { assessRotationHistory } from './rotationHistoryEvidence';

export function HistoricalRotationPanel({pair,field,threshold}: {
  pair: [string,string]; field: Field; threshold: number;
}) {
  const assessments = pair.map(id => assessRotationHistory(id,field));
  return <section className="panel" aria-label="Crop rotation history evidence">
    <div className="panel-head"><div><span className="section-num">CROP HISTORY · EVIDENCE GATE</span>
      <h3>What does the previous season tell us?</h3></div><span className="subtle-badge">DECLARED CONTEXT ONLY</span></div>
    <p className="section-description">The field's previous crop is a declared input. No rotation-effect coefficient, nitrogen gain or yield advantage is estimated from it. Rainfall threshold {threshold} mm/day belongs to a separate descriptive climate diagnostic.</p>
    <div className="gate-grid">{assessments.map((a,i)=><article className="gate-card" key={i}>
      <div className="gate-header"><strong>{a.sequence[0]} → {a.sequence[1]}</strong><span>{a.outcome==='EXCLUDED_BY_EXPLORER_SCOPE'?'OUT OF SCOPE':'FIELD VERIFICATION REQUIRED'}</span></div>
      <p>Previous crop: <strong>{a.previousCrop??'Not recorded'}</strong> ({a.historyStatus==='MISSING'?'missing':'farmer-declared'}).</p>
      <p>{a.repeatsPreviousCrop===null?'Repetition cannot be checked without crop history.':a.repeatsPreviousCrop?'The first crop repeats the preceding season.':'The first crop differs from the declared preceding season.'}</p>
      <details><summary>Scientific limitations</summary><ul>{a.notes.map((note,j)=><li key={j}>{note}</li>)}</ul></details>
    </article>)}</div>
    <p className="muted-note">Decision status: <strong>no field-level agronomic superiority established</strong>. Verify plot history, soil conditions, cultivars and ordered-sequence field evidence.</p>
  </section>;
}
