import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Plotly from 'plotly.js-dist';
import {
  GRAPH_TEXT_COLOR,
  SCATTER_COLORWAY,
} from '../constants/colorPalettes';

const METRIC_OPTIONS = [
  { key: 'combat_hp', label: 'combat_hp' },
  { key: 'combat_atk', label: 'combat_atk' },
  { key: 'combat_def', label: 'combat_def' },
  { key: 'combat_res', label: 'combat_res' },
  { key: 'combat_cldn', label: 'combat_cldn' },
  { key: 'combat_cost', label: 'combat_cost' },
  { key: 'combat_blk', label: 'combat_blk' },
  { key: 'combat_atkspd', label: 'combat_atkspd' },
];

const sanitizeLabel = (value, fallback) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return fallback;
};

const parseMetricValue = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return null;
    }
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }
  return null;
};

const buildBoxData = (records, metricKey) => {
  if (!Array.isArray(records) || records.length === 0 || !metricKey) {
    return {
      traces: [],
      recordCount: 0,
      classStats: [],
    };
  }

  const metricDefinition = METRIC_OPTIONS.find((metric) => metric.key === metricKey);
  if (!metricDefinition) {
    return {
      traces: [],
      recordCount: 0,
      classStats: [],
    };
  }

  const classValues = new Map();

  records.forEach((record) => {
    const numeric = parseMetricValue(record?.[metricKey]);
    if (numeric === null) {
      return;
    }
    const classLabel = sanitizeLabel(record?.operatorRecords_class, 'unclassified');
    const list = classValues.get(classLabel) ?? [];
    list.push(numeric);
    classValues.set(classLabel, list);
  });

  const classLabels = Array.from(classValues.keys()).sort((a, b) => (
    a.localeCompare(b, 'en', { sensitivity: 'base', numeric: true })
  ));

  const traces = classLabels.map((classLabel, index) => {
    const values = classValues.get(classLabel);
    return {
      type: 'box',
      name: classLabel,
      y: values,
      boxmean: 'sd',
      marker: {
        color: SCATTER_COLORWAY[index % SCATTER_COLORWAY.length],
      },
      hovertemplate: `${metricDefinition.label}<br>${classLabel}: %{y}<extra></extra>`,
      jitter: 0.2,
      pointpos: 0,
      line: { width: 1.5 },
    };
  });

  const recordCount = classLabels.reduce((total, label) => total + classValues.get(label).length, 0);
  const classStats = classLabels.map((label) => ({
    label,
    count: classValues.get(label).length,
  }));

  return {
    traces,
    recordCount,
    classStats,
  };
};

const OperatorBox = ({ operatorStatus, onBack }) => {
  const status = operatorStatus?.status ?? { state: 'idle', error: null };
  const rawRecords = operatorStatus?.data;
  const records = useMemo(
    () => (Array.isArray(rawRecords) ? rawRecords : []),
    [rawRecords],
  );
  const rows = operatorStatus?.rows ?? records.length;
  const plotRef = useRef(null);
  const [selectedMetricKey, setSelectedMetricKey] = useState(METRIC_OPTIONS[0]?.key ?? null);

  const {
    traces,
    recordCount,
    classStats,
  } = useMemo(
    () => buildBoxData(records, selectedMetricKey),
    [records, selectedMetricKey],
  );

  const selectedMetric = useMemo(
    () => METRIC_OPTIONS.find((metric) => metric.key === selectedMetricKey) ?? null,
    [selectedMetricKey],
  );
  const selectedMetricLabel = selectedMetric?.label ?? 'value';

  useEffect(() => {
    const element = plotRef.current;
    if (!element) {
      return () => {};
    }

    if (!traces.length) {
      Plotly.purge(element);
      return () => {};
    }

    const layout = {
      autosize: true,
      margin: { l: 48, r: 12, t: 36, b: 64, pad: 0 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: {
        color: GRAPH_TEXT_COLOR,
      },
      boxmode: 'group',
      boxgap: 0.15,
      boxgroupgap: 0.1,
      xaxis: {
        title: 'operator class',
        tickfont: { color: GRAPH_TEXT_COLOR },
        titlefont: { color: GRAPH_TEXT_COLOR },
      },
      yaxis: {
        title: selectedMetricLabel,
        zeroline: true,
        rangemode: 'tozero',
        tickfont: { color: GRAPH_TEXT_COLOR },
        titlefont: { color: GRAPH_TEXT_COLOR },
      },
      legend: {
        orientation: 'h',
        x: 0,
        y: 1.12,
        bgcolor: 'rgba(0,0,0,0)',
      },
    };

    Plotly.react(element, traces, layout, {
      responsive: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['select2d', 'lasso2d'],
    });

    return () => {
      Plotly.purge(element);
    };
  }, [traces, selectedMetricLabel]);

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

  const isLoaded = status.state === 'loaded';
  const hasRecords = isLoaded && records.length > 0;
  const hasRenderableData = isLoaded && traces.length > 0 && recordCount > 0;

  return (
    <div className="operator-layout">
      <div className="operator-panel operator-panel--stats">
        <div className="operator-header">
          <div className="operator-header-stack">
            <div className="operator-subtitle">analytics uplink</div>
            <div className="operator-title">analysis :: combat status</div>
          </div>
          <div className="operator-actions">
            <button type="button" className="dashboard-button" onClick={onBack}>
              return to stats
            </button>
          </div>
        </div>
        <div className="operator-status-line">
          <span className="status-indicator" data-state={status.state} />
          {datasetStatusLabel}
        </div>
        <div className="box-toolbar">
          <label className="box-toolbar__label" htmlFor="box-metric-select">
            metric channel
          </label>
          <div className="box-toolbar__control">
            <select
              id="box-metric-select"
              value={selectedMetricKey ?? ''}
              onChange={(event) => setSelectedMetricKey(event.target.value)}
              disabled={!METRIC_OPTIONS.length}
            >
              {METRIC_OPTIONS.map((metric) => (
                <option key={metric.key} value={metric.key}>
                  {metric.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {status.state === 'loading' && (
          <div className="operator-placeholder">
            calibrating box-channel arrays...
          </div>
        )}
        {status.state === 'error' && (
          <div className="operator-placeholder operator-placeholder--error">
            unable to render telemetry
          </div>
        )}
        {isLoaded && !hasRecords && (
          <div className="operator-placeholder">
            dataset returned no entries
          </div>
        )}
        {isLoaded && hasRecords && !hasRenderableData && (
          <div className="operator-placeholder">
            operators missing required combat metrics
          </div>
        )}
        {hasRenderableData && (
          <div className="box-shell">
            <div className="box-plot" ref={plotRef} />
            <aside className="box-panel">
              <div className="box-panel__header">class distribution</div>
              <ul className="box-panel__list">
                {classStats.map((entry) => (
                  <li key={entry.label} className="box-panel__item">
                    <span className="box-panel__value">{entry.label}</span>
                    <span className="box-panel__badge">{entry.count}</span>
                  </li>
                ))}
              </ul>
              <div className="box-panel__note">
                metric: {selectedMetric?.label ?? '—'} · samples: {recordCount}
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default OperatorBox;
