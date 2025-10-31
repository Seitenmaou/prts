// Hub page that links to the different analytics visualizations.
const OperatorStats = ({
  operatorStatus,
  onBack,
  onOpenSunburst,
  onOpenScatter,
  onOpenTimeline,
  onOpenBar,
  onOpenParallel,
  onOpenBox,
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
          <button type="button" className="stats-card" onClick={onOpenSunburst}>
            <div className="stats-card__content">
              <div className="stats-card__title">Distribution: Sunburst</div>
              <p className="stats-card__copy">
                placeholder node graph illustrating faction and class distribution layers.
              </p>
              <div className="stats-card__meta">visual channel :: primed</div>
            </div>
          </button>
          <button type="button" className="stats-card" onClick={onOpenScatter}>
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
            <div className="stats-card__content">
              <div className="stats-card__title">Timeline: Join Date</div>
              <p className="stats-card__copy">
                cumulative operator onboarding mapped across recorded join dates.
              </p>
              <div className="stats-card__meta">timeline channel :: primed</div>
            </div>
          </button>
          <button
            type="button"
            className="stats-card"
            onClick={onOpenBar}
          >
            <div className="stats-card__content">
              <div className="stats-card__title">Comparison: Categories</div>
              <p className="stats-card__copy">
                animated breakdowns across rarity, class, gender, species, and affiliation with a join-date slider.
              </p>
              <div className="stats-card__meta">bar channel :: ready</div>
            </div>
          </button>
          <button
            type="button"
            className="stats-card"
            onClick={onOpenParallel}
          >
            <div className="stats-card__content">
              <div className="stats-card__title">Comparison: Parallel</div>
              <p className="stats-card__copy">
                layered parallel coordinates tracking combat metrics with categorical encoding.
              </p>
              <div className="stats-card__meta">parallel channel :: primed</div>
            </div>
          </button>
          <button
            type="button"
            className="stats-card"
            onClick={onOpenBox}
          >
            <div className="stats-card__content">
              <div className="stats-card__title">Analysis: Combat Status</div>
              <p className="stats-card__copy">
                comparative box plots of combat performance segmented by operator class.
              </p>
              <div className="stats-card__meta">box channel :: ready</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OperatorStats;
