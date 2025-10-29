const OperatorStats = ({
  operatorStatus,
  onBack,
  onOpenSunburst,
  onOpenScatter,
  onOpenTimeline,
}) => {
  const status = operatorStatus?.status ?? { state: 'idle', error: null };
  const rows = operatorStatus?.rows ?? 0;

  const datasetStatusLabel = (() => {
    if (status.state === 'loading') {
      return 'link engaged :: compiling telemetry';
    }
    if (status.state === 'error') {
      return `link failed :: ${status.error ?? 'telemetry offline'}`;
    }
    if (status.state === 'loaded') {
      return `link stable :: ${rows} records cached`;
    }
    return 'link dormant :: awaiting dataset';
  })();

  return (
    <div className="operator-layout">
      <div className="operator-panel operator-panel--stats">
        <div className="operator-header">
          <div className="operator-header-stack">
            <div className="operator-subtitle">analytics uplink</div>
            <div className="operator-title">operator stats</div>
          </div>
          <div className="operator-actions">
            <button type="button" className="dashboard-button" onClick={onBack}>
              return to dashboard
            </button>
          </div>
        </div>
        <div className="operator-status-line">
          <span className="status-indicator" data-state={status.state} />
          {datasetStatusLabel}
        </div>
        <div className="stats-grid">
          <button
            type="button"
            className="stats-card"
            onClick={onOpenSunburst}
          >
            <div className="stats-card__halo">
              <div className="stats-card__halo-ring" />
              <div className="stats-card__halo-ring stats-card__halo-ring--inner" />
              <div className="sunburst-visual">
                <div className="sunburst-visual__ring sunburst-visual__ring--outer" />
                <div className="sunburst-visual__ring sunburst-visual__ring--mid" />
                <div className="sunburst-visual__ring sunburst-visual__ring--inner" />
                <div className="sunburst-visual__core" />
              </div>
            </div>
            <div className="stats-card__content">
              <div className="stats-card__title">Distribution: Sunburst</div>
              <p className="stats-card__copy">
                placeholder node graph illustrating faction and class distribution layers.
              </p>
              <div className="stats-card__meta">visual channel :: primed</div>
            </div>
          </button>
          <button type="button" className="stats-card" onClick={onOpenScatter}>
            <div className="stats-card__halo">
              <div className="stats-card__count">◎</div>
            </div>
            <div className="stats-card__content">
              <div className="stats-card__title">Comparison: Scatter</div>
              <p className="stats-card__copy">
                comparative dispersion of combat metrics with rarity overlay.
              </p>
              <div className="stats-card__meta">visual channel :: ready</div>
            </div>
          </button>
          <button
            type="button"
            className="stats-card"
            onClick={onOpenTimeline}
          >
            <div className="stats-card__halo">
              <div className="stats-card__halo-ring" />
              <div className="stats-card__halo-ring stats-card__halo-ring--inner" />
              <div className="stats-card__count">⟳</div>
            </div>
            <div className="stats-card__content">
              <div className="stats-card__title">Join Date Timeline</div>
              <p className="stats-card__copy">
                cumulative operator onboarding mapped across recorded join dates.
              </p>
              <div className="stats-card__meta">timeline channel :: primed</div>
            </div>
          </button>
          <div className="stats-card" role="presentation">
            <div className="stats-card__halo">
              <div className="stats-card__halo-ring" />
              <div className="stats-card__halo-ring stats-card__halo-ring--inner" />
              <div className="stats-card__count">24</div>
            </div>
            <div className="stats-card__content">
              <div className="stats-card__title">Role Composition</div>
              <p className="stats-card__copy">
                placeholder breakdown of operator archetypes and frontline readiness ratios.
              </p>
              <div className="stats-card__meta">stacked bars :: pending inputs</div>
            </div>
          </div>
          <div className="stats-card" role="presentation">
            <div className="stats-card__halo">
              <div className="stats-card__halo-ring" />
              <div className="stats-card__halo-ring stats-card__halo-ring--inner" />
              <div className="stats-card__count">—</div>
            </div>
            <div className="stats-card__content">
              <div className="stats-card__title">Field Signals</div>
              <p className="stats-card__copy">
                reserved viewport for anomaly detection and tactical alerts visualization.
              </p>
              <div className="stats-card__meta">heatmap channel :: standby</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatorStats;
