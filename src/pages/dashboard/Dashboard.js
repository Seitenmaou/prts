// Primary landing view after login that routes to operator modules.
const Dashboard = ({
  userType,
  onReset,
  onOpenOperatorTable,
  onOpenOperatorStats,
  operatorStatus,
  showOperatorAccess,
  showOperatorStats,
}) => {
  const datasetStatusLabel = (() => {
    if (operatorStatus.status.state === 'loading') {
      return 'refreshing dataset...';
    }
    if (operatorStatus.status.state === 'error') {
      return 'dataset unavailable';
    }
    if (operatorStatus.status.state === 'loaded') {
      return `records cached :: ${operatorStatus.rows}`;
    }
    return 'awaiting sync...';
  })();

  return (
    <div className="dashboard">
      <div className="dashboard-panel">
        <div className="dashboard-header">session granted</div>
        <div className="dashboard-content">
          <h1>Welcome back, {userType}</h1>
          <p>
            channel open :: privileges mapped to
            {' '}
            <span className="dashboard-emphasis">{userType}</span>
          </p>
        </div>
        {(showOperatorAccess || showOperatorStats) && (
          <div className="dashboard-modules">
            {showOperatorStats && (
              <button
                type="button"
                className="module-card module-card--stats"
                onClick={onOpenOperatorStats}
              >
                <span className="module-card__echo" />
                <span className="module-card__chart module-card__chart--primary" />
                <span className="module-card__chart module-card__chart--secondary" />
                <div className="module-card__label">operator stats</div>
                {datasetStatusLabel && (
                  <div className="module-card__status">{datasetStatusLabel}</div>
                )}
              </button>
            )}
            {showOperatorAccess && (
              <button
                type="button"
                className="module-card module-card--operators"
                onClick={onOpenOperatorTable}
              >
                <span className="module-card__stack module-card__stack--base" />
                <span className="module-card__stack module-card__stack--middle" />
                <span className="module-card__stack module-card__stack--top" />
                <div className="module-card__label">operator table</div>
                {datasetStatusLabel && (
                  <div className="module-card__status">{datasetStatusLabel}</div>
                )}
              </button>
            )}
          </div>
        )}
        <button className="dashboard-button" type="button" onClick={onReset}>
          terminate session
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
