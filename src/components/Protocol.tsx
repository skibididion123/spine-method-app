type Props = {
  onBack: () => void
}

const PROGRESSION = [
  {
    weeks: '1–2',
    cycles: '6',
    holdRest: '15 / 45',
    notes: 'Build tolerance, monitor discomfort',
  },
  {
    weeks: '3–4',
    cycles: '8',
    holdRest: '20 / 40',
    notes: 'Foster fluid exchange; moderate strain',
  },
  {
    weeks: '5–6',
    cycles: '8–10',
    holdRest: '20–25 / 40–45',
    notes: 'Enhanced fluid shear; still safe if tolerated',
  },
  {
    weeks: '7–8',
    cycles: '10',
    holdRest: '25 / 40',
    notes: 'Max safe loading; stop at caution symptoms',
  },
] as const

const STUDY_INGREDIENTS = [
  'Vitamin C',
  'Collagen type II',
  'Hyaluronic acid',
  'N-acetyl-glucosamine',
  'Bamboo extract',
  'L-lysine',
] as const

const SUPPLEMENT_STACK = [
  { name: 'Vitamin C (liposomal)', dose: '2,000 mg' },
  { name: 'Collagen Type II', dose: '40 mg' },
  { name: 'Hyaluronic Acid', dose: '120 mg' },
  { name: 'N-Acetyl-Glucosamine', dose: '3,000 mg' },
  { name: 'Bamboo Extract', dose: '150 mg' },
  { name: 'L-Lysine', dose: '750 mg' },
  { name: 'MSM (Methylsulfonylmethane)', dose: '3,000 mg' },
  { name: 'Chondroitin Sulfate', dose: '1,400 mg' },
] as const

export function Protocol({ onBack }: Props) {
  return (
    <div className="screen protocol">
      <header className="protocol-top">
        <button type="button" className="btn-ghost" onClick={onBack}>
          ← Home
        </button>
      </header>

      <header className="masthead">
        <p className="eyebrow">Source document</p>
        <h1 className="wordmark wordmark-sm">Protocol</h1>
        <p className="lede">
          Full write-up from the original Spine Method protocol PDF — session structure,
          progression, and the suggested supplement stack.
        </p>
        <p className="credit">
          Protocol by <strong>guts</strong> / <strong>psl4</strong>
        </p>
      </header>

      <section className="panel">
        <div className="panel-head">
          <h2>Session structure</h2>
          <span className="panel-meta">Baseline session</span>
        </div>

        <dl className="proto-dl">
          <div>
            <dt>Load</dt>
            <dd>Full-body hanging (no added weights)</dd>
          </div>
          <div>
            <dt>On</dt>
            <dd>20 seconds hanging</dd>
          </div>
          <div>
            <dt>Off</dt>
            <dd>
              40 seconds rest — feet lightly tethered to reduce tension, or rest position
            </dd>
          </div>
          <div>
            <dt>Cycles</dt>
            <dd>6–8 per session</dd>
          </div>
          <div>
            <dt>Duration</dt>
            <dd>~8 minutes total</dd>
          </div>
          <div>
            <dt>Frequency</dt>
            <dd>Once daily, 4–5 days per week</dd>
          </div>
        </dl>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Progression plan</h2>
          <span className="panel-meta">6–8 weeks</span>
        </div>

        <div className="proto-table-wrap">
          <table className="proto-table">
            <thead>
              <tr>
                <th>Week</th>
                <th>Cycles</th>
                <th>Hold / Rest</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {PROGRESSION.map((row) => (
                <tr key={row.weeks}>
                  <td data-label="Week">{row.weeks}</td>
                  <td data-label="Cycles">{row.cycles}</td>
                  <td data-label="Hold / Rest">{row.holdRest}s</td>
                  <td data-label="Notes">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Supplements</h2>
          <span className="panel-meta">Background + stack</span>
        </div>

        <div className="proto-prose">
          <p>
            A 2024 randomized, double-blinded, placebo-controlled trial examined a
            nutraceutical supplement for managing lumbar osteochondrosis (
            <a
              href="https://pubmed.ncbi.nlm.nih.gov/39203831/"
              target="_blank"
              rel="noopener noreferrer"
            >
              PubMed 39203831
            </a>
            ). The supplement contained:
          </p>

          <ul className="proto-list">
            {STUDY_INGREDIENTS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <p>
            There were significantly higher 3D-measured volume changes in the supplement
            group (+740.3 ± 796.1 mm³) compared to a decrease in the placebo group (−417.2
            ± 875.0 mm³; p &lt; 0.001).
          </p>

          <p>
            That trial was in osteochondrosis, but the effects map cleanly to increased
            ECM synthesis — which is what this protocol wants. Suggested stack
            incorporating those compounds plus a few more:
          </p>
        </div>

        <div className="proto-table-wrap">
          <table className="proto-table proto-table-stack">
            <thead>
              <tr>
                <th>Supplement</th>
                <th>Dosage</th>
              </tr>
            </thead>
            <tbody>
              {SUPPLEMENT_STACK.map((row) => (
                <tr key={row.name}>
                  <td data-label="Supplement">{row.name}</td>
                  <td data-label="Dosage">{row.dose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="proto-aside">
          Deeper guides on each supplement’s molecular mechanisms may be added later on
          the original server.
        </p>
      </section>

      <footer className="page-foot">
        <p>
          This page restates the original protocol for reference inside the coach app. It
          is not medical advice. Stop if you feel sharp pain, numbness, or joint
          instability.
        </p>
        <p className="credit-foot">
          Original protocol by <strong>guts</strong> / <strong>psl4</strong>
        </p>
      </footer>
    </div>
  )
}
