
import {
  PARAMETER_REGISTRY,
  auditParameterProvenance
} from './agronomicEvidenceRegistry';

const names = {
  NASA_OBSERVATION: 'NASA source',
  DOCUMENTED_REGIONAL: 'Regional literature',
  SPATIAL_MODEL_PENDING: 'Spatial data not extracted',
  USER_DECLARATION: 'User/demo input',
  ILLUSTRATIVE_ONLY: 'Synthetic assumption',
  NOT_IDENTIFIED: 'Effect not identified'
};

const report = auditParameterProvenance();

export function AgronomicEvidenceUpgradePanel() {
  return (
    <section
      className="panel"
      style={{ marginBottom: 20 }}
      aria-label="Agronomic parameter provenance audit"
    >
      <div className="panel-head">
        <div>
          <span className="section-num">
            ACADEMIC PARAMETER GOVERNANCE · EVIDENCE-FIRST
          </span>
          <h3>What is real, assumed, or still missing?</h3>
        </div>
        <span className="subtle-badge">
          NO SILENT CALIBRATION
        </span>
      </div>

      <p className="section-description">
        A source-by-source audit of the variables used or proposed
        for FieldShift. Published experiment results are documented,
        not silently converted into local prediction coefficients.
        Spatial soil and crop-suitability layers remain absent until
        verified and imported.
      </p>

      <div className="f19-kpis">
        <div>
          <span>Tracked parameters</span>
          <b>{report.total}</b>
        </div>
        <div>
          <span>NASA observation groups</span>
          <b>{report.sourceObserved}</b>
        </div>
        <div>
          <span>Pending spatial datasets</span>
          <b>{report.pendingSpatial}</b>
        </div>
        <div>
          <span>Illustrative parameter groups</span>
          <b>{report.synthetic}</b>
        </div>
        <div>
          <span>Agronomic coefficients approved</span>
          <b>{report.coefficientReady}</b>
        </div>
      </div>

      <div className="info-strip">
        <strong>Replacement rule:</strong> NASA and verified soil/GAEZ
        data may support descriptive analysis. A publication alone
        cannot establish an expected yield, soil improvement,
        crop water tolerance or causal rotation effect for this pilot.
      </div>

      <details>
        <summary>
          Audit all {report.total} parameters and scientific restrictions
        </summary>

        {PARAMETER_REGISTRY.map(r => (
          <div className="reference-row" key={r.id}>
            <span>{r.id}</span>

            <p>
              <strong>
                {r.label} — {names[r.sourceClass]}
              </strong>
              <br />

              Source: {r.source}.
              <br />

              {r.studyReference && (
                <>
                  Scientific context: {r.studyReference}.
                  <br />
                </>
              )}

              {r.observedValue && (
                <>
                  Current archive / published example: {r.observedValue}.
                  <br />
                </>
              )}

              Consumer: {r.consumer}.
              <br />

              <strong>Restriction:</strong> {r.restriction}
            </p>
          </div>
        ))}
      </details>

      <p className="muted-note">
        Published literature used for source mapping was collected
        in internal Agronomic Extraction Lots 01–02. Those summaries
        explicitly do not authorize local numeric crop coefficients.
        SoilGrids estimates are spatial model predictions, not soil
        lab results; GAEZ attainable yields are not observed parcel yields.
      </p>

      <p className="muted-note">
        Next data acquisition gates: (1) sourced soil pixel with units,
        depths and uncertainty; (2) FAO GAEZ v5 exact crop × management
        × rainfed layer; (3) locally comparable crop-trial data for
        crop-specific calibration. Until then the existing synthetic
        comparison remains labelled as a demonstration.
      </p>
    </section>
  );
}
